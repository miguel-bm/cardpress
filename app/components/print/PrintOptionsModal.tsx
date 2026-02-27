import { useSettings } from "../../context/SettingsContext";
import { checkPrintFit } from "../../lib/csv";
import type { AlbumDetail } from "../../lib/types";
import Modal from "../ui/Modal";
import PrintProductionSettings from "./PrintProductionSettings";
import SheetPreview from "./SheetPreview";

interface Props {
  open: boolean;
  onClose: () => void;
  albums: AlbumDetail[];
  mirrorBack: boolean;
  setMirrorBack: (value: boolean) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  progressMessage: string;
}

export default function PrintOptionsModal({
  open,
  onClose,
  albums,
  mirrorBack,
  setMirrorBack,
  onGenerate,
  isGenerating,
  progressMessage,
}: Props) {
  const { settings } = useSettings();
  const fitCheck = checkPrintFit(settings);

  return (
    <Modal open={open} onClose={onClose} title="Print Options" maxWidth="max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: settings */}
        <div className="space-y-4">
          <PrintProductionSettings />

          {/* Mirror back toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={mirrorBack}
              onChange={(e) => setMirrorBack(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent/30 w-4 h-4"
            />
            <span className="text-sm text-text">Mirror back side (duplex)</span>
          </label>

          {/* Fit warning */}
          {!fitCheck.fits && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>Print settings don't fit:</strong> {fitCheck.message}
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div>
          <SheetPreview albums={albums} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="flex-1">
          {isGenerating && progressMessage && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <svg
                className="animate-spin h-3.5 w-3.5 text-accent flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{progressMessage}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={albums.length === 0 || isGenerating || !fitCheck.fits}
            className={[
              "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-accent text-white hover:bg-accent-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {isGenerating ? "Generating..." : "Generate PDF"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
