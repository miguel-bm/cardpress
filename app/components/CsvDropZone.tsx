import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { parseCsvFile } from "../lib/csv";

// ---------------------------------------------------------------------------
// Upload icon SVG
// ---------------------------------------------------------------------------

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CsvDropZone — drag-and-drop CSV file upload
// ---------------------------------------------------------------------------

interface CsvDropZoneProps {
  onParsed: (rows: Record<string, string>[]) => void;
}

export default function CsvDropZone({ onParsed }: CsvDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const rows = await parseCsvFile(file);
        setFileName(file.name);
        setRowCount(rows.length);
        onParsed(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV file.");
        setFileName(null);
        setRowCount(0);
        onParsed([]);
      }
    },
    [onParsed],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so re-selecting the same file triggers change
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    setFileName(null);
    setRowCount(0);
    setError(null);
    onParsed([]);
  }, [onParsed]);

  const handleClick = useCallback(() => {
    if (!fileName) inputRef.current?.click();
  }, [fileName]);

  // -- File loaded state ---------------------------------------------------

  if (fileName) {
    return (
      <div className="border-2 border-border rounded-xl p-8 text-center bg-surface">
        <div className="flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-text-muted flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div className="text-sm font-medium text-text">{fileName}</div>
          <span className="text-xs text-text-muted">
            {rowCount} {rowCount === 1 ? "row" : "rows"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="mt-3 text-xs text-text-muted underline hover:text-text transition-colors"
        >
          Remove
        </button>
      </div>
    );
  }

  // -- Default / drag-over state -------------------------------------------

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
        isDragOver
          ? "border-accent bg-surface-alt"
          : "border-border hover:border-text-faint",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload CSV file"
      />

      <div className="flex flex-col items-center gap-3">
        <UploadIcon className={isDragOver ? "text-accent" : "text-text-faint"} />
        <div>
          <p className="text-sm font-medium text-text">
            Drag &amp; drop a CSV file or click to browse
          </p>
          <p className="text-xs text-text-muted mt-1">
            Columns: <span className="font-medium">title</span> (required), <span className="font-medium">artist</span>, <span className="font-medium">cover_url</span>, <span className="font-medium">tracks</span>
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
