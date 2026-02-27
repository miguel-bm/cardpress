import { useState, useCallback, useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { AlbumDetail } from "../lib/types";
import { enrichWithSpotifyId } from "../lib/api";
import HaSetupSection from "../components/HaSetupSection";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_STORAGE_KEY = "album-card-print-queue-v1";
const WRITTEN_STORAGE_KEY = "album-card-nfc-written-v1";

const supportsWebNfc =
  typeof window !== "undefined" && "NDEFReader" in window;

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadQueue(): AlbumDetail[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadWrittenSet(): Set<string> {
  try {
    const raw = localStorage.getItem(WRITTEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveWrittenSet(written: Set<string>): void {
  localStorage.setItem(WRITTEN_STORAGE_KEY, JSON.stringify([...written]));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTagId(album: AlbumDetail): string | null {
  if (!album.spotifyId) return null;
  return `album-spotify-${album.spotifyId}`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ClipboardIcon() {
  return (
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
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function NfcWriteIcon() {
  return (
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
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
      <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
      <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// WriteTagsPage
// ---------------------------------------------------------------------------

export default function WriteTagsPage() {
  const [albums, setAlbums] = useState<AlbumDetail[]>([]);
  const [written, setWritten] = useState<Set<string>>(new Set());
  const [writingIndex, setWritingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareQrDataUrl, setShareQrDataUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const enrichRanRef = useRef(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setAlbums(loadQueue());
    setWritten(loadWrittenSet());
  }, []);

  // Load albums from share code if ?code= param is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    fetch(`/api/share/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlbums(data as AlbumDetail[]);
      })
      .catch(() => setError("Failed to load shared album list"));
  }, []);

  // Enrich albums missing spotifyId via Songlink
  useEffect(() => {
    if (albums.length === 0 || enrichRanRef.current) return;
    const needEnrichment = albums.some((a) => !a.spotifyId);
    if (!needEnrichment) return;

    enrichRanRef.current = true;
    setIsEnriching(true);
    let cancelled = false;

    (async () => {
      const enriched = [...albums];
      let changed = false;
      for (let i = 0; i < enriched.length; i++) {
        if (cancelled) break;
        if (enriched[i].spotifyId) continue;
        const updated = await enrichWithSpotifyId(enriched[i]);
        if (updated.spotifyId) {
          enriched[i] = updated;
          changed = true;
        }
      }
      if (!cancelled && changed) {
        setAlbums(enriched);
        // Persist enriched results back to localStorage
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(enriched));
      }
      if (!cancelled) setIsEnriching(false);
    })();

    return () => { cancelled = true; };
  }, [albums]);

  // Persist written set whenever it changes
  const markWritten = useCallback((tagId: string) => {
    setWritten((prev) => {
      const next = new Set(prev);
      next.add(tagId);
      saveWrittenSet(next);
      return next;
    });
  }, []);

  // Split albums into taggable (has spotifyId) and untaggable
  const taggable = albums.filter((a) => getTagId(a) !== null);
  const untaggable = albums.filter((a) => getTagId(a) === null);

  const writtenCount = taggable.filter((a) => {
    const tid = getTagId(a);
    return tid && written.has(tid);
  }).length;

  // Reset copied state after timeout
  useEffect(() => {
    if (copiedIndex === null) return;
    const id = setTimeout(() => setCopiedIndex(null), 1500);
    return () => clearTimeout(id);
  }, [copiedIndex]);

  // Copy tag ID to clipboard
  async function handleCopy(album: AlbumDetail, index: number) {
    const tagId = getTagId(album);
    if (!tagId) return;
    try {
      await navigator.clipboard.writeText(tagId);
      setCopiedIndex(index);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  // Write NFC tag via Web NFC API
  async function handleWrite(album: AlbumDetail, index: number) {
    const tagId = getTagId(album);
    if (!tagId) return;
    setWritingIndex(index);
    setError(null);
    try {
      // @ts-expect-error Web NFC API not in standard TypeScript lib
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: `https://www.home-assistant.io/tag/${tagId}`,
          },
        ],
      });
      markWritten(tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "NFC write failed");
    } finally {
      setWritingIndex(null);
    }
  }

  // Generate share link + QR code for desktop-to-phone handoff
  async function handleShare() {
    if (!taggable.length) return;
    setIsSharing(true);
    try {
      const resp = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albums: taggable }),
      });
      const data = (await resp.json()) as { code: string };
      const url = `${window.location.origin}/write-tags?code=${data.code}`;
      setShareUrl(url);
      const qrDataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
      setShareQrDataUrl(qrDataUrl);
    } catch {
      setError("Failed to generate share link");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-semibold text-text">Write NFC Tags</h1>
        <p className="text-sm text-text-muted">
          Write Home Assistant NFC tag IDs to physical tags for each album in
          your print queue.
        </p>
      </div>

      {/* Web NFC warning */}
      {!supportsWebNfc && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
          <strong>Web NFC not supported.</strong> NFC writing requires Android
          Chrome. You can still copy tag IDs to use elsewhere.
        </div>
      )}

      {/* Empty state */}
      {albums.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-text-muted">
            Your print queue is empty. Add albums on the{" "}
            <a href="/print" className="text-accent hover:underline">
              Print
            </a>{" "}
            page first.
          </p>
        </div>
      )}

      {/* Progress */}
      {taggable.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-text">
              Progress: {writtenCount}/{taggable.length} written
            </span>
            {writtenCount === taggable.length && (
              <span className="text-green-600 font-medium">All done!</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{
                width: `${taggable.length > 0 ? (writtenCount / taggable.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Enrichment progress */}
      {isEnriching && (
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          Fetching Spotify IDs...
        </div>
      )}

      {/* Send to Phone */}
      {taggable.length > 0 && (
        <div className="mb-6">
          {!shareUrl ? (
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isSharing ? "Generating..." : "Send to Phone"}
            </button>
          ) : (
            <div className="flex items-start gap-6 p-4 rounded-xl border border-border bg-surface-alt">
              {shareQrDataUrl && (
                <img src={shareQrDataUrl} alt="Scan to open on phone" className="w-32 h-32 rounded-lg" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">Scan to open on your phone</p>
                <p className="text-xs text-text-muted mt-1">
                  Opens the Write Tags page on your phone with the same album list.
                </p>
                <p className="text-[11px] text-text-faint font-mono mt-2 break-all">{shareUrl}</p>
                <button
                  type="button"
                  onClick={() => { setShareUrl(null); setShareQrDataUrl(null); }}
                  className="mt-2 text-xs text-text-muted hover:text-text transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-800">
          <strong>Error:</strong> {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Taggable albums */}
      {taggable.length > 0 && (
        <div className="space-y-3">
          {taggable.map((album, index) => {
            const tagId = getTagId(album)!;
            const isWritten = written.has(tagId);
            const isWriting = writingIndex === index;
            const isCopied = copiedIndex === index;

            return (
              <div
                key={`${album.id}-${index}`}
                className={[
                  "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                  isWritten
                    ? "border-green-200 bg-green-50/50"
                    : "border-border bg-surface",
                ].join(" ")}
              >
                {/* Cover image */}
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-border flex-shrink-0" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {album.artist}
                  </p>
                  <p className="text-xs font-mono text-text-faint truncate mt-0.5">
                    {tagId}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Copy ID button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(album, index)}
                    className={[
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isCopied
                        ? "bg-green-100 text-green-700"
                        : "border border-border text-text-muted hover:text-text hover:border-text-muted",
                    ].join(" ")}
                  >
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                    {isCopied ? "Copied" : "Copy ID"}
                  </button>

                  {/* Write button (only if Web NFC supported) */}
                  {supportsWebNfc && (
                    <button
                      type="button"
                      onClick={() => handleWrite(album, index)}
                      disabled={isWriting}
                      className={[
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                        isWritten
                          ? "bg-green-100 text-green-700"
                          : "bg-accent text-white hover:bg-accent-hover",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      ].join(" ")}
                    >
                      {isWriting ? (
                        <>
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                          Writing...
                        </>
                      ) : isWritten ? (
                        <>
                          <CheckIcon />
                          Written
                        </>
                      ) : (
                        <>
                          <NfcWriteIcon />
                          Write
                        </>
                      )}
                    </button>
                  )}

                  {/* Written checkmark (no Web NFC, but tag written via other means) */}
                  {!supportsWebNfc && isWritten && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckIcon />
                      Written
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Untaggable albums */}
      {untaggable.length > 0 && (
        <div className="mt-10">
          <h2 className="text-base font-semibold text-text mb-1">
            Cannot generate tag
          </h2>
          <p className="text-xs text-text-muted mb-4">
            These albums have no Spotify ID, so an NFC tag ID cannot be
            generated. Re-search them from Spotify on the Print page.
          </p>
          <div className="space-y-2">
            {untaggable.map((album, index) => (
              <div
                key={`untaggable-${album.id}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 px-4 py-3 opacity-60"
              >
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-border flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {album.artist}
                  </p>
                  <p className="text-xs text-text-faint mt-0.5">
                    No Spotify ID
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Assistant automation template */}
      <HaSetupSection />
    </div>
  );
}
