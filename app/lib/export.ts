// ---------------------------------------------------------------------------
// File export utilities: PNG download, single-card PDF, blob helpers
// Ported from public/app.js lines 933-1067
// ---------------------------------------------------------------------------

import { PDFDocument } from "pdf-lib";
import type { AlbumDetail, CardSettings } from "./types";
import {
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  EXPORT_DPI,
  mmToPt,
  slug,
  renderExportCanvas,
  drawCropMarksForCard,
} from "./canvas";

// ---------------------------------------------------------------------------
// Blob / bytes helpers (app.js lines 933-946)
// ---------------------------------------------------------------------------

/** Convert a canvas to a Blob (promisified version of canvas.toBlob). */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Failed to create image."));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

/** Convert a canvas to a Uint8Array of the encoded image bytes. */
export async function canvasToBytes(
  canvas: HTMLCanvasElement,
  type: string = "image/png",
  quality?: number,
): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, type, quality);
  return new Uint8Array(await blob.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Download helper (app.js lines 947-957)
// ---------------------------------------------------------------------------

/** Trigger a browser file download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Single-side PNG download (app.js lines 994-1011)
// ---------------------------------------------------------------------------

/**
 * Render one side of the card at export DPI and download as PNG.
 */
export async function downloadSidePng(
  side: "front" | "back",
  album: AlbumDetail,
  settings: CardSettings,
  coverImage: HTMLImageElement | null,
  qrImage: HTMLImageElement | null,
): Promise<void> {
  const canvas = renderExportCanvas(
    side,
    settings,
    album,
    coverImage,
    qrImage,
    EXPORT_DPI,
  );
  const blob = await canvasToBlob(canvas, "image/png");
  downloadBlob(
    blob,
    `${slug(album.artist)}-${slug(album.title)}-${side}.png`,
  );
}

// ---------------------------------------------------------------------------
// Single-card PDF download (app.js lines 1012-1067)
// ---------------------------------------------------------------------------

/**
 * Create a two-page PDF (front + back) for a single album card,
 * with optional bleed and crop marks.
 */
export async function downloadCardPdf(
  album: AlbumDetail,
  settings: CardSettings,
  coverImage: HTMLImageElement | null,
  qrImage: HTMLImageElement | null,
): Promise<void> {
  const cardW = settings.cardWidthMm || CARD_WIDTH_MM;
  const cardH = settings.cardHeightMm || CARD_HEIGHT_MM;
  const bleedMm = settings.printBleedMm;
  const bleedPt = mmToPt(bleedMm);
  const cropLengthPt = mmToPt(settings.printCropLengthMm);
  const cropOffsetPt = mmToPt(settings.printCropOffsetMm);
  const cropPaddingPt = settings.printCropMarks
    ? cropLengthPt + cropOffsetPt + mmToPt(1.5)
    : mmToPt(1.5);

  const cellW = mmToPt(cardW) + bleedPt * 2;
  const cellH = mmToPt(cardH) + bleedPt * 2;

  const frontCanvas = renderExportCanvas(
    "front",
    settings,
    album,
    coverImage,
    qrImage,
    EXPORT_DPI,
    bleedMm,
  );
  const backCanvas = renderExportCanvas(
    "back",
    settings,
    album,
    coverImage,
    qrImage,
    EXPORT_DPI,
    bleedMm,
  );

  const pdf = await PDFDocument.create();
  const pageW = cellW + cropPaddingPt * 2;
  const pageH = cellH + cropPaddingPt * 2;

  const frontBytes = await canvasToBytes(frontCanvas, "image/png");
  const backBytes = await canvasToBytes(backCanvas, "image/png");

  const frontImage = await pdf.embedPng(frontBytes);
  const backImage = await pdf.embedPng(backBytes);

  const frontPage = pdf.addPage([pageW, pageH]);
  frontPage.drawImage(frontImage, {
    x: cropPaddingPt,
    y: cropPaddingPt,
    width: cellW,
    height: cellH,
  });

  const backPage = pdf.addPage([pageW, pageH]);
  backPage.drawImage(backImage, {
    x: cropPaddingPt,
    y: cropPaddingPt,
    width: cellW,
    height: cellH,
  });

  if (settings.printCropMarks) {
    const trimX = cropPaddingPt + bleedPt;
    const trimY = cropPaddingPt + bleedPt;
    const trimW = mmToPt(cardW);
    const trimH = mmToPt(cardH);
    const cropOpts = { lengthPt: cropLengthPt, offsetPt: cropOffsetPt };
    drawCropMarksForCard(frontPage, trimX, trimY, trimW, trimH, cropOpts);
    drawCropMarksForCard(backPage, trimX, trimY, trimW, trimH, cropOpts);
  }

  const bytes = await pdf.save();
  downloadBlob(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
    `${slug(album.artist)}-${slug(album.title)}-card.pdf`,
  );
}
