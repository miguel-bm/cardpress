import type { AlbumSearchItem } from "../../lib/types";

// ---------------------------------------------------------------------------
// ReviewItem — data model for each row in the review list
// ---------------------------------------------------------------------------

export type ReviewItem = {
  query: string;
  status: "searching" | "found" | "not_found";
  candidates: AlbumSearchItem[];
  selectedIndex: number;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  items: ReviewItem[];
  onChangeSelection: (index: number, candidateIndex: number) => void;
  onRemove: (index: number) => void;
}

// ---------------------------------------------------------------------------
// AlbumReviewList
// ---------------------------------------------------------------------------

export default function AlbumReviewList({ items, onChangeSelection, onRemove }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="divide-y divide-border">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 py-2 min-h-[48px]">
          {/* Searching state */}
          {item.status === "searching" && (
            <>
              <div className="w-10 h-10 rounded bg-surface-alt animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3.5 w-32 bg-surface-alt rounded animate-pulse" />
                <div className="h-3 w-24 bg-surface-alt rounded animate-pulse mt-1" />
              </div>
            </>
          )}

          {/* Not found */}
          {item.status === "not_found" && (
            <>
              <div className="w-10 h-10 rounded bg-surface-alt flex-shrink-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-muted truncate">{item.query}</p>
                <p className="text-xs text-text-muted/60">No results</p>
              </div>
            </>
          )}

          {/* Found — show selected candidate */}
          {item.status === "found" && item.candidates.length > 0 && (() => {
            const selected = item.candidates[item.selectedIndex] ?? item.candidates[0];
            return (
              <>
                {selected.coverUrl ? (
                  <img
                    src={`/api/image?url=${encodeURIComponent(selected.coverUrl)}`}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-surface-alt flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{selected.title}</p>
                  <p className="text-xs text-text-muted truncate">
                    {selected.artist} &middot; {selected.trackCount} tracks
                  </p>
                </div>
                {item.candidates.length > 1 && (
                  <select
                    value={item.selectedIndex}
                    onChange={(e) => onChangeSelection(idx, Number(e.target.value))}
                    className="text-xs bg-surface-alt border border-border rounded-md px-2 py-1 text-text max-w-[180px] truncate cursor-pointer focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
                  >
                    {item.candidates.map((c, ci) => (
                      <option key={ci} value={ci}>
                        {c.title} — {c.artist} ({c.trackCount} tracks)
                      </option>
                    ))}
                  </select>
                )}
              </>
            );
          })()}

          {/* Remove button — always visible unless searching */}
          {item.status !== "searching" && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-alt transition-colors flex-shrink-0"
              aria-label={`Remove ${item.query}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
