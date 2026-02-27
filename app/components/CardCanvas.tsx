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
import { resolveQrText } from "../lib/qr";

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

  const cardW = settings.cardWidthMm || CARD_WIDTH_MM;
  const cardH = settings.cardHeightMm || CARD_HEIGHT_MM;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = Math.round(mmToPx(cardW, PREVIEW_DPI));
    canvas.height = Math.round(mmToPx(cardH, PREVIEW_DPI));

    if (!album) {
      drawPlaceholder(canvas, "Search for an album");
      return;
    }

    let cancelled = false;

    async function render() {
      if (!album) return;

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
        if (!cancelled && canvas) {
          drawPlaceholder(canvas, "Failed to load");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [album, settings, side, cardW, cardH]);

  const radiusPct = ((settings.cornerRadiusMm / cardW) * 100).toFixed(2);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: `${radiusPct}%`,
        aspectRatio: `${cardW} / ${cardH}`,
      }}
      className={[
        "w-full border border-border bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
