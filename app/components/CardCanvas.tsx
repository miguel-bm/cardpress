import { useRef, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useAlbum } from "../context/AlbumContext";
import { loadImage, proxyImageUrl, getQrImage } from "../lib/api";
import {
  drawCardToCanvas,
  drawPlaceholder,
  mmToPx,
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  PREVIEW_DPI,
} from "../lib/canvas";

// ---------------------------------------------------------------------------
// CardCanvas — renders one side (front or back) of an album card
// ---------------------------------------------------------------------------

interface CardCanvasProps {
  side: "front" | "back";
  className?: string;
}

export default function CardCanvas({ side, className }: CardCanvasProps) {
  const { settings } = useSettings();
  const { album } = useAlbum();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution to match card dimensions at preview DPI
    canvas.width = Math.round(mmToPx(CARD_WIDTH_MM, PREVIEW_DPI));
    canvas.height = Math.round(mmToPx(CARD_HEIGHT_MM, PREVIEW_DPI));

    if (!album) {
      drawPlaceholder(canvas, "Search for an album");
      return;
    }

    // Abort pattern: track whether this effect has been cleaned up
    let cancelled = false;

    async function render() {
      if (!album) return;

      try {
        const [coverImage, qrImage] = await Promise.all([
          loadImage(proxyImageUrl(album.coverUrl)),
          getQrImage(album.id, settings.qrDark, settings.qrLight),
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
        if (!cancelled && canvas) {
          drawPlaceholder(canvas, "Failed to load");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [album, settings, side]);

  return (
    <canvas
      ref={canvasRef}
      className={[
        "w-full aspect-[63/88] rounded-xl border border-border bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
