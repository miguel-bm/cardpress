import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { proxyImageUrl } from "../../lib/api";
import type { AlbumDetail } from "../../lib/types";
import { GRID_COLS, GRID_ROWS } from "../../lib/canvas";

// ---------------------------------------------------------------------------
// PrintQueue — reorderable list of albums in the print queue
// ---------------------------------------------------------------------------

const PAGE_SIZE = GRID_COLS * GRID_ROWS; // 9

interface Props {
  albums: AlbumDetail[];
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClear: () => void;
  onEdit?: (index: number) => void;
}

export default function PrintQueue({
  albums,
  onRemove,
  onMoveUp,
  onMoveDown,
  onClear,
  onEdit,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (albums.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-faint"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" />
        </svg>
        <p className="text-sm text-text-muted">Search and add albums above</p>
        <p className="text-xs text-text-faint">
          Albums will appear here as you add them
        </p>
      </div>
    );
  }

  const pageCount = Math.ceil(albums.length / PAGE_SIZE);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-text-muted">
          Queue ({albums.length} album{albums.length !== 1 ? "s" : ""} &middot;{" "}
          {pageCount} page{pageCount !== 1 ? "s" : ""})
        </span>
        {confirmClear ? (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="text-text-muted">Clear all?</span>
            <button
              type="button"
              className="text-red-600 hover:text-red-700 font-medium"
              onClick={() => {
                onClear();
                setConfirmClear(false);
              }}
            >
              Yes
            </button>
            <button
              type="button"
              className="text-text-muted hover:text-text"
              onClick={() => setConfirmClear(false)}
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
            onClick={() => setConfirmClear(true)}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Album list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
        <AnimatePresence initial={false}>
          {albums.map((album, index) => {
            const pageBreak =
              index > 0 && index % PAGE_SIZE === 0;

            return (
              <motion.div
                key={`${album.id}-${index}`}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Page divider */}
                {pageBreak && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-[10px] font-medium text-text-faint uppercase tracking-wider">
                      Page {Math.floor(index / PAGE_SIZE) + 1}
                    </span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                )}

                {/* Album row */}
                <div className="flex items-center gap-2.5 px-3 py-2">
                  {/* Index */}
                  <span className="w-5 text-center text-[10px] font-medium text-text-faint tabular-nums flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Cover thumb */}
                  {album.coverUrl ? (
                    <img
                      src={proxyImageUrl(album.coverUrl) ?? ""}
                      alt=""
                      className="w-9 h-9 rounded object-cover flex-shrink-0 bg-surface-alt"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded bg-surface-alt flex-shrink-0" />
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text truncate">
                      {album.title}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {album.artist}
                      {album.tracks.length > 0 && (
                        <span className="text-text-faint">
                          {" "}
                          &middot; {album.tracks.length} tracks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit */}
                  {onEdit && (
                    <button
                      type="button"
                      className="p-1 text-text-faint hover:text-accent transition-colors"
                      onClick={() => onEdit(index)}
                      aria-label={`Edit ${album.title}`}
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
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  )}

                  {/* Reorder arrows */}
                  <button
                    type="button"
                    className="p-1 text-text-faint hover:text-text disabled:opacity-30 transition-colors"
                    disabled={index === 0}
                    onClick={() => onMoveUp(index)}
                    aria-label="Move up"
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
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-1 text-text-faint hover:text-text disabled:opacity-30 transition-colors"
                    disabled={index === albums.length - 1}
                    onClick={() => onMoveDown(index)}
                    aria-label="Move down"
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
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    className="p-1 text-text-faint hover:text-red-500 transition-colors"
                    onClick={() => onRemove(index)}
                    aria-label={`Remove ${album.title}`}
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
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
