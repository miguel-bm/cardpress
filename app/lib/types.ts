// ---------------------------------------------------------------------------
// Shared TypeScript types and constants for Cardpress
// ---------------------------------------------------------------------------

/** Provider identifier returned by the Worker API */
export type ProviderName = "itunes" | "musicbrainz" | "spotify";

/** Provider selection mode (includes "auto" which tries all) */
export type ProviderMode = ProviderName | "auto";

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
  spotifyId?: string;
  spotifyUrl?: string;
  discogsUrl?: string;
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
  backColumnDividerEnabled: boolean;
  backTrackWrapEnabled: boolean;
  backEvenColumns: boolean;

  coverBorderEnabled: boolean;
  coverBorderColor: string;
  coverBorderWidthMm: number;
  coverInsetBorderEnabled: boolean;
  coverInsetBorderColor: string;
  coverInsetBorderWidthMm: number;
  coverBorderRadiusMm: number;

  borderEnabled: boolean;
  borderColor: string;
  borderWidthMm: number;
  cornerRadiusMm: number;

  cardPaddingMm: number;
  coverGapMm: number;
  titleArtistGapMm: number;
  backTopPaddingMm: number;
  backHeaderGapMm: number;

  backHeaderEnabled: boolean;
  trackDurationsEnabled: boolean;
  trackNumberFormat: string;

  qrEnabled: boolean;
  qrContentMode: string;
  qrCustomText: string;
  qrDark: string;
  qrLight: string;
  qrScale: number;

  stripBracketsTitle: boolean;
  stripParensTitle: boolean;
  stripBracketsArtist: boolean;
  stripParensArtist: boolean;
  stripBracketsTracks: boolean;
  stripParensTracks: boolean;

  cardWidthMm: number;
  cardHeightMm: number;
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
  fontFamily: "'Inter', sans-serif",
  textColor: "#2c2a25",
  titleSizePt: 13,
  artistSizePt: 10,
  trackSizePt: 7,
  titleWeight: "700",
  artistWeight: "500",
  trackWeight: "400",
  titleAlign: "left",
  artistAlign: "left",

  frontFillMode: "solid",
  frontBg: "#faf8f4",
  frontBg2: "#f0ece3",
  frontGradientAngle: 160,

  backFillMode: "solid",
  backBg: "#f8f6f2",
  backBg2: "#f0ece3",
  backGradientAngle: 160,
  lineColor: "#a09a8e",
  trackSpacing: 1,
  backReserveBg: "#f2efe9",
  backOverflowMode: "auto",
  backMinTrackSizePt: 6,
  backMaxColumns: 2,
  backColumnGapMm: 2,
  backColumnDividerEnabled: false,
  backTrackWrapEnabled: false,
  backEvenColumns: false,

  coverBorderEnabled: false,
  coverBorderColor: "#ffffff",
  coverBorderWidthMm: 0,
  coverInsetBorderEnabled: false,
  coverInsetBorderColor: "#ffffff",
  coverInsetBorderWidthMm: 1,
  coverBorderRadiusMm: 0,

  borderEnabled: false,
  borderColor: "#a09a8e",
  borderWidthMm: 0.4,
  cornerRadiusMm: 0,

  cardPaddingMm: 3,
  coverGapMm: 3.4,
  titleArtistGapMm: 1.2,
  backTopPaddingMm: 3.5,
  backHeaderGapMm: 1.5,

  backHeaderEnabled: false,
  trackDurationsEnabled: true,
  trackNumberFormat: "padded",
  qrEnabled: true,
  qrContentMode: "title",
  qrCustomText: "",
  qrDark: "#2c2a25",
  qrLight: "#faf8f4",
  qrScale: 0.9,

  stripBracketsTitle: false,
  stripParensTitle: true,
  stripBracketsArtist: false,
  stripParensArtist: false,
  stripBracketsTracks: false,
  stripParensTracks: true,

  cardWidthMm: 63,
  cardHeightMm: 88,
  printPageSize: "A4",
  printGapMm: 2,
  printMarginMm: 3,
  printBleedMm: 1.5,
  printCropMarks: true,
  printCropLengthMm: 3,
  printCropOffsetMm: 1.2,
};

// ---------------------------------------------------------------------------
// Built-in style presets
// ---------------------------------------------------------------------------

export const BUILTIN_PRESETS: Record<string, Partial<CardSettings>> = {
  // -------------------------------------------------------------------------
  // Paper — Clean warm white, the quintessential minimal card.
  // Sharp edges, padded track numbers, strips remaster tags.
  // -------------------------------------------------------------------------
  Paper: {
    fontFamily: "'Inter', sans-serif",
    textColor: "#2c2a25",
    titleWeight: "700",
    artistWeight: "500",
    trackWeight: "400",
    titleAlign: "left",
    artistAlign: "left",
    frontFillMode: "solid",
    frontBg: "#faf8f4",
    frontBg2: "#f0ece3",
    backFillMode: "solid",
    backBg: "#f8f6f2",
    backBg2: "#f0ece3",
    lineColor: "#a09a8e",
    backReserveBg: "#f2efe9",
    borderEnabled: false,
    cornerRadiusMm: 0,
    coverBorderEnabled: false,
    coverBorderRadiusMm: 0,
    coverInsetBorderEnabled: false,
    trackNumberFormat: "padded",
    backHeaderEnabled: false,
    backColumnDividerEnabled: false,
    backEvenColumns: false,
    qrDark: "#2c2a25",
    qrLight: "#faf8f4",
    stripParensTitle: true,
    stripParensTracks: true,
    stripBracketsTitle: false,
    stripBracketsTracks: false,
  },

  // -------------------------------------------------------------------------
  // Slate — Cool gray, professional. Back header shows album info on both
  // sides. Even column distribution for a balanced look.
  // -------------------------------------------------------------------------
  Slate: {
    fontFamily: "'DM Sans', sans-serif",
    textColor: "#1e293b",
    titleWeight: "700",
    artistWeight: "500",
    trackWeight: "400",
    titleAlign: "left",
    artistAlign: "left",
    frontFillMode: "solid",
    frontBg: "#f0f1f4",
    frontBg2: "#e2e4e9",
    backFillMode: "solid",
    backBg: "#f4f5f7",
    backBg2: "#e8eaed",
    lineColor: "#7c8494",
    backReserveBg: "#eaecf0",
    borderEnabled: false,
    cornerRadiusMm: 0,
    coverBorderEnabled: false,
    coverBorderRadiusMm: 1,
    coverInsetBorderEnabled: false,
    trackNumberFormat: "padded",
    backHeaderEnabled: true,
    backColumnDividerEnabled: true,
    backEvenColumns: true,
    cardPaddingMm: 3,
    backTopPaddingMm: 3,
    backHeaderGapMm: 2,
    qrDark: "#1e293b",
    qrLight: "#f0f1f4",
    stripParensTitle: true,
    stripParensTracks: true,
    stripBracketsTitle: false,
    stripBracketsTracks: false,
  },

  // -------------------------------------------------------------------------
  // Midnight — Dark theme with warm amber accents. Generous padding gives
  // the text room to breathe. Gradient backgrounds add depth.
  // -------------------------------------------------------------------------
  Midnight: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textColor: "#e8e4db",
    titleWeight: "700",
    artistWeight: "500",
    trackWeight: "400",
    titleAlign: "left",
    artistAlign: "left",
    frontFillMode: "gradient",
    frontBg: "#1a1b20",
    frontBg2: "#262830",
    frontGradientAngle: 170,
    backFillMode: "gradient",
    backBg: "#1c1d22",
    backBg2: "#24262e",
    backGradientAngle: 190,
    lineColor: "#b8975a",
    backReserveBg: "#222328",
    borderEnabled: false,
    cornerRadiusMm: 0,
    coverBorderEnabled: false,
    coverBorderRadiusMm: 0,
    coverInsetBorderEnabled: false,
    trackNumberFormat: "dot",
    backHeaderEnabled: false,
    backColumnDividerEnabled: false,
    backEvenColumns: false,
    cardPaddingMm: 3.5,
    coverGapMm: 3.8,
    titleArtistGapMm: 1,
    backTopPaddingMm: 4,
    trackSpacing: 1.1,
    qrDark: "#e8e4db",
    qrLight: "#1a1b20",
    stripParensTitle: true,
    stripParensTracks: true,
    stripBracketsTitle: true,
    stripBracketsTracks: true,
  },

  // -------------------------------------------------------------------------
  // Rosé — Warm blush tones with soft gradients. Subtle inset border on
  // the cover art adds a framed feel. No track numbers for a gallery vibe.
  // -------------------------------------------------------------------------
  "Rosé": {
    fontFamily: "'Outfit', sans-serif",
    textColor: "#3d2e2a",
    titleWeight: "600",
    artistWeight: "400",
    trackWeight: "400",
    titleAlign: "left",
    artistAlign: "left",
    frontFillMode: "gradient",
    frontBg: "#faf5f2",
    frontBg2: "#f3ebe4",
    frontGradientAngle: 160,
    backFillMode: "gradient",
    backBg: "#f9f4f1",
    backBg2: "#f2ebe3",
    backGradientAngle: 175,
    lineColor: "#c4a08a",
    backReserveBg: "#f3ece5",
    borderEnabled: false,
    cornerRadiusMm: 0,
    coverBorderEnabled: false,
    coverBorderRadiusMm: 0,
    coverInsetBorderEnabled: true,
    coverInsetBorderColor: "#ffffff",
    coverInsetBorderWidthMm: 0.8,
    trackNumberFormat: "none",
    trackSpacing: 0.9,
    backHeaderEnabled: false,
    backColumnDividerEnabled: false,
    backEvenColumns: false,
    qrDark: "#3d2e2a",
    qrLight: "#faf5f2",
    stripParensTitle: true,
    stripParensTracks: true,
    stripBracketsTitle: false,
    stripBracketsTracks: false,
  },

  // -------------------------------------------------------------------------
  // Brutalist — High contrast, bold, the one with a border. Thick black
  // card frame, sharp corners, pure black on white. Heavy title weight.
  // -------------------------------------------------------------------------
  Brutalist: {
    fontFamily: "'Space Grotesk', sans-serif",
    textColor: "#000000",
    titleSizePt: 14,
    artistSizePt: 10,
    trackSizePt: 7,
    titleWeight: "700",
    artistWeight: "600",
    trackWeight: "500",
    titleAlign: "left",
    artistAlign: "left",
    frontFillMode: "solid",
    frontBg: "#ffffff",
    frontBg2: "#ffffff",
    backFillMode: "solid",
    backBg: "#ffffff",
    backBg2: "#ffffff",
    lineColor: "#000000",
    backReserveBg: "#f5f5f5",
    borderEnabled: true,
    borderColor: "#000000",
    borderWidthMm: 0.7,
    cornerRadiusMm: 0,
    coverBorderEnabled: false,
    coverBorderRadiusMm: 0,
    coverInsetBorderEnabled: false,
    trackNumberFormat: "dot",
    backHeaderEnabled: true,
    backColumnDividerEnabled: true,
    backEvenColumns: true,
    cardPaddingMm: 3,
    qrDark: "#000000",
    qrLight: "#ffffff",
    stripParensTitle: false,
    stripParensTracks: false,
    stripBracketsTitle: false,
    stripBracketsTracks: false,
  },

  // -------------------------------------------------------------------------
  // Forest — Earthy green tones, organic feel. Soft gradients, rounded
  // cover corners, generous spacing. Column dividers for structure.
  // -------------------------------------------------------------------------
  Forest: {
    fontFamily: "'Work Sans', sans-serif",
    textColor: "#1c2e1e",
    titleWeight: "700",
    artistWeight: "500",
    trackWeight: "400",
    titleAlign: "left",
    artistAlign: "left",
    frontFillMode: "gradient",
    frontBg: "#f4f6f2",
    frontBg2: "#e6ede0",
    frontGradientAngle: 155,
    backFillMode: "gradient",
    backBg: "#f2f5ef",
    backBg2: "#e4ebdd",
    backGradientAngle: 170,
    lineColor: "#6b7f65",
    backReserveBg: "#e8ede3",
    borderEnabled: false,
    cornerRadiusMm: 0,
    coverBorderEnabled: false,
    coverBorderRadiusMm: 1.5,
    coverInsetBorderEnabled: false,
    trackNumberFormat: "padded",
    trackSpacing: 1.1,
    backHeaderEnabled: false,
    backColumnDividerEnabled: true,
    backEvenColumns: true,
    cardPaddingMm: 3.2,
    coverGapMm: 3.6,
    backTopPaddingMm: 3.8,
    qrDark: "#1c2e1e",
    qrLight: "#f4f6f2",
    stripParensTitle: true,
    stripParensTracks: true,
    stripBracketsTitle: false,
    stripBracketsTracks: false,
  },
};
