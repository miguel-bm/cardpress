import { useState, useEffect } from "react";
import type { AlbumDetail, TrackItem } from "../../lib/types";
import Modal from "../ui/Modal";

/** AlbumDetail extended with per-album QR override fields that live on the print-queue object at runtime. */
type EditableAlbum = AlbumDetail & {
  qrContentOverride?: string;
  qrCustomTextOverride?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  album: AlbumDetail;
  onSave: (updated: AlbumDetail) => void;
}

export default function AlbumEditModal({ open, onClose, album, onSave }: Props) {
  const [draft, setDraft] = useState<EditableAlbum>(album as EditableAlbum);

  // Reset draft when album prop changes
  useEffect(() => {
    setDraft(album as EditableAlbum);
  }, [album]);

  function updateField<K extends keyof EditableAlbum>(key: K, value: EditableAlbum[K]) {
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
    // EditableAlbum is a superset of AlbumDetail — the extra QR fields
    // travel along and are preserved on the queue object at runtime.
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

        {/* Spotify & QR */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-2">
            Spotify &amp; QR
          </label>

          <div className="space-y-3">
            {/* Spotify Album ID */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Spotify Album ID
              </label>
              <input
                type="text"
                value={draft.spotifyId ?? ""}
                onChange={(e) => updateField("spotifyId", e.target.value)}
                placeholder="e.g. 4aawyAB9vmqN3uQ7FjRGTy"
                className={inputClass}
              />
            </div>

            {/* Discogs URL */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Discogs URL
              </label>
              <input
                type="text"
                value={draft.discogsUrl ?? ""}
                onChange={(e) => updateField("discogsUrl", e.target.value)}
                placeholder="https://www.discogs.com/release/..."
                className={inputClass}
              />
            </div>

            {/* QR Content Override */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                QR Content Override
              </label>
              <select
                value={draft.qrContentOverride ?? ""}
                onChange={(e) => updateField("qrContentOverride", e.target.value)}
                className={inputClass}
              >
                <option value="">Use global setting</option>
                <option value="title">Title</option>
                <option value="spotify">Spotify Link</option>
                <option value="ha-tag">HA Tag</option>
                <option value="discogs">Discogs</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom QR Text — visible only when override is "custom" */}
            {draft.qrContentOverride === "custom" && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Custom QR Text
                </label>
                <input
                  type="text"
                  value={draft.qrCustomTextOverride ?? ""}
                  onChange={(e) => updateField("qrCustomTextOverride", e.target.value)}
                  placeholder="Enter custom QR content..."
                  className={inputClass}
                />
              </div>
            )}
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
