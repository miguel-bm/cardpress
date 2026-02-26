import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSettings } from "../context/SettingsContext";
import { useAlbum } from "../context/AlbumContext";
import { loadImage, proxyImageUrl, getQrImage } from "../lib/api";
import { downloadSidePng, downloadCardPdf } from "../lib/export";

// ---------------------------------------------------------------------------
// Spinner icon for button loading state
// ---------------------------------------------------------------------------

function ButtonSpinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Button styling
// ---------------------------------------------------------------------------

const BTN_CLASS = [
  "rounded-lg border border-border bg-surface text-sm font-medium",
  "px-3 py-2.5 min-h-[44px]",
  "hover:bg-surface-alt transition-colors",
  "disabled:opacity-40 disabled:cursor-not-allowed",
  "flex items-center justify-center gap-1.5",
].join(" ");

// ---------------------------------------------------------------------------
// ExportActions — row of export buttons (Front PNG, Back PNG, Card PDF)
// ---------------------------------------------------------------------------

export default function ExportActions() {
  const { settings } = useSettings();
  const { album } = useAlbum();

  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  // Shared helper: load cover + QR images for the current album
  const loadAssets = useCallback(async () => {
    if (!album) return { coverImage: null, qrImage: null };

    const [coverImage, qrImage] = await Promise.all([
      loadImage(proxyImageUrl(album.coverUrl)),
      getQrImage(album.id, settings.qrDark, settings.qrLight),
    ]);

    return { coverImage, qrImage };
  }, [album, settings.qrDark, settings.qrLight]);

  // Export handlers
  const handleFrontPng = useCallback(async () => {
    if (!album) return;
    setLoadingKey("front");
    try {
      const { coverImage, qrImage } = await loadAssets();
      await downloadSidePng("front", album, settings, coverImage, qrImage);
      toast.success("Front PNG downloaded");
    } catch (err) {
      toast.error(
        "Export failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
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
      toast.error(
        "Export failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
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
      toast.error(
        "Export failed: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoadingKey(null);
    }
  }, [album, settings, loadAssets]);

  const disabled = !album || loadingKey !== null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <motion.button
        type="button"
        className={BTN_CLASS}
        disabled={disabled}
        onClick={handleFrontPng}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
      >
        {loadingKey === "front" ? <ButtonSpinner /> : null}
        {loadingKey === "front" ? "Exporting..." : "Front PNG"}
      </motion.button>

      <motion.button
        type="button"
        className={BTN_CLASS}
        disabled={disabled}
        onClick={handleBackPng}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
      >
        {loadingKey === "back" ? <ButtonSpinner /> : null}
        {loadingKey === "back" ? "Exporting..." : "Back PNG"}
      </motion.button>

      <motion.button
        type="button"
        className={BTN_CLASS}
        disabled={disabled}
        onClick={handlePdf}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
      >
        {loadingKey === "pdf" ? <ButtonSpinner /> : null}
        {loadingKey === "pdf" ? "Exporting..." : "Card PDF"}
      </motion.button>
    </div>
  );
}
