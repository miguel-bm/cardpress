import { useState, useEffect } from "react";
import type { AlbumDetail, TrackItem } from "../../lib/types";
import Modal from "../ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  album: AlbumDetail;
  onSave: (updated: AlbumDetail) => void;
}

export default function AlbumEditModal({ open, onClose, album, onSave }: Props) {
  const [draft, setDraft] = useState<AlbumDetail>(album);

  // Reset draft when album prop changes
  useEffect(() => {
    setDraft(album);
  }, [album]);

  function updateField<K extends keyof AlbumDetail>(key: K, value: AlbumDetail[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateTrack(index: number, field: keyof TrackItem, value: string) {
    setDraft((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t, i) =>
        i === index ? { ...t, [field]: value } : t,
      ),
    }));
  }

  function removeTrack(index: number) {
    setDraft((prev) => ({
      ...prev,
      tracks: prev.tracks
        .filter((_, i) => i !== index)
        .map((t, i) => ({ ...t, trackNumber: i + 1 })),
    }));
  }

  function addTrack() {
    setDraft((prev) => ({
      ...prev,
      tracks: [
        ...prev.tracks,
        {
          trackNumber: prev.tracks.length + 1,
          title: "",
          durationMs: null,
          duration: "",
        },
      ],
    }));
  }

  function moveTrack(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.tracks.length) return;
    setDraft((prev) => {
      const next = [...prev.tracks];
      [next[index], next[target]] = [next[target], next[index]];
      return {
        ...prev,
        tracks: next.map((t, i) => ({ ...t, trackNumber: i + 1 })),
      };
    });
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none";

  return (
    <Modal open={open} onClose={onClose} title="Edit Album" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Artist */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Artist
          </label>
          <input
            type="text"
            value={draft.artist}
            onChange={(e) => updateField("artist", e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Tracks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-text-muted">
              Tracks ({draft.tracks.length})
            </label>
            <button
              type="button"
              onClick={addTrack}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              + Add Track
            </button>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface-alt p-2">
            {draft.tracks.length === 0 && (
              <p className="text-xs text-text-muted text-center py-4">
                No tracks. Click "Add Track" above.
              </p>
            )}
            {draft.tracks.map((track, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 group"
              >
                {/* Track number */}
                <span className="w-6 text-center text-[10px] font-medium text-text-faint tabular-nums flex-shrink-0">
                  {track.trackNumber}
                </span>

                {/* Title input */}
                <input
                  type="text"
                  value={track.title}
                  onChange={(e) => updateTrack(index, "title", e.target.value)}
                  placeholder="Track title..."
                  className="flex-1 min-w-0 rounded border border-transparent bg-transparent px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-border focus:bg-surface focus:outline-none"
                />

                {/* Duration (read-only) */}
                {track.duration && (
                  <span className="text-[10px] text-text-faint tabular-nums flex-shrink-0">
                    {track.duration}
                  </span>
                )}

                {/* Move up */}
                <button
                  type="button"
                  className="p-0.5 text-text-faint hover:text-text disabled:opacity-20 transition-colors opacity-0 group-hover:opacity-100"
                  disabled={index === 0}
                  onClick={() => moveTrack(index, -1)}
                  aria-label="Move up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>

                {/* Move down */}
                <button
                  type="button"
                  className="p-0.5 text-text-faint hover:text-text disabled:opacity-20 transition-colors opacity-0 group-hover:opacity-100"
                  disabled={index === draft.tracks.length - 1}
                  onClick={() => moveTrack(index, 1)}
                  aria-label="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Remove */}
                <button
                  type="button"
                  className="p-0.5 text-text-faint hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => removeTrack(index)}
                  aria-label="Remove track"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
