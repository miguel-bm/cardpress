import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAlbum } from "../../context/AlbumContext";
import { searchAlbums, fetchAlbum } from "../../lib/api";
import { mapWithConcurrency } from "../../lib/csv";
import type { AlbumDetail, ProviderMode } from "../../lib/types";
import Modal from "../ui/Modal";
import AlbumReviewList, { type ReviewItem } from "./AlbumReviewList";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_OPTIONS: { value: ProviderMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "itunes", label: "iTunes" },
  { value: "musicbrainz", label: "MusicBrainz" },
];

const MAX_CANDIDATES = 5;
const CONCURRENCY = 4;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (albums: AlbumDetail[]) => void;
}

// ---------------------------------------------------------------------------
// QuickAddModal
// ---------------------------------------------------------------------------

export default function QuickAddModal({ open, onClose, onImport }: Props) {
  const { provider, setProvider } = useAlbum();

  // Phase: "input" or "review"
  const [phase, setPhase] = useState<"input" | "review">("input");
  const [text, setText] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [searchProgress, setSearchProgress] = useState({ done: 0, total: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  // ------- Helpers -------

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  function reset() {
    setPhase("input");
    setText("");
    setReviewItems([]);
    setSearchProgress({ done: 0, total: 0 });
    setIsSearching(false);
    setIsImporting(false);
    setImportProgress({ done: 0, total: 0 });
  }

  function handleClose() {
    if (isSearching || isImporting) return;
    reset();
    onClose();
  }

  // ------- Phase 1 → Phase 2: Search -------

  async function handleSearchAll() {
    if (!lines.length) return;

    // Initialize review items as "searching"
    const initial: ReviewItem[] = lines.map((query) => ({
      query,
      status: "searching",
      candidates: [],
      selectedIndex: 0,
    }));
    setReviewItems(initial);
    setPhase("review");
    setIsSearching(true);
    setSearchProgress({ done: 0, total: lines.length });

    await mapWithConcurrency(
      lines,
      CONCURRENCY,
      async (query, idx) => {
        try {
          const results = await searchAlbums(query, provider);
          const candidates = results.slice(0, MAX_CANDIDATES);
          setReviewItems((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    status: candidates.length > 0 ? "found" : "not_found",
                    candidates,
                  }
                : item,
            ),
          );
        } catch {
          setReviewItems((prev) =>
            prev.map((item, i) =>
              i === idx ? { ...item, status: "not_found" } : item,
            ),
          );
        }
      },
      (done, total) => setSearchProgress({ done, total }),
    );

    setIsSearching(false);
  }

  // ------- Review callbacks -------

  const handleChangeSelection = useCallback(
    (index: number, candidateIndex: number) => {
      setReviewItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, selectedIndex: candidateIndex } : item,
        ),
      );
    },
    [],
  );

  const handleRemove = useCallback((index: number) => {
    setReviewItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ------- Phase 2 confirm: fetch full details -------

  const foundItems = reviewItems.filter((r) => r.status === "found");

  async function handleAddToQueue() {
    if (!foundItems.length) return;
    setIsImporting(true);
    setImportProgress({ done: 0, total: foundItems.length });

    try {
      const albums = await mapWithConcurrency(
        foundItems,
        CONCURRENCY,
        async (item) => {
          const candidate = item.candidates[item.selectedIndex] ?? item.candidates[0];
          return fetchAlbum(candidate.id, candidate.source);
        },
        (done, total) => setImportProgress({ done, total }),
      );

      onImport(albums);
      toast.success(
        `Added ${albums.length} album${albums.length !== 1 ? "s" : ""} to queue`,
      );
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed.";
      toast.error("Failed to add albums: " + message);
    } finally {
      setIsImporting(false);
    }
  }

  // ------- Render -------

  return (
    <Modal open={open} onClose={handleClose} title="Quick Add" maxWidth="max-w-xl">
      {phase === "input" && (
        <div className="space-y-5">
          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste album names, one per line..."
            rows={8}
            className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 resize-y focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
          />

          {/* Provider */}
          <div className="flex items-center justify-between">
            <label htmlFor="qa-provider" className="text-sm font-medium text-text">
              Provider
            </label>
            <select
              id="qa-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as ProviderMode)}
              className="bg-surface-alt border border-border rounded-lg px-3 py-1.5 text-sm text-text cursor-pointer focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSearchAll}
              disabled={lines.length === 0}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Search All
            </button>
          </div>
        </div>
      )}

      {phase === "review" && (
        <div className="space-y-4">
          {/* Progress / summary */}
          {isSearching ? (
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
              <span>Searching {searchProgress.done} / {searchProgress.total}...</span>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Found {foundItems.length} of {reviewItems.length} album{reviewItems.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Review list */}
          <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1">
            <AlbumReviewList
              items={reviewItems}
              onChangeSelection={handleChangeSelection}
              onRemove={handleRemove}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex-1">
              {isImporting && (
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
                  <span>Fetching {importProgress.done} / {importProgress.total}...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase("input");
                  setReviewItems([]);
                }}
                disabled={isSearching || isImporting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAddToQueue}
                disabled={foundItems.length === 0 || isSearching || isImporting}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isImporting
                  ? "Adding..."
                  : `Add ${foundItems.length} to Queue`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
