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
// CSV row helpers
// ---------------------------------------------------------------------------

export type CsvRow = Record<string, string>;

/** Strip BOM, trim whitespace, and lowercase a header key for comparison. */
export function normalizeKey(key: string): string {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase();
}

/** Get a column value by exact name (case-insensitive). */
export function getColumn(row: CsvRow, name: string): string {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(row)) {
    if (normalizeKey(key) === target) return String(value ?? "").trim();
  }
  return "";
}

// ---------------------------------------------------------------------------
// CSV file parsing
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
// Concurrency helper
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
// Album-from-CSV-row builder
// ---------------------------------------------------------------------------
//
// CSV columns (case-insensitive, column order doesn't matter):
//
//   title     (required) — Album title
//   artist    (optional) — Artist or band name
//   cover_url (optional) — URL to cover artwork image
//   tracks    (optional) — Semicolon-separated track titles,
//                          e.g. "Intro;Main Theme;Credits"
//
// Values containing commas must be quoted per standard CSV rules
// (PapaParse handles this automatically).
// ---------------------------------------------------------------------------

interface AlbumByTextResponse {
  album?: {
    tracks?: TrackItem[];
    artist?: string;
    coverUrl?: string;
  };
}

/** Parse a semicolon-separated tracks string into TrackItem[]. */
function parseTracks(raw: string): TrackItem[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((title, i) => ({
      trackNumber: i + 1,
      title,
      durationMs: null,
      duration: "",
    }));
}

/**
 * Build an AlbumDetail from a CSV row. If `enrichTracks` is true,
 * calls `/api/album-by-text` to fill in tracks, cover, and artist.
 */
export async function buildAlbumFromCsvRow(
  row: CsvRow,
  provider: ProviderMode,
  enrichTracks: boolean,
): Promise<AlbumDetail | null> {
  const title = getColumn(row, "title");
  if (!title) return null;

  let artist = getColumn(row, "artist");
  let coverUrl = getColumn(row, "cover_url");
  let tracks = parseTracks(getColumn(row, "tracks"));

  if (enrichTracks) {
    try {
      const params = new URLSearchParams({ title });
      if (artist) params.set("artist", artist);
      params.set("provider", provider);
      const payload = await fetchJsonOrThrow<AlbumByTextResponse>(
        `/api/album-by-text?${params.toString()}`,
      );
      if (payload.album) {
        if (!tracks.length) tracks = payload.album.tracks || [];
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
    source: provider === "musicbrainz" ? "musicbrainz" : "itunes",
  };
}

