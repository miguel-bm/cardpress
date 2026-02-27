// ---------------------------------------------------------------------------
// CSV parsing and album enrichment
// ---------------------------------------------------------------------------

import Papa from "papaparse";
import type { AlbumDetail, CardSettings, ProviderMode, TrackItem } from "./types";
import {
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  GRID_COLS,
  GRID_ROWS,
  getPageSizeMm,
} from "./canvas";
import { fetchJsonOrThrow } from "./api";

// ---------------------------------------------------------------------------
// Print-fit check
// ---------------------------------------------------------------------------

export function checkPrintFit(settings: CardSettings): { fits: boolean; message: string } {
  const pageSize = getPageSizeMm(settings.printPageSize);
  const cardW = settings.cardWidthMm || CARD_WIDTH_MM;
  const cardH = settings.cardHeightMm || CARD_HEIGHT_MM;
  const cellW = cardW + settings.printBleedMm * 2;
  const cellH = cardH + settings.printBleedMm * 2;
  const gridW = GRID_COLS * cellW + (GRID_COLS - 1) * settings.printGapMm;
  const gridH = GRID_ROWS * cellH + (GRID_ROWS - 1) * settings.printGapMm;
  const availW = pageSize.width - settings.printMarginMm * 2;
  const availH = pageSize.height - settings.printMarginMm * 2;

  if (gridW <= availW && gridH <= availH) {
    return { fits: true, message: "" };
  }

  return {
    fits: false,
    message: `Grid is ${gridW.toFixed(1)}x${gridH.toFixed(1)}mm but only ${availW.toFixed(1)}x${availH.toFixed(1)}mm available. Reduce bleed, gap, or margin.`,
  };
}

// ---------------------------------------------------------------------------
// CSV row helpers (app.js lines 1068-1079)
// ---------------------------------------------------------------------------

export type CsvRow = Record<string, string>;

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

// generateBatchPdf was removed — batch CSV import now adds albums to the
// print queue, which uses generateQueuePdf from print-queue.ts.

