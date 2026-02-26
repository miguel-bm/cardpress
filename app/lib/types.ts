// ---------------------------------------------------------------------------
// Shared TypeScript types and constants for Album Card Generator
// ---------------------------------------------------------------------------

/** Provider identifier returned by the Worker API */
export type ProviderName = "itunes" | "musicbrainz";

/** Provider selection mode (includes "auto" which tries both) */
export type ProviderMode = "itunes" | "musicbrainz" | "auto";

/** A single result item from `/api/search` */
export interface AlbumSearchItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  trackCount: number;
  source: ProviderName;
}

/** A single track within an album detail */
export interface TrackItem {
  trackNumber: number;
  title: string;
  durationMs: number | null;
  duration: string;
}

/** Full album detail returned by `/api/album` */
export interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  tracks: TrackItem[];
  source: ProviderName;
}

// ---------------------------------------------------------------------------
// Card style settings
// ---------------------------------------------------------------------------

export interface CardSettings {
  fontFamily: string;
  textColor: string;
  titleSizePt: number;
  artistSizePt: number;
  trackSizePt: number;
  titleWeight: string;
  artistWeight: string;
  trackWeight: string;
  titleAlign: string;
  artistAlign: string;

  frontFillMode: string;
  frontBg: string;
  frontBg2: string;
  frontGradientAngle: number;

  backFillMode: string;
  backBg: string;
  backBg2: string;
  backGradientAngle: number;
  lineColor: string;
  trackSpacing: number;
  backReserveBg: string;
  backOverflowMode: string;
  backMinTrackSizePt: number;
  backMaxColumns: number;
  backColumnGapMm: number;

  coverBorderEnabled: boolean;
  coverBorderColor: string;
  coverBorderWidthMm: number;

  borderEnabled: boolean;
  borderColor: string;
  borderWidthMm: number;
  cornerRadiusMm: number;

  qrDark: string;
  qrLight: string;
  qrScale: number;

  printPageSize: string;
  printGapMm: number;
  printMarginMm: number;
  printBleedMm: number;
  printCropMarks: boolean;
  printCropLengthMm: number;
  printCropOffsetMm: number;
}

// ---------------------------------------------------------------------------
// Default settings — mirrors public/app.js lines 113-162
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS: CardSettings = {
  fontFamily: "'Space Grotesk', sans-serif",
  textColor: "#1f1d17",
  titleSizePt: 13,
  artistSizePt: 10,
  trackSizePt: 7,
  titleWeight: "700",
  artistWeight: "600",
  trackWeight: "500",
  titleAlign: "center",
  artistAlign: "center",

  frontFillMode: "solid",
  frontBg: "#f5f3ee",
  frontBg2: "#eadfce",
  frontGradientAngle: 145,

  backFillMode: "solid",
  backBg: "#fbf9f3",
  backBg2: "#ece8dd",
  backGradientAngle: 160,
  lineColor: "#8a8577",
  trackSpacing: 1,
  backReserveBg: "#f4efe4",
  backOverflowMode: "auto",
  backMinTrackSizePt: 6,
  backMaxColumns: 2,
  backColumnGapMm: 2,

  coverBorderEnabled: false,
  coverBorderColor: "#ffffff",
  coverBorderWidthMm: 0,

  borderEnabled: true,
  borderColor: "#8a8577",
  borderWidthMm: 0.4,
  cornerRadiusMm: 2,

  qrDark: "#111111",
  qrLight: "#ffffff",
  qrScale: 0.9,

  printPageSize: "A4",
  printGapMm: 2,
  printMarginMm: 6,
  printBleedMm: 1.5,
  printCropMarks: true,
  printCropLengthMm: 3,
  printCropOffsetMm: 1.2,
};

// ---------------------------------------------------------------------------
// Built-in style presets — mirrors public/app.js lines 27-111
// ---------------------------------------------------------------------------

export const BUILTIN_PRESETS: Record<string, Partial<CardSettings>> = {
  "Warm Minimal": {
    fontFamily: "'Space Grotesk', sans-serif",
    frontFillMode: "solid",
    frontBg: "#f5f3ee",
    frontBg2: "#eadfce",
    frontGradientAngle: 145,
    backFillMode: "solid",
    backBg: "#fbf9f3",
    backBg2: "#ece8dd",
    backGradientAngle: 160,
    textColor: "#1f1d17",
    lineColor: "#8a8577",
    titleAlign: "center",
    artistAlign: "center",
    borderEnabled: true,
    borderColor: "#8a8577",
    borderWidthMm: 0.4,
    cornerRadiusMm: 2,
    backReserveBg: "#f4efe4",
  },
  "Mono Studio": {
    fontFamily: "'IBM Plex Sans', sans-serif",
    frontFillMode: "gradient",
    frontBg: "#f1f1f1",
    frontBg2: "#dadada",
    frontGradientAngle: 30,
    backFillMode: "gradient",
    backBg: "#f6f6f6",
    backBg2: "#e2e2e2",
    backGradientAngle: 30,
    textColor: "#1f1f1f",
    lineColor: "#5f5f5f",
    titleWeight: "700",
    artistWeight: "500",
    trackWeight: "500",
    qrDark: "#1a1a1a",
    qrLight: "#fdfdfd",
    borderEnabled: true,
    borderColor: "#3a3a3a",
    borderWidthMm: 0.5,
    cornerRadiusMm: 1.5,
    backReserveBg: "#efefef",
  },
  "Night Vinyl": {
    fontFamily: "'Fira Sans', sans-serif",
    frontFillMode: "gradient",
    frontBg: "#23242a",
    frontBg2: "#3b2e31",
    frontGradientAngle: 225,
    backFillMode: "gradient",
    backBg: "#1f2026",
    backBg2: "#2e333d",
    backGradientAngle: 200,
    textColor: "#f3eee5",
    lineColor: "#cba36c",
    borderEnabled: true,
    borderColor: "#cba36c",
    borderWidthMm: 0.5,
    cornerRadiusMm: 3,
    qrDark: "#f3eee5",
    qrLight: "#23242a",
    backReserveBg: "#2d2f36",
  },
  "Ocean Pop": {
    fontFamily: "'Manrope', sans-serif",
    frontFillMode: "gradient",
    frontBg: "#e9f5fb",
    frontBg2: "#c8e6f5",
    frontGradientAngle: 145,
    backFillMode: "gradient",
    backBg: "#eaf9f5",
    backBg2: "#d3efea",
    backGradientAngle: 160,
    textColor: "#123241",
    lineColor: "#2c7285",
    titleAlign: "left",
    artistAlign: "left",
    borderEnabled: true,
    borderColor: "#2c7285",
    borderWidthMm: 0.4,
    cornerRadiusMm: 4,
    backReserveBg: "#d9f0ea",
  },
};
