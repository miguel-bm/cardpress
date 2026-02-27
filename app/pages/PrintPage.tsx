import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useSettings } from "../context/SettingsContext";
import { generateQueuePdf } from "../lib/print-queue";
import PrintSearch from "../components/print/PrintSearch";
import PrintQueue from "../components/print/PrintQueue";
import SheetPreview from "../components/print/SheetPreview";
import StylePicker from "../components/print/StylePicker";
import PrintOptionsModal from "../components/print/PrintOptionsModal";
import AlbumEditModal from "../components/print/AlbumEditModal";
import CsvImportModal from "../components/print/CsvImportModal";
import QuickAddModal from "../components/print/QuickAddModal";
import type { AlbumDetail } from "../lib/types";

// ---------------------------------------------------------------------------
// localStorage persistence for the album queue
// ---------------------------------------------------------------------------

const QUEUE_STORAGE_KEY = "album-card-print-queue-v1";

function loadQueueFromStorage(): AlbumDetail[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueueToStorage(albums: AlbumDetail[]): void {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(albums));
}

// ---------------------------------------------------------------------------
// PrintPage — visual album queue with sheet preview + PDF generation
// ---------------------------------------------------------------------------

export default function PrintPage() {
  const { settings } = useSettings();

  const [albums, setAlbums] = useState<AlbumDetail[]>(loadQueueFromStorage);
  const [mirrorBack, setMirrorBack] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  // Modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Persist queue to localStorage on every change
  useEffect(() => {
    saveQueueToStorage(albums);
  }, [albums]);

  // Queue operations
  const handleAdd = useCallback((album: AlbumDetail) => {
    setAlbums((prev) => [...prev, album]);
    toast.success(`Added "${album.title}"`);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setAlbums((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    setAlbums((prev) => {
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setAlbums((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setAlbums([]);
  }, []);

  // Album editing
  const handleEdit = useCallback((index: number) => {
    setEditIndex(index);
  }, []);

  const handleSaveEdit = useCallback(
    (updated: AlbumDetail) => {
      setAlbums((prev) => prev.map((a, i) => (i === editIndex ? updated : a)));
      setEditIndex(null);
    },
    [editIndex],
  );

  // CSV / Quick Add import
  const handleBulkImport = useCallback((imported: AlbumDetail[]) => {
    setAlbums((prev) => [...prev, ...imported]);
  }, []);

  // PDF generation (called from modal)
  async function handleGenerate() {
    if (!albums.length) return;
    setIsGenerating(true);
    setProgressMessage("Starting PDF generation...");
    try {
      await generateQueuePdf(albums, settings, {
        mirrorBack,
        onProgress: (msg: string) => setProgressMessage(msg),
      });
      toast.success(`PDF generated — ${albums.length} cards`);
      setShowPrintModal(false);
    } catch (err) {
      console.error("Print generation failed:", err);
      const message =
        err instanceof Error ? err.message : "Generation failed.";
      setProgressMessage(message);
      toast.error("Generation failed: " + message);
    } finally {
      setIsGenerating(false);
    }
  }

  const editAlbum = editIndex !== null ? albums[editIndex] : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(400px,3fr)_minmax(300px,2fr)] gap-6 lg:gap-8 items-start">
        {/* Left column: search + queue */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-text">Print Queue</h1>
              <p className="text-sm text-text-muted">
                Search albums, build your queue, and generate a duplex-ready PDF.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text hover:border-text-muted transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Quick Add
              </button>
              <button
                type="button"
                onClick={() => setShowCsvModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text hover:border-text-muted transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import CSV
              </button>
            </div>
          </div>

          <PrintSearch onAdd={handleAdd} disabled={isGenerating} />

          <PrintQueue
            albums={albums}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onClear={handleClear}
            onEdit={handleEdit}
          />
        </div>

        {/* Right column: style + preview + generate */}
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] flex flex-col gap-4 order-first lg:order-none">
          <StylePicker />

          <SheetPreview albums={albums} />

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            disabled={albums.length === 0}
            className={[
              "w-full py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-accent text-white hover:bg-accent-hover",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            Generate PDF
          </button>
        </div>
      </div>

      {/* Modals */}
      <PrintOptionsModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        albums={albums}
        mirrorBack={mirrorBack}
        setMirrorBack={setMirrorBack}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        progressMessage={progressMessage}
      />

      {editAlbum && (
        <AlbumEditModal
          open={editIndex !== null}
          onClose={() => setEditIndex(null)}
          album={editAlbum}
          onSave={handleSaveEdit}
        />
      )}

      <CsvImportModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImport={handleBulkImport}
      />

      <QuickAddModal
        open={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}
