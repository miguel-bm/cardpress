import { useState, useRef, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { loadImage, proxyImageUrl, getQrImage } from "../../lib/api";
import {
  drawCardToCanvas,
  getPageSizeMm,
  GRID_COLS,
  GRID_ROWS,
} from "../../lib/canvas";
import { resolveQrText } from "../../lib/qr";
import type { AlbumDetail } from "../../lib/types";

// ---------------------------------------------------------------------------
// SheetPreview — miniature 3x3 print sheet preview
// ---------------------------------------------------------------------------

const PAGE_SIZE = GRID_COLS * GRID_ROWS; // 9
const PREVIEW_DPI = 72; // lightweight

interface Props {
  albums: AlbumDetail[];
}

export default function SheetPreview({ albums }: Props) {
  const { settings } = useSettings();
  const [side, setSide] = useState<"front" | "back">("front");
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(albums.length / PAGE_SIZE));

  // Clamp page index
  useEffect(() => {
    if (pageIndex >= pageCount) setPageIndex(Math.max(0, pageCount - 1));
  }, [pageIndex, pageCount]);

  const pageAlbums = albums.slice(
    pageIndex * PAGE_SIZE,
    (pageIndex + 1) * PAGE_SIZE,
  );

  // Page aspect ratio
  const pageSizeMm = getPageSizeMm(settings.printPageSize);
  const aspectRatio = `${pageSizeMm.width} / ${pageSizeMm.height}`;

  return (
    <div className="space-y-2">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Side toggle */}
        <div className="flex items-center rounded-lg bg-surface-alt border border-border p-0.5">
          <button
            type="button"
            className={[
              "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
              side === "front"
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text",
            ].join(" ")}
            onClick={() => setSide("front")}
          >
            Front
          </button>
          <button
            type="button"
            className={[
              "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
              side === "back"
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text",
            ].join(" ")}
            onClick={() => setSide("back")}
          >
            Back
          </button>
        </div>

        {/* Page nav */}
        {pageCount > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <button
              type="button"
              className="p-0.5 hover:text-text disabled:opacity-30 transition-colors"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((p) => p - 1)}
              aria-label="Previous page"
            >
              &lsaquo;
            </button>
            <span className="tabular-nums">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <button
              type="button"
              className="p-0.5 hover:text-text disabled:opacity-30 transition-colors"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setPageIndex((p) => p + 1)}
              aria-label="Next page"
            >
              &rsaquo;
            </button>
          </div>
        )}
      </div>

      {/* Sheet container */}
      <div
        className="relative bg-white border border-border rounded-lg shadow-sm overflow-hidden"
        style={{ aspectRatio }}
      >
        {/* 3x3 grid */}
        <div className="absolute inset-0 p-[4%]">
          <div className="grid grid-cols-3 grid-rows-3 gap-[2%] w-full h-full">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => {
              const album = pageAlbums[i] ?? null;
              return (
                <CellCanvas
                  key={`${pageIndex}-${i}-${album?.id ?? "empty"}`}
                  album={album}
                  side={side}
                  settings={settings}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CellCanvas — renders one card at preview DPI or shows empty placeholder
// ---------------------------------------------------------------------------

interface CellProps {
  album: AlbumDetail | null;
  side: "front" | "back";
  settings: import("../../lib/types").CardSettings;
}

function CellCanvas({ album, side, settings }: CellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!album) {
      // Draw empty placeholder
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 120;
      canvas.height = 168;
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, 120, 168);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#d4d0c8";
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 118, 166);
      return;
    }

    let cancelled = false;

    async function render() {
      if (!album || cancelled) return;

      try {
        const qrText = resolveQrText(settings, album);
        const [coverImage, qrImage] = await Promise.all([
          loadImage(proxyImageUrl(album.coverUrl)),
          settings.qrEnabled && qrText
            ? getQrImage(qrText, settings.qrDark, settings.qrLight)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        drawCardToCanvas(
          canvas!,
          side,
          settings,
          album,
          coverImage,
          qrImage,
          PREVIEW_DPI,
        );
      } catch {
        // Silently fail for preview cells
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [album, side, settings]);

  const cardW = settings.cardWidthMm || 63;
  const cardH = settings.cardHeightMm || 88;
  const radiusPct = ((settings.cornerRadiusMm / cardW) * 100).toFixed(2);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain"
      style={{
        borderRadius: album ? `${radiusPct}%` : "4px",
        aspectRatio: `${cardW} / ${cardH}`,
      }}
    />
  );
}
