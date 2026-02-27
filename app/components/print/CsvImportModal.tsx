import { useState } from "react";
import { toast } from "sonner";
import { useAlbum } from "../../context/AlbumContext";
import { buildAlbumFromCsvRow, mapWithConcurrency } from "../../lib/csv";
import type { AlbumDetail, ProviderMode } from "../../lib/types";
import CsvDropZone from "../CsvDropZone";
import Modal from "../ui/Modal";

const PROVIDER_OPTIONS: { value: ProviderMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "itunes", label: "iTunes" },
  { value: "musicbrainz", label: "MusicBrainz" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (albums: AlbumDetail[]) => void;
}

export default function CsvImportModal({ open, onClose, onImport }: Props) {
  const { provider, setProvider } = useAlbum();
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [enrichTracks, setEnrichTracks] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  function handleClose() {
    if (isImporting) return;
    setCsvRows([]);
    setProgressMessage("");
    onClose();
  }

  async function handleImport() {
    if (!csvRows.length) return;
    setIsImporting(true);
    setProgressMessage("Preparing albums...");
    try {
      const albums = await mapWithConcurrency(
        csvRows,
        4,
        async (row) => buildAlbumFromCsvRow(row, provider, enrichTracks),
        (done, total) => setProgressMessage(`Processing ${done} / ${total}...`),
      );
      const valid = albums.filter((a): a is AlbumDetail => a !== null);
      if (!valid.length) {
        toast.error("No valid albums found in CSV.");
        return;
      }
      onImport(valid);
      toast.success(`Imported ${valid.length} album${valid.length !== 1 ? "s" : ""}`);
      setCsvRows([]);
      setProgressMessage("");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed.";
      toast.error("Import failed: " + message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import from CSV" maxWidth="max-w-xl">
      <div className="space-y-5">
        <CsvDropZone onParsed={setCsvRows} />

        {/* Provider */}
        <div className="flex items-center justify-between">
          <label htmlFor="csv-provider" className="text-sm font-medium text-text">
            Provider
          </label>
          <select
            id="csv-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as ProviderMode)}
            className={[
              "bg-surface-alt border border-border rounded-lg px-3 py-1.5",
              "text-sm text-text cursor-pointer",
              "focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus",
            ].join(" ")}
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Enrich tracks toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="csv-enrich" className="text-sm font-medium text-text">
              Fetch track list
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Look up tracks, artist, and cover art via API
            </p>
          </div>
          <button
            id="csv-enrich"
            type="button"
            role="switch"
            aria-checked={enrichTracks}
            onClick={() => setEnrichTracks(!enrichTracks)}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              enrichTracks ? "bg-accent" : "bg-surface-alt border border-border",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                enrichTracks ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="flex-1">
          {isImporting && progressMessage && (
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
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={csvRows.length === 0 || isImporting}
            className={[
              "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-accent text-white hover:bg-accent-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {isImporting
              ? "Importing..."
              : `Import${csvRows.length > 0 ? ` ${csvRows.length} Album${csvRows.length !== 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
