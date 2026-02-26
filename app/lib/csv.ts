// ---------------------------------------------------------------------------
// CSV parsing and batch PDF generation
// Ported from public/app.js lines 1068-1302
// ---------------------------------------------------------------------------

import Papa from "papaparse";
import { PDFDocument } from "pdf-lib";
import type { AlbumDetail, CardSettings, ProviderMode, TrackItem } from "./types";
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
import { fetchJsonOrThrow } from "./api";
import { loadImage, proxyImageUrl, getQrImage } from "./api";
import { canvasToBytes, downloadBlob } from "./export";

// ---------------------------------------------------------------------------
// CSV row helpers (app.js lines 1068-1079)
// ---------------------------------------------------------------------------

type CsvRow = Record<string, string>;

/** Strip BOM and normalize a header key for comparison. */
export function normalizeKey(key: string): string {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase();
}

/** Return the value for the first matching column name, or "". */
export function rowValue(row: CsvRow, candidates: string[]): string {
  const wanted = new Set(candidates.map((item) => item.toLowerCase()));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeKey(key))) return String(value ?? "").trim();
  }
  return "";
}

// ---------------------------------------------------------------------------
// CSV file parsing (app.js lines 1080-1090)
// ---------------------------------------------------------------------------

/** Parse a CSV File using PapaParse. Resolves with an array of row objects. */
export function parseCsvFile(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data || []),
      error: (error: Error) => reject(error),
    });
  });
}

// ---------------------------------------------------------------------------
// Concurrency helper (app.js lines 1091-1111)
// ---------------------------------------------------------------------------

/** Map items with bounded concurrency, calling onProgress after each. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let index = 0;
  let done = 0;

  async function worker(): Promise<void> {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
      done += 1;
      onProgress?.(done, items.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Album-from-CSV-row builder (app.js lines 1112-1144)
// ---------------------------------------------------------------------------

interface AlbumByTextResponse {
  album?: {
    tracks?: TrackItem[];
    artist?: string;
    coverUrl?: string;
  };
}

/**
 * Build an AlbumDetail-like object from a CSV row. If `enrichTracks` is true,
 * we call `/api/album-by-text` to fill in track data, cover, and artist.
 */
export async function buildAlbumFromCsvRow(
  row: CsvRow,
  provider: ProviderMode,
  enrichTracks: boolean,
): Promise<AlbumDetail | null> {
  const title = rowValue(row, ["title", "album", "album title"]);
  if (!title) return null;

  let artist = rowValue(row, [
    "artist",
    "album artist",
    "band",
    "performer",
  ]);
  let coverUrl = rowValue(row, [
    "cover image url",
    "cover url",
    "cover",
    "image url",
    "artwork url",
  ]);
  let tracks: TrackItem[] = [];

  if (enrichTracks) {
    try {
      const params = new URLSearchParams({ title });
      if (artist) params.set("artist", artist);
      params.set("provider", provider);
      const payload = await fetchJsonOrThrow<AlbumByTextResponse>(
        `/api/album-by-text?${params.toString()}`,
      );
      if (payload.album) {
        tracks = payload.album.tracks || [];
        if (!artist) artist = payload.album.artist || artist;
        if (!coverUrl) coverUrl = payload.album.coverUrl || coverUrl;
      }
    } catch {
      // Keep row data even when enrichment fails.
    }
  }

  return {
    id: String(Date.now() + Math.random()),
    title,
    artist: artist || "Unknown Artist",
    coverUrl: coverUrl || null,
    releaseDate: null,
    tracks,
    source: "itunes" as const,
  };
}

// ---------------------------------------------------------------------------
// Batch PDF generation (app.js lines 1188-1302)
// ---------------------------------------------------------------------------

export interface BatchPdfOptions {
  mirrorBack: boolean;
  onProgress?: (message: string) => void;
}

/**
 * Generate a multi-page duplex 3x3 sheet PDF from an array of CSV rows.
 *
 * This is the main batch-print function: it builds album objects from CSV
 * rows (optionally enriching with API data), renders front and back cards,
 * and lays them out on A4/Letter pages in a 3x3 grid with crop marks or
 * grid guides.
 */
export async function generateBatchPdf(
  rows: CsvRow[],
  settings: CardSettings,
  provider: ProviderMode,
  enrichTracks: boolean,
  options: BatchPdfOptions,
): Promise<void> {
  const { mirrorBack, onProgress } = options;

  onProgress?.("Preparing album list...");

  const albums = await mapWithConcurrency(
    rows,
    4,
    async (row) => buildAlbumFromCsvRow(row, provider, enrichTracks),
    (done, total) => onProgress?.(`Preparing albums ${done}/${total}...`),
  );

  const cards = albums.filter(
    (album): album is AlbumDetail => album !== null,
  );
  if (!cards.length) {
    throw new Error("No valid rows found. Ensure CSV has a Title column.");
  }

  onProgress?.("Rendering printable PDF pages...");

  const pdf = await PDFDocument.create();
  const pageSize = getPageSizeMm(settings.printPageSize);
  const pageW = mmToPt(pageSize.width);
  const pageH = mmToPt(pageSize.height);
  const cardW = mmToPt(CARD_WIDTH_MM);
  const cardH = mmToPt(CARD_HEIGHT_MM);
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
    throw new Error(
      "Current print settings do not fit on the selected page size. Reduce bleed/gap/margins.",
    );
  }

  const originX = marginPt + (availableW - gridW) / 2;
  const originYTop = marginPt + (availableH - gridH) / 2;

  const cropOpts = {
    lengthPt: mmToPt(settings.printCropLengthMm),
    offsetPt: mmToPt(settings.printCropOffsetMm),
  };

  for (
    let offset = 0;
    offset < cards.length;
    offset += GRID_COLS * GRID_ROWS
  ) {
    const chunk = cards.slice(offset, offset + GRID_COLS * GRID_ROWS);
    onProgress?.(
      `Rendering page set ${Math.floor(offset / 9) + 1}...`,
    );

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

      // Load cover + QR for this album
      const coverImage = await loadImage(proxyImageUrl(album.coverUrl));
      const qrImage = await getQrImage(
        album.title || "",
        settings.qrDark,
        settings.qrLight,
      );

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
  const filename = `album-cards-3x3-duplex-${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
    filename,
  );

  onProgress?.(`PDF generated with ${cards.length} cards.`);
}
