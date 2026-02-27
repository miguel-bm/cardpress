import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useSettings } from "../context/SettingsContext";
import { useAlbum } from "../context/AlbumContext";
import { loadImage, proxyImageUrl, getQrImage } from "../lib/api";
import { downloadSidePng, downloadCardPdf } from "../lib/export";
import { resolveQrText } from "../lib/qr";

// ---------------------------------------------------------------------------
// Compact download icon (arrow-down-tray, 14px)
// ---------------------------------------------------------------------------

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ExportActions — compact row of export links
// ---------------------------------------------------------------------------

export default function ExportActions() {
  const { settings } = useSettings();
  const { album } = useAlbum();

  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!album) return { coverImage: null, qrImage: null };
    const qrText = resolveQrText(settings, album);
    const [coverImage, qrImage] = await Promise.all([
      loadImage(proxyImageUrl(album.coverUrl)),
      settings.qrEnabled && qrText
        ? getQrImage(qrText, settings.qrDark, settings.qrLight)
        : Promise.resolve(null),
    ]);
    return { coverImage, qrImage };
  }, [album, settings]);

  const handleFrontPng = useCallback(async () => {
    if (!album) return;
    setLoadingKey("front");
    try {
      const { coverImage, qrImage } = await loadAssets();
      await downloadSidePng("front", album, settings, coverImage, qrImage);
      toast.success("Front PNG downloaded");
    } catch (err) {
      toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoadingKey(null);
    }
  }, [album, settings, loadAssets]);

  const handleBackPng = useCallback(async () => {
    if (!album) return;
    setLoadingKey("back");
    try {
      const { coverImage, qrImage } = await loadAssets();
      await downloadSidePng("back", album, settings, coverImage, qrImage);
      toast.success("Back PNG downloaded");
    } catch (err) {
      toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoadingKey(null);
    }
  }, [album, settings, loadAssets]);

  const handlePdf = useCallback(async () => {
    if (!album) return;
    setLoadingKey("pdf");
    try {
      const { coverImage, qrImage } = await loadAssets();
      await downloadCardPdf(album, settings, coverImage, qrImage);
      toast.success("Card PDF downloaded");
    } catch (err) {
      toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoadingKey(null);
    }
  }, [album, settings, loadAssets]);

  const disabled = !album || loadingKey !== null;

  const linkClass = [
    "inline-flex items-center gap-1 text-xs text-text-muted",
    "hover:text-text transition-colors",
    "disabled:opacity-30 disabled:cursor-not-allowed",
  ].join(" ");

  return (
    <div className="flex items-center justify-center gap-4">
      <button type="button" className={linkClass} disabled={disabled} onClick={handleFrontPng}>
        {loadingKey === "front" ? <Spinner /> : <DownloadIcon />}
        Front
      </button>
      <span className="text-border">|</span>
      <button type="button" className={linkClass} disabled={disabled} onClick={handleBackPng}>
        {loadingKey === "back" ? <Spinner /> : <DownloadIcon />}
        Back
      </button>
      <span className="text-border">|</span>
      <button type="button" className={linkClass} disabled={disabled} onClick={handlePdf}>
        {loadingKey === "pdf" ? <Spinner /> : <DownloadIcon />}
        PDF
      </button>
    </div>
  );
}
