// ---------------------------------------------------------------------------
// Pure canvas rendering functions for Album Card Generator
// Ported 1:1 from public/app.js — preserves all rendering math exactly.
// ---------------------------------------------------------------------------

import type { AlbumDetail, CardSettings } from "./types";

// ---------------------------------------------------------------------------
// Constants (app.js lines 5-18)
// ---------------------------------------------------------------------------

export const CARD_WIDTH_MM = 63;
export const CARD_HEIGHT_MM = 88;
export const BACK_RESERVED_MM = 25;

export const PREVIEW_DPI = 160;
export const EXPORT_DPI = 300;
export const SHEET_DPI = 240;

export const GRID_COLS = 3;
export const GRID_ROWS = 3;

export const PAGE_SIZES_MM: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
};

// ---------------------------------------------------------------------------
// Utility functions (app.js lines 282-304)
// ---------------------------------------------------------------------------

export function mmToPx(mm: number, dpi: number): number {
  return (mm / 25.4) * dpi;
}

export function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

export function getPageSizeMm(pageSize: string): { width: number; height: number } {
  return PAGE_SIZES_MM[pageSize] || PAGE_SIZES_MM.A4;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "--:--";
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "album"
  );
}

// ---------------------------------------------------------------------------
// Canvas primitives (app.js lines 436-547)
// ---------------------------------------------------------------------------

export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}\u2026`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}\u2026`;
}

export function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  primary: string,
  secondary: string,
  angleDeg: number,
): CanvasGradient {
  const angle = (angleDeg * Math.PI) / 180;
  const halfDiagonal = Math.sqrt(width * width + height * height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(angle) * halfDiagonal;
  const dy = Math.sin(angle) * halfDiagonal;
  const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(1, secondary);
  return gradient;
}

export function fillBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: string,
  primary: string,
  secondary: string,
  angle: number,
): void {
  if (mode === "gradient") {
    ctx.fillStyle = createGradient(ctx, width, height, primary, secondary, angle);
  } else {
    ctx.fillStyle = primary;
  }
  ctx.fillRect(0, 0, width, height);
}

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
  settings: CardSettings,
  pxPerMm: number,
): void {
  if (!img) {
    ctx.fillStyle = "#d9d4c7";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#726a5b";
    ctx.font = `${Math.round(size * 0.04)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No Cover", x + size / 2, y + size / 2);
    return;
  }

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const srcSize = Math.min(srcW, srcH);
  const srcX = (srcW - srcSize) / 2;
  const srcY = (srcH - srcSize) / 2;
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, x, y, size, size);

  if (settings.coverBorderEnabled && settings.coverBorderWidthMm > 0) {
    ctx.strokeStyle = settings.coverBorderColor;
    ctx.lineWidth = settings.coverBorderWidthMm * pxPerMm;
    ctx.strokeRect(
      x + ctx.lineWidth / 2,
      y + ctx.lineWidth / 2,
      size - ctx.lineWidth,
      size - ctx.lineWidth,
    );
  }
}

export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  align: CanvasTextAlign,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return startY;

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth || current === "") {
      current = attempt;
    } else {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;

  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[maxLines - 1] = fitText(ctx, lines[maxLines - 1], maxWidth);
  }

  ctx.textAlign = align;
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  return y;
}

export function getAlignedTextX(
  align: string,
  pad: number,
  width: number,
): number {
  if (align === "left") return pad;
  if (align === "right") return width - pad;
  return width / 2;
}

// ---------------------------------------------------------------------------
// Track layout (app.js lines 549-625)
// ---------------------------------------------------------------------------

export interface TrackLayoutResult {
  columns: number;
  fontPx: number;
  lineHeight: number;
  maxRows: number;
  columnGap: number;
  columnWidth: number;
  durationWidth: number;
  trackWidth: number;
  visible: number;
  fits: boolean;
}

export interface TrackLayoutOpts {
  mode: string;
  baseFontPx: number;
  minFontPx: number;
  fontStepPx: number;
  maxColumns: number;
  areaWidth: number;
  areaHeight: number;
  rowGap: number;
  columnGapPx: number;
  durationBasePx: number;
  durationMinPx: number;
  durationGapPx: number;
  minTrackTextPx: number;
  minColumnWidthPx: number;
}

export function buildTrackLayoutCandidates(
  mode: string,
  maxColumns: number,
): number[] {
  const cappedColumns = Math.max(1, Math.round(maxColumns));
  const multiColumns: number[] = [];
  for (let col = 2; col <= cappedColumns; col += 1) {
    multiColumns.push(col);
  }

  if (mode === "downscale") {
    return [1];
  }
  if (mode === "multi-column") {
    return multiColumns.length ? [...multiColumns, 1] : [1];
  }
  return [1, ...multiColumns];
}

export function computeTrackLayout(
  ctx: CanvasRenderingContext2D,
  tracks: unknown[],
  opts: TrackLayoutOpts,
): TrackLayoutResult {
  const fonts: number[] = [];
  let font = opts.baseFontPx;
  while (font >= opts.minFontPx - 0.001) {
    fonts.push(font);
    font -= opts.fontStepPx;
  }
  if (!fonts.length) fonts.push(opts.baseFontPx);

  const columnsToTry = buildTrackLayoutCandidates(opts.mode, opts.maxColumns);
  let best: TrackLayoutResult | null = null;

  for (const columns of columnsToTry) {
    for (const fontPx of fonts) {
      const lineHeight = fontPx * 1.22 + opts.rowGap;
      const maxRows = Math.max(1, Math.floor(opts.areaHeight / lineHeight));
      const columnGap = columns > 1 ? opts.columnGapPx : 0;
      const columnWidth = (opts.areaWidth - columnGap * (columns - 1)) / columns;
      if (columnWidth <= opts.minColumnWidthPx) continue;

      const durationWidth = Math.min(
        opts.durationBasePx,
        Math.max(opts.durationMinPx, columnWidth * 0.32),
      );
      const trackWidth = columnWidth - durationWidth - opts.durationGapPx;
      if (trackWidth <= opts.minTrackTextPx) continue;

      const capacity = maxRows * columns;
      const visible = Math.min(tracks.length, capacity);
      const layout: TrackLayoutResult = {
        columns,
        fontPx,
        lineHeight,
        maxRows,
        columnGap,
        columnWidth,
        durationWidth,
        trackWidth,
        visible,
        fits: tracks.length <= capacity,
      };

      if (layout.fits) return layout;
      if (
        !best ||
        layout.visible > best.visible ||
        (layout.visible === best.visible && layout.fontPx > best.fontPx)
      ) {
        best = layout;
      }
    }
  }

  return (
    best || {
      columns: 1,
      fontPx: opts.minFontPx,
      lineHeight: opts.minFontPx * 1.22 + opts.rowGap,
      maxRows: 1,
      columnGap: 0,
      columnWidth: opts.areaWidth,
      durationWidth: opts.durationBasePx,
      trackWidth: Math.max(
        opts.minTrackTextPx,
        opts.areaWidth - opts.durationBasePx - opts.durationGapPx,
      ),
      visible: Math.min(1, tracks.length),
      fits: tracks.length <= 1,
    }
  );
}

// ---------------------------------------------------------------------------
// Card rendering (app.js lines 627-839)
// ---------------------------------------------------------------------------

export function drawFront(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: CardSettings,
  album: AlbumDetail,
  coverImage: HTMLImageElement | null,
  pxPerMm: number,
): void {
  const pxPerPt = (pxPerMm * 25.4) / 72;
  const pad = pxPerMm * 3;
  const coverSize = width;

  fillBackground(
    ctx,
    width,
    height,
    settings.frontFillMode,
    settings.frontBg,
    settings.frontBg2,
    settings.frontGradientAngle,
  );
  drawImageCover(ctx, coverImage, 0, 0, coverSize, settings, pxPerMm);

  const textStartY = coverSize + pxPerMm * 3.4;
  const titleFontPx = settings.titleSizePt * pxPerPt;
  const artistFontPx = settings.artistSizePt * pxPerPt;

  ctx.fillStyle = settings.textColor;
  ctx.textBaseline = "top";

  const titleAlign = settings.titleAlign as CanvasTextAlign;
  const titleX = getAlignedTextX(titleAlign, pad, width);
  ctx.font = `${settings.titleWeight} ${titleFontPx}px ${settings.fontFamily}`;
  const titleBottomY = drawWrappedText(
    ctx,
    album.title,
    titleX,
    textStartY,
    width - pad * 2,
    titleFontPx * 1.18,
    3,
    titleAlign,
  );

  const artistAlign = settings.artistAlign as CanvasTextAlign;
  const artistX = getAlignedTextX(artistAlign, pad, width);
  const artistY = Math.min(
    titleBottomY + pxPerMm * 1.2,
    height - artistFontPx - pxPerMm * 1.5,
  );
  ctx.font = `${settings.artistWeight} ${artistFontPx}px ${settings.fontFamily}`;
  ctx.textAlign = artistAlign;
  ctx.fillText(
    fitText(ctx, album.artist || "Unknown Artist", width - pad * 2),
    artistX,
    artistY,
  );
}

export function drawBack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: CardSettings,
  album: AlbumDetail,
  qrImage: HTMLImageElement | null,
  pxPerMm: number,
): void {
  const pxPerPt = (pxPerMm * 25.4) / 72;
  const reserve = BACK_RESERVED_MM * pxPerMm;
  const pad = pxPerMm * 3;
  const topPad = pxPerMm * 3.5;
  const rowGap = pxPerMm * 0.8 * settings.trackSpacing;
  const lineY = height - reserve;

  fillBackground(
    ctx,
    width,
    height,
    settings.backFillMode,
    settings.backBg,
    settings.backBg2,
    settings.backGradientAngle,
  );

  ctx.fillStyle = settings.backReserveBg;
  ctx.fillRect(0, lineY, width, reserve);

  ctx.strokeStyle = settings.lineColor;
  ctx.lineWidth = Math.max(1, pxPerMm * 0.22);
  ctx.beginPath();
  ctx.moveTo(0, lineY);
  ctx.lineTo(width, lineY);
  ctx.stroke();

  const baseTrackFontPx = settings.trackSizePt * pxPerPt;
  const minTrackFontPx = settings.backMinTrackSizePt * pxPerPt;
  const tracksHeight = lineY - topPad - pxPerMm * 1.5;
  const trackAreaWidth = width - pad * 2;
  const trackLayout = computeTrackLayout(ctx, album.tracks || [], {
    mode: settings.backOverflowMode,
    baseFontPx: baseTrackFontPx,
    minFontPx: Math.min(baseTrackFontPx, minTrackFontPx),
    fontStepPx: Math.max(pxPerPt * 0.5, 0.5),
    maxColumns: settings.backMaxColumns,
    areaWidth: trackAreaWidth,
    areaHeight: tracksHeight,
    rowGap,
    columnGapPx: settings.backColumnGapMm * pxPerMm,
    durationBasePx: pxPerMm * 11,
    durationMinPx: pxPerMm * 6,
    durationGapPx: pxPerMm * 1.2,
    minTrackTextPx: pxPerMm * 8,
    minColumnWidthPx: pxPerMm * 16,
  });

  ctx.fillStyle = settings.textColor;
  ctx.textBaseline = "top";
  ctx.font = `${settings.trackWeight} ${trackLayout.fontPx}px ${settings.fontFamily}`;

  if (!album.tracks.length) {
    ctx.textAlign = "left";
    ctx.fillText("Track list unavailable", pad, topPad + pxPerMm * 2);
  } else {
    const visibleTracks = album.tracks.slice(0, trackLayout.visible);
    visibleTracks.forEach((track, index) => {
      const column = Math.floor(index / trackLayout.maxRows);
      const row = index % trackLayout.maxRows;
      const columnX = pad + column * (trackLayout.columnWidth + trackLayout.columnGap);
      const y = topPad + row * trackLayout.lineHeight;

      ctx.textAlign = "left";
      const label = `${track.trackNumber}. ${track.title}`;
      ctx.fillText(fitText(ctx, label, trackLayout.trackWidth), columnX, y);

      ctx.textAlign = "right";
      const duration = track.duration || formatDuration(track.durationMs ?? NaN);
      ctx.fillText(duration, columnX + trackLayout.columnWidth, y);
    });

    if (album.tracks.length > trackLayout.visible) {
      const noteY = topPad + trackLayout.maxRows * trackLayout.lineHeight;
      if (noteY < lineY - pxPerMm * 1.2) {
        ctx.textAlign = "left";
        ctx.fillText(`+${album.tracks.length - trackLayout.visible} more`, pad, noteY);
      }
    }

    if (trackLayout.columns > 1) {
      ctx.strokeStyle = settings.lineColor;
      ctx.lineWidth = Math.max(1, pxPerMm * 0.16);
      for (let column = 1; column < trackLayout.columns; column += 1) {
        const x =
          pad +
          column * trackLayout.columnWidth +
          (column - 0.5) * trackLayout.columnGap;
        ctx.beginPath();
        ctx.moveTo(x, topPad - pxPerMm * 0.5);
        ctx.lineTo(x, lineY - pxPerMm * 1.2);
        ctx.stroke();
      }
    }

    if (
      trackLayout.columns > 1 ||
      trackLayout.fontPx < baseTrackFontPx - 0.1
    ) {
      ctx.textAlign = "left";
      const modeLabel = `${trackLayout.columns} col / ${(trackLayout.fontPx / pxPerPt * 1).toFixed(1)}pt`;
      ctx.fillText(modeLabel, pad, lineY - pxPerMm * 2.3);
    }
  }

  const innerPad = pxPerMm * 2.2;
  const qrBase = reserve - innerPad * 2;
  const qrSize = qrBase * settings.qrScale;
  const qrX = width - innerPad - qrSize;
  const qrY = lineY + innerPad + (qrBase - qrSize) / 2;

  const blankX = pad;
  const blankY = lineY + innerPad;
  const blankWidth = width - qrBase - pad * 2 - innerPad * 1.4;
  const blankHeight = reserve - innerPad * 2;

  ctx.strokeStyle = settings.lineColor;
  ctx.lineWidth = Math.max(1, pxPerMm * 0.2);
  ctx.strokeRect(blankX, blankY, blankWidth, blankHeight);

  if (qrImage) {
    ctx.fillStyle = settings.qrLight;
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
  }
}

export function drawCardFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: CardSettings,
  pxPerMm: number,
): void {
  if (!settings.borderEnabled || settings.borderWidthMm <= 0) return;

  const borderWidth = settings.borderWidthMm * pxPerMm;
  const radius = settings.cornerRadiusMm * pxPerMm;

  ctx.save();
  roundedRectPath(
    ctx,
    borderWidth / 2,
    borderWidth / 2,
    width - borderWidth,
    height - borderWidth,
    radius,
  );
  ctx.strokeStyle = settings.borderColor;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
  ctx.restore();
}

export function drawCardToCanvas(
  canvas: HTMLCanvasElement,
  side: "front" | "back",
  settings: CardSettings,
  album: AlbumDetail,
  coverImage: HTMLImageElement | null,
  qrImage: HTMLImageElement | null,
  dpi: number,
): void {
  const width = Math.round(mmToPx(CARD_WIDTH_MM, dpi));
  const height = Math.round(mmToPx(CARD_HEIGHT_MM, dpi));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pxPerMm = width / CARD_WIDTH_MM;
  const radius = settings.cornerRadiusMm * pxPerMm;

  ctx.clearRect(0, 0, width, height);
  ctx.save();

  if (radius > 0) {
    roundedRectPath(ctx, 0, 0, width, height, radius);
    ctx.clip();
  }

  if (side === "front") {
    drawFront(ctx, width, height, settings, album, coverImage, pxPerMm);
  } else {
    drawBack(ctx, width, height, settings, album, qrImage, pxPerMm);
  }

  ctx.restore();
  drawCardFrame(ctx, width, height, settings, pxPerMm);
}

export function drawPlaceholder(canvas: HTMLCanvasElement, label: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  fillBackground(ctx, canvas.width, canvas.height, "gradient", "#f3eee1", "#ece4d3", 145);
  ctx.strokeStyle = "#bfb7a5";
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  ctx.fillStyle = "#6d6556";
  ctx.font = `600 ${Math.round(canvas.width * 0.06)}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
}

// ---------------------------------------------------------------------------
// Export helpers (app.js lines 958-993)
// ---------------------------------------------------------------------------

export function extendCanvasWithBleed(
  cardCanvas: HTMLCanvasElement,
  bleedPx: number,
): HTMLCanvasElement {
  if (bleedPx <= 0) return cardCanvas;

  const out = document.createElement("canvas");
  out.width = cardCanvas.width + bleedPx * 2;
  out.height = cardCanvas.height + bleedPx * 2;
  const ctx = out.getContext("2d");
  if (!ctx) return cardCanvas;

  const w = cardCanvas.width;
  const h = cardCanvas.height;
  const b = bleedPx;

  // Center
  ctx.drawImage(cardCanvas, b, b);
  // Edges: top, bottom, left, right
  ctx.drawImage(cardCanvas, 0, 0, w, 1, b, 0, w, b);
  ctx.drawImage(cardCanvas, 0, h - 1, w, 1, b, b + h, w, b);
  ctx.drawImage(cardCanvas, 0, 0, 1, h, 0, b, b, h);
  ctx.drawImage(cardCanvas, w - 1, 0, 1, h, b + w, b, b, h);
  // Corners: top-left, top-right, bottom-left, bottom-right
  ctx.drawImage(cardCanvas, 0, 0, 1, 1, 0, 0, b, b);
  ctx.drawImage(cardCanvas, w - 1, 0, 1, 1, b + w, 0, b, b);
  ctx.drawImage(cardCanvas, 0, h - 1, 1, 1, 0, b + h, b, b);
  ctx.drawImage(cardCanvas, w - 1, h - 1, 1, 1, b + w, b + h, b, b);

  return out;
}

export function renderExportCanvas(
  side: "front" | "back",
  settings: CardSettings,
  album: AlbumDetail,
  coverImage: HTMLImageElement | null,
  qrImage: HTMLImageElement | null,
  dpi: number,
  bleedMm: number = 0,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  drawCardToCanvas(canvas, side, settings, album, coverImage, qrImage, dpi);
  const bleedPx = Math.max(0, Math.round(mmToPx(bleedMm, dpi)));
  return extendCanvasWithBleed(canvas, bleedPx);
}

// ---------------------------------------------------------------------------
// Sheet / print helpers (app.js lines 1145-1187)
//
// These operate on pdf-lib PDFPage objects. We type the page parameter as
// a minimal duck-type so this module does not import pdf-lib directly.
// ---------------------------------------------------------------------------

/** Minimal subset of pdf-lib PDFPage used by the grid/crop helpers */
interface PdfPageLike {
  drawLine(options: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness: number;
    color: { red: number; green: number; blue: number };
  }): void;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

function rgbColor(r: number, g: number, b: number): RgbColor {
  return { red: r, green: g, blue: b };
}

export function drawGridGuides(
  page: PdfPageLike,
  pageHeight: number,
  originX: number,
  originYTop: number,
  cellW: number,
  cellH: number,
  gap: number,
  cols: number,
  rows: number,
): void {
  const color = rgbColor(0.78, 0.78, 0.78);

  for (let col = 0; col <= cols; col += 1) {
    const x = originX + col * (cellW + gap) - (col === cols ? gap : 0);
    const yTop = pageHeight - originYTop;
    const yBottom = pageHeight - (originYTop + rows * cellH + (rows - 1) * gap);
    page.drawLine({
      start: { x, y: yBottom },
      end: { x, y: yTop },
      thickness: 0.38,
      color,
    });
  }

  for (let row = 0; row <= rows; row += 1) {
    const yTopMm = originYTop + row * (cellH + gap) - (row === rows ? gap : 0);
    const y = pageHeight - yTopMm;
    const x1 = originX;
    const x2 = originX + cols * cellW + (cols - 1) * gap;
    page.drawLine({
      start: { x: x1, y },
      end: { x: x2, y },
      thickness: 0.38,
      color,
    });
  }
}

export interface CropMarkOptions {
  lengthPt: number;
  offsetPt: number;
}

export function drawCropMarksForCard(
  page: PdfPageLike,
  trimX: number,
  trimY: number,
  trimW: number,
  trimH: number,
  options: CropMarkOptions,
): void {
  const color = rgbColor(0.15, 0.15, 0.15);
  const length = options.lengthPt;
  const offset = options.offsetPt;
  const thickness = 0.45;

  const left = trimX;
  const right = trimX + trimW;
  const bottom = trimY;
  const top = trimY + trimH;

  // Top-left
  page.drawLine({
    start: { x: left - offset - length, y: top },
    end: { x: left - offset, y: top },
    thickness,
    color,
  });
  page.drawLine({
    start: { x: left, y: top + offset },
    end: { x: left, y: top + offset + length },
    thickness,
    color,
  });

  // Top-right
  page.drawLine({
    start: { x: right + offset, y: top },
    end: { x: right + offset + length, y: top },
    thickness,
    color,
  });
  page.drawLine({
    start: { x: right, y: top + offset },
    end: { x: right, y: top + offset + length },
    thickness,
    color,
  });

  // Bottom-left
  page.drawLine({
    start: { x: left - offset - length, y: bottom },
    end: { x: left - offset, y: bottom },
    thickness,
    color,
  });
  page.drawLine({
    start: { x: left, y: bottom - offset },
    end: { x: left, y: bottom - offset - length },
    thickness,
    color,
  });

  // Bottom-right
  page.drawLine({
    start: { x: right + offset, y: bottom },
    end: { x: right + offset + length, y: bottom },
    thickness,
    color,
  });
  page.drawLine({
    start: { x: right, y: bottom - offset },
    end: { x: right, y: bottom - offset - length },
    thickness,
    color,
  });
}
