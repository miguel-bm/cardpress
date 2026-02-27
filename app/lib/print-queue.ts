// ---------------------------------------------------------------------------
// Print queue PDF generation — takes AlbumDetail[] directly (no CSV parsing)
// Reuses grid layout math from csv.ts / canvas.ts
// ---------------------------------------------------------------------------

import { PDFDocument } from "pdf-lib";
import type { AlbumDetail, CardSettings } from "./types";
import {
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  SHEET_DPI,
  GRID_COLS,
  GRID_ROWS,
  mmToPt,
  getPageSizeMm,
  renderExportCanvas,
  drawGridGuides,
  drawCropMarksForCard,
} from "./canvas";
import { loadImage, proxyImageUrl, getQrImage } from "./api";
import { canvasToBytes, downloadBlob } from "./export";
import { resolveQrText } from "./qr";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface QueuePdfOptions {
  mirrorBack: boolean;
  onProgress?: (message: string) => void;
}

/**
 * Generate a multi-page duplex 3x3 sheet PDF from an array of AlbumDetail.
 * Same grid layout as generateBatchPdf but skips CSV parsing/enrichment.
 */
export async function generateQueuePdf(
  albums: AlbumDetail[],
  settings: CardSettings,
  options: QueuePdfOptions,
): Promise<void> {
  const { mirrorBack, onProgress } = options;

  if (!albums.length) {
    throw new Error("No albums in queue.");
  }

  onProgress?.("Rendering printable PDF pages...");

  const pdf = await PDFDocument.create();
  const pageSize = getPageSizeMm(settings.printPageSize);
  const pageW = mmToPt(pageSize.width);
  const pageH = mmToPt(pageSize.height);
  const settingsCardW = settings.cardWidthMm || CARD_WIDTH_MM;
  const settingsCardH = settings.cardHeightMm || CARD_HEIGHT_MM;
  const cardW = mmToPt(settingsCardW);
  const cardH = mmToPt(settingsCardH);
  const bleedPt = mmToPt(settings.printBleedMm);
  const gap = mmToPt(settings.printGapMm);
  const marginPt = mmToPt(settings.printMarginMm);
  const cellW = cardW + bleedPt * 2;
  const cellH = cardH + bleedPt * 2;

  const gridW = GRID_COLS * cellW + (GRID_COLS - 1) * gap;
  const gridH = GRID_ROWS * cellH + (GRID_ROWS - 1) * gap;
  const availableW = pageW - marginPt * 2;
  const availableH = pageH - marginPt * 2;

  if (gridW > availableW || gridH > availableH) {
    const gridWmm = ((gridW / 72) * 25.4).toFixed(1);
    const gridHmm = ((gridH / 72) * 25.4).toFixed(1);
    const availWmm = ((availableW / 72) * 25.4).toFixed(1);
    const availHmm = ((availableH / 72) * 25.4).toFixed(1);
    throw new Error(
      `Grid is ${gridWmm}x${gridHmm}mm but only ${availWmm}x${availHmm}mm available. Reduce bleed, gap, or margins.`,
    );
  }

  const originX = marginPt + (availableW - gridW) / 2;
  const originYTop = marginPt + (availableH - gridH) / 2;

  const cropOpts = {
    lengthPt: mmToPt(settings.printCropLengthMm),
    offsetPt: mmToPt(settings.printCropOffsetMm),
  };

  const perPage = GRID_COLS * GRID_ROWS;

  for (let offset = 0; offset < albums.length; offset += perPage) {
    const chunk = albums.slice(offset, offset + perPage);
    const pageNum = Math.floor(offset / perPage) + 1;
    onProgress?.(`Rendering page set ${pageNum}...`);

    const frontPage = pdf.addPage([pageW, pageH]);
    const backPage = pdf.addPage([pageW, pageH]);

    if (!settings.printCropMarks) {
      drawGridGuides(
        frontPage,
        pageH,
        originX,
        originYTop,
        cellW,
        cellH,
        gap,
        GRID_COLS,
        GRID_ROWS,
      );
      drawGridGuides(
        backPage,
        pageH,
        originX,
        originYTop,
        cellW,
        cellH,
        gap,
        GRID_COLS,
        GRID_ROWS,
      );
    }

    for (let i = 0; i < chunk.length; i += 1) {
      const album = chunk[i];
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const backCol = mirrorBack ? GRID_COLS - 1 - col : col;

      const xFront = originX + col * (cellW + gap);
      const xBack = originX + backCol * (cellW + gap);

      const yTop = originYTop + row * (cellH + gap);
      const y = pageH - yTop - cellH;

      onProgress?.(
        `Rendering card ${offset + i + 1}/${albums.length}...`,
      );

      // Load cover + QR
      const coverImage = await loadImage(proxyImageUrl(album.coverUrl));
      const qrText = resolveQrText(settings, album);
      const qrImage =
        settings.qrEnabled && qrText
          ? await getQrImage(qrText, settings.qrDark, settings.qrLight)
          : null;

      const frontCanvas = renderExportCanvas(
        "front",
        settings,
        album,
        coverImage,
        qrImage,
        SHEET_DPI,
        settings.printBleedMm,
      );
      const backCanvas = renderExportCanvas(
        "back",
        settings,
        album,
        coverImage,
        qrImage,
        SHEET_DPI,
        settings.printBleedMm,
      );

      const [frontBytes, backBytes] = await Promise.all([
        canvasToBytes(frontCanvas, "image/jpeg", 0.92),
        canvasToBytes(backCanvas, "image/png"),
      ]);

      const frontImage = await pdf.embedJpg(frontBytes);
      const backImage = await pdf.embedPng(backBytes);

      frontPage.drawImage(frontImage, {
        x: xFront,
        y,
        width: cellW,
        height: cellH,
      });
      backPage.drawImage(backImage, {
        x: xBack,
        y,
        width: cellW,
        height: cellH,
      });

      if (settings.printCropMarks) {
        const trimY = y + bleedPt;
        drawCropMarksForCard(
          frontPage,
          xFront + bleedPt,
          trimY,
          cardW,
          cardH,
          cropOpts,
        );
        drawCropMarksForCard(
          backPage,
          xBack + bleedPt,
          trimY,
          cardW,
          cardH,
          cropOpts,
        );
      }
    }
  }

  const bytes = await pdf.save();
  const filename = `cardpress-print-${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
    filename,
  );

  onProgress?.(`PDF generated with ${albums.length} cards.`);
}
