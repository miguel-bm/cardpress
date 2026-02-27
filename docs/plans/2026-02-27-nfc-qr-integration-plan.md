# NFC & QR Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add NFC tag writing workflow, extended QR content modes (Spotify direct link, HA tag, Discogs), Spotify API provider, desktop-to-phone handoff via R2 share codes, and HA automation template.

**Architecture:** Spotify Album IDs serve as NFC tag identifiers (`album-spotify-{id}`). One generic HA automation handles all albums. The card generator adds a Write Tags page with Web NFC support and R2-backed share codes for desktop-to-phone handoff.

**Tech Stack:** React 19, Cloudflare Workers, R2 storage, Web NFC API, Spotify Web API (Client Credentials flow)

**Design doc:** `docs/plans/2026-02-27-nfc-qr-integration-design.md`

---

## Task 1: Extend AlbumDetail with Spotify & Discogs Fields

**Files:**
- Modify: `app/lib/types.ts:31-39` (AlbumDetail interface)
- Modify: `src/index.ts:21-29` (Worker-side AlbumDetail interface)

**Step 1: Add optional fields to frontend AlbumDetail**

In `app/lib/types.ts`, add three fields to the `AlbumDetail` interface after `source`:

```typescript
export interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  tracks: TrackItem[];
  source: ProviderName;
  spotifyId?: string;
  spotifyUrl?: string;
  discogsUrl?: string;
}
```

**Step 2: Add same fields to Worker-side AlbumDetail**

In `src/index.ts`, add the same three fields to the Worker-side `AlbumDetail` interface (around line 21):

```typescript
interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  tracks: TrackItem[];
  source: ProviderName;
  spotifyId?: string;
  spotifyUrl?: string;
  discogsUrl?: string;
}
```

**Step 3: Verify the app still builds**

Run: `cd /Users/miguel/Developer/projects/album-card-generator && pnpm run typecheck`
Expected: No type errors (fields are optional, no consumers break)

**Step 4: Commit**

```bash
git add app/lib/types.ts src/index.ts
git commit -m "feat: add spotifyId, spotifyUrl, discogsUrl to AlbumDetail"
```

---

## Task 2: Add New QR Content Modes

**Files:**
- Modify: `app/lib/qr.ts` (resolveQrText function)

**Step 1: Update resolveQrText with new modes**

Replace the entire `resolveQrText` function in `app/lib/qr.ts`:

```typescript
import type { AlbumDetail, CardSettings } from "./types";

/**
 * Resolve the text to encode in the QR code based on settings and album data.
 * Per-album overrides (qrContentOverride, qrCustomTextOverride) take precedence.
 */
export function resolveQrText(settings: CardSettings, album: AlbumDetail): string {
  const mode = (album as AlbumDetailWithOverrides).qrContentOverride || settings.qrContentMode;
  const customText = (album as AlbumDetailWithOverrides).qrCustomTextOverride ?? settings.qrCustomText;

  switch (mode) {
    case "album-id":
      return album.id;
    case "title":
      return `${album.title} - ${album.artist}`;
    case "spotify-link":
      if (album.spotifyId) {
        return `https://open.spotify.com/album/${album.spotifyId}`;
      }
      // Fallback to search URL if no Spotify ID
      return `https://open.spotify.com/search/${encodeURIComponent(`${album.title} ${album.artist}`)}`;
    case "ha-tag":
      if (album.spotifyId) {
        return `https://www.home-assistant.io/tag/album-spotify-${album.spotifyId}`;
      }
      return `${album.title} - ${album.artist}`;
    case "discogs":
      return album.discogsUrl || `${album.title} - ${album.artist}`;
    case "spotify": {
      const q = encodeURIComponent(`${album.title} ${album.artist}`);
      return `https://open.spotify.com/search/${q}`;
    }
    case "apple-music": {
      const q = encodeURIComponent(`${album.title} ${album.artist}`);
      return `https://music.apple.com/search?term=${q}`;
    }
    case "custom":
      return customText || album.title;
    default:
      return `${album.title} - ${album.artist}`;
  }
}

/** Extended album with per-album QR overrides (used in print queue). */
interface AlbumDetailWithOverrides extends AlbumDetail {
  qrContentOverride?: string;
  qrCustomTextOverride?: string;
}
```

**Step 2: Verify build**

Run: `pnpm run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add app/lib/qr.ts
git commit -m "feat: add spotify-link, ha-tag, discogs QR content modes"
```

---

## Task 3: Update QR Mode UI in Card Section

**Files:**
- Modify: `app/components/studio/CardSection.tsx:16-21` (qrContentOptions array)

**Step 1: Add new options to the toggle**

In `app/components/studio/CardSection.tsx`, replace the `qrContentOptions` array (lines 16-21):

```typescript
const qrContentOptions = [
  { value: "title", label: "Title" },
  { value: "spotify-link", label: "Spotify" },
  { value: "ha-tag", label: "HA Tag" },
  { value: "discogs", label: "Discogs" },
  { value: "custom", label: "Custom" },
];
```

This replaces the old "spotify" (search URL) and "apple-music" options with the new direct-link modes. The old modes still work in `resolveQrText` for backwards compatibility with saved profiles.

**Step 2: Verify in browser**

Run: `pnpm run dev`
Open the app, go to Design page, open Style Studio > Card & QR section. Verify the new toggle options appear and produce the correct QR content.

**Step 3: Commit**

```bash
git add app/components/studio/CardSection.tsx
git commit -m "feat: update QR mode toggle with spotify-link, ha-tag, discogs options"
```

---

## Task 4: Extract Spotify & Discogs Data from CSV

**Files:**
- Modify: `app/lib/csv.ts:154-193` (buildAlbumFromCsvRow function)

**Step 1: Extract new fields in buildAlbumFromCsvRow**

In `app/lib/csv.ts`, update the `buildAlbumFromCsvRow` function to extract Spotify and Discogs columns. Add after the existing `let tracks = ...` line (around line 164):

```typescript
  const spotifyId = getColumn(row, "spotify album id") || getColumn(row, "spotify_album_id") || getColumn(row, "spotifyid");
  const spotifyUrlRaw = getColumn(row, "spotify album url") || getColumn(row, "spotify_album_url") || getColumn(row, "spotifyurl");
  const discogsUrl = getColumn(row, "discogs url") || getColumn(row, "discogs_url") || getColumn(row, "discogsurl");
```

Then update the returned object (around line 184) to include these fields:

```typescript
  return {
    id: String(Date.now() + Math.random()),
    title,
    artist: artist || "Unknown Artist",
    coverUrl: coverUrl || null,
    releaseDate: null,
    tracks,
    source: provider === "musicbrainz" ? "musicbrainz" : "itunes",
    spotifyId: spotifyId || undefined,
    spotifyUrl: spotifyUrlRaw || (spotifyId ? `https://open.spotify.com/album/${spotifyId}` : undefined),
    discogsUrl: discogsUrl || undefined,
  };
```

**Step 2: Update CSV column documentation comment**

Update the comment block above `buildAlbumFromCsvRow` (lines 114-124):

```typescript
// CSV columns (case-insensitive, column order doesn't matter):
//
//   title              (required) — Album title
//   artist             (optional) — Artist or band name
//   cover_url          (optional) — URL to cover artwork image
//   tracks             (optional) — Semicolon-separated track titles
//   spotify album id   (optional) — Spotify album ID (for QR/NFC)
//   spotify album url  (optional) — Spotify album URL
//   discogs url        (optional) — Discogs master/release URL
```

**Step 3: Verify with test CSV**

Run: `pnpm run dev`
Go to Print page, import `album_collection_with_covers.csv`. Verify albums now have Spotify IDs (visible later when we add it to the edit modal).

**Step 4: Commit**

```bash
git add app/lib/csv.ts
git commit -m "feat: extract spotify album id and discogs url from CSV imports"
```

---

## Task 5: Add QR Override to AlbumEditModal

**Files:**
- Modify: `app/components/print/AlbumEditModal.tsx`

**Step 1: Add QR override fields to the modal**

In `app/components/print/AlbumEditModal.tsx`, add a new section after the Tracks section (after line 195, before the Footer). Also update the `updateField` usage pattern to support the new string fields on the album (which are stored as extra properties on the AlbumDetail object in the queue):

Add this block before the `{/* Footer */}` comment:

```tsx
        {/* Spotify & QR */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">
            Spotify & QR
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Spotify Album ID
              </label>
              <input
                type="text"
                value={(draft as Record<string, unknown>).spotifyId as string ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, spotifyId: e.target.value || undefined }))
                }
                placeholder="e.g. 1Ugdi2OTxKopVVqsprp5pb"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Discogs URL
              </label>
              <input
                type="text"
                value={(draft as Record<string, unknown>).discogsUrl as string ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, discogsUrl: e.target.value || undefined }))
                }
                placeholder="e.g. https://www.discogs.com/master/4300"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                QR Content Override
              </label>
              <select
                value={(draft as Record<string, unknown>).qrContentOverride as string ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, qrContentOverride: e.target.value || undefined }))
                }
                className={inputClass}
              >
                <option value="">Use global setting</option>
                <option value="title">Title</option>
                <option value="spotify-link">Spotify Link</option>
                <option value="ha-tag">HA Tag</option>
                <option value="discogs">Discogs</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {(draft as Record<string, unknown>).qrContentOverride === "custom" && (
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Custom QR Text
                </label>
                <input
                  type="text"
                  value={(draft as Record<string, unknown>).qrCustomTextOverride as string ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, qrCustomTextOverride: e.target.value || undefined }))
                  }
                  placeholder="Enter text or URL..."
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>
```

**Step 2: Verify in browser**

Run: `pnpm run dev`
Go to Print page, add an album, click Edit. Verify the new Spotify & QR section appears with all fields. Enter a Spotify ID and select "Spotify Link" as QR override — verify the QR on the card updates.

**Step 3: Commit**

```bash
git add app/components/print/AlbumEditModal.tsx
git commit -m "feat: add spotify id, discogs url, and per-album QR override to edit modal"
```

---

## Task 6: Add Spotify Provider to Worker Backend

**Files:**
- Modify: `src/index.ts`

This is the largest single task. The Spotify Web API uses Client Credentials flow (no user auth needed for search/album endpoints).

**Step 1: Add Spotify credentials to Env interface**

In `src/index.ts`, update the `Env` interface (around line 480):

```typescript
interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
}
```

**Step 2: Add Spotify token fetching**

Add after the existing helper functions (around line 160, after `formatDuration`):

```typescript
// ---------------------------------------------------------------------------
// Spotify API
// ---------------------------------------------------------------------------

let spotifyToken: string | null = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken(env: Env): Promise<string | null> {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return null;

  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) return null;

  const data = (await resp.json()) as { access_token: string; expires_in: number };
  spotifyToken = data.access_token;
  spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyToken;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string; width: number }[];
  release_date: string;
  total_tracks: number;
  external_urls: { spotify: string };
}

interface SpotifyTrack {
  name: string;
  track_number: number;
  duration_ms: number;
  disc_number: number;
}

async function searchSpotifyAlbums(query: string, limit: number, env: Env): Promise<AlbumSearchItem[]> {
  const token = await getSpotifyToken(env);
  if (!token) return [];

  const params = new URLSearchParams({ q: query, type: "album", limit: String(limit) });
  const resp = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) return [];

  const data = (await resp.json()) as { albums: { items: SpotifyAlbum[] } };
  return data.albums.items.map((a) => ({
    id: a.id,
    title: a.name,
    artist: a.artists.map((ar) => ar.name).join(", "),
    coverUrl: a.images[0]?.url ?? null,
    releaseDate: a.release_date,
    trackCount: a.total_tracks,
    source: "spotify" as ProviderName,
  }));
}

async function fetchSpotifyAlbumById(id: string, env: Env): Promise<AlbumDetail | null> {
  const token = await getSpotifyToken(env);
  if (!token) return null;

  const resp = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) return null;

  const a = (await resp.json()) as SpotifyAlbum & { tracks: { items: SpotifyTrack[] } };
  return {
    id: a.id,
    title: a.name,
    artist: a.artists.map((ar) => ar.name).join(", "),
    coverUrl: a.images[0]?.url ?? null,
    releaseDate: a.release_date,
    tracks: a.tracks.items
      .sort((x, y) => (x.disc_number - y.disc_number) * 1000 + (x.track_number - y.track_number))
      .map((t, i) => ({
        trackNumber: i + 1,
        title: t.name,
        durationMs: t.duration_ms,
        duration: formatDuration(t.duration_ms),
      })),
    source: "spotify" as ProviderName,
    spotifyId: a.id,
    spotifyUrl: a.external_urls.spotify,
  };
}

async function fetchSpotifyAlbumByTitleArtist(title: string, artist: string | undefined, env: Env): Promise<AlbumDetail | null> {
  const query = artist ? `album:${title} artist:${artist}` : `album:${title}`;
  const candidates = await searchSpotifyAlbums(query, 10, env);
  if (!candidates.length) return null;

  const best = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, title, artist) }))
    .sort((a, b) => b.score - a.score)[0]?.candidate;

  if (!best) return null;
  return fetchSpotifyAlbumById(best.id, env);
}
```

**Step 3: Update ProviderName and dispatch functions**

Update `ProviderName` type (line 1):

```typescript
type ProviderName = "itunes" | "musicbrainz" | "spotify";
```

Update `ProviderMode` (line 2):

```typescript
type ProviderMode = ProviderName | "auto";
```

Update `searchAlbums` (around line 416) to accept `env` and add Spotify:

```typescript
async function searchAlbums(query: string, provider: ProviderMode, env: Env): Promise<AlbumSearchItem[]> {
  if (provider === "itunes") return searchItunesAlbums(query, 25);
  if (provider === "musicbrainz") return searchMusicBrainzAlbums(query, 25);
  if (provider === "spotify") return searchSpotifyAlbums(query, 25, env);

  const itunes = await searchItunesAlbums(query, 25);
  if (itunes.length) return itunes;
  return searchMusicBrainzAlbums(query, 25);
}
```

Update `fetchAlbumById` (around line 425) to accept `env` and add Spotify:

```typescript
async function fetchAlbumById(id: string, provider: ProviderMode, env: Env): Promise<AlbumDetail | null> {
  if (provider === "itunes") return fetchItunesAlbumById(id);
  if (provider === "musicbrainz") return fetchMusicBrainzAlbumById(id);
  if (provider === "spotify") return fetchSpotifyAlbumById(id, env);

  if (isUuidLike(id)) {
    const musicBrainzAlbum = await fetchMusicBrainzAlbumById(id);
    if (musicBrainzAlbum) return musicBrainzAlbum;
  }

  const itunesAlbum = await fetchItunesAlbumById(id);
  if (itunesAlbum) return itunesAlbum;
  return fetchMusicBrainzAlbumById(id);
}
```

Update `fetchAlbumByTitleArtist` (around line 439) to accept `env` and add Spotify:

```typescript
async function fetchAlbumByTitleArtist(title: string, artist: string | undefined, provider: ProviderMode, env: Env): Promise<AlbumDetail | null> {
  if (provider === "itunes") return fetchItunesAlbumByTitleArtist(title, artist);
  if (provider === "musicbrainz") return fetchMusicBrainzAlbumByTitleArtist(title, artist);
  if (provider === "spotify") return fetchSpotifyAlbumByTitleArtist(title, artist, env);

  const itunesAlbum = await fetchItunesAlbumByTitleArtist(title, artist);
  if (itunesAlbum) return itunesAlbum;
  return fetchMusicBrainzAlbumByTitleArtist(title, artist);
}
```

**Step 4: Update route handlers to pass env**

Update all route handlers that call these dispatch functions to pass `env`. In the `fetch` handler:

- Line ~505: `const items = await searchAlbums(query, provider, env);`
- Line ~521: `const album = await fetchAlbumById(id, provider, env);`
- Line ~541: `const album = await fetchAlbumByTitleArtist(title, artist || undefined, provider, env);`

Update the health endpoint to include Spotify when configured:

```typescript
if (url.pathname === "/api/health") {
  const providers: string[] = ["itunes", "musicbrainz"];
  if (env.SPOTIFY_CLIENT_ID) providers.push("spotify");
  return json({ ok: true, providers, defaultProvider: "itunes" });
}
```

**Step 5: Update frontend ProviderName type**

In `app/lib/types.ts`, update the provider type:

```typescript
export type ProviderName = "itunes" | "musicbrainz" | "spotify";
```

**Step 6: Verify build**

Run: `pnpm run typecheck`
Expected: No type errors

**Step 7: Set Spotify secrets (manual step — document for user)**

```bash
# Create a Spotify app at https://developer.spotify.com/dashboard
# Then set secrets:
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
# For local dev, create .dev.vars:
echo "SPOTIFY_CLIENT_ID=your_id\nSPOTIFY_CLIENT_SECRET=your_secret" > .dev.vars
```

**Step 8: Commit**

```bash
git add src/index.ts app/lib/types.ts
git commit -m "feat: add Spotify Web API as album search provider"
```

---

## Task 7: Add Spotify to Frontend Provider Selector

**Files:**
- Explore: `app/components/SearchBar.tsx` or wherever provider selection happens
- Modify: `app/context/AlbumContext.tsx` if needed

**Step 1: Find and update the provider selector UI**

Check `SearchBar.tsx` for the provider dropdown/toggle. Add "Spotify" as an option. The `ProviderMode` type already includes `"spotify"` from Task 6. The provider selector should show Spotify as an option.

Note: If the health endpoint reports Spotify is available (credentials configured), show it. Otherwise, you can still show it — the search will just return empty results.

**Step 2: Test Spotify search**

Run: `pnpm run dev`
Select Spotify as provider, search for an album. Verify results include `spotifyId` and `spotifyUrl` fields.

**Step 3: Commit**

```bash
git add app/components/SearchBar.tsx
git commit -m "feat: add Spotify option to provider selector"
```

---

## Task 8: Create Write Tags Page

**Files:**
- Create: `app/pages/WriteTagsPage.tsx`

**Step 1: Create the page component**

Create `app/pages/WriteTagsPage.tsx`. This page:
- Reads albums from the print queue (same localStorage key: `album-card-print-queue-v1`)
- Displays each album with: cover art, title, artist, NFC tag ID (`album-spotify-{spotifyId}`)
- Provides a "Write" button per album (uses Web NFC API on Android Chrome)
- Tracks written status in localStorage
- Shows "Send to Phone" button for desktop→phone handoff (Task 10)

```tsx
import { useState, useEffect, useCallback } from "react";
import type { AlbumDetail } from "../lib/types";

const QUEUE_KEY = "album-card-print-queue-v1";
const WRITTEN_KEY = "album-card-nfc-written-v1";

function getTagId(album: AlbumDetail): string | null {
  if (!album.spotifyId) return null;
  return `album-spotify-${album.spotifyId}`;
}

function getHaTagUri(tagId: string): string {
  return `https://www.home-assistant.io/tag/${tagId}`;
}

const supportsWebNfc = typeof window !== "undefined" && "NDEFReader" in window;

export default function WriteTagsPage() {
  const [albums, setAlbums] = useState<AlbumDetail[]>([]);
  const [written, setWritten] = useState<Set<string>>(new Set());
  const [writingIndex, setWritingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) setAlbums(JSON.parse(raw));
    } catch { /* empty */ }
    try {
      const raw = localStorage.getItem(WRITTEN_KEY);
      if (raw) setWritten(new Set(JSON.parse(raw)));
    } catch { /* empty */ }
  }, []);

  const markWritten = useCallback((tagId: string) => {
    setWritten((prev) => {
      const next = new Set(prev);
      next.add(tagId);
      localStorage.setItem(WRITTEN_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  async function handleWrite(album: AlbumDetail, index: number) {
    const tagId = getTagId(album);
    if (!tagId) return;

    setWritingIndex(index);
    setError(null);

    try {
      const ndef = new (window as unknown as { NDEFReader: new () => NDEFReader }).NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: getHaTagUri(tagId),
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

  async function handleCopy(tagId: string) {
    await navigator.clipboard.writeText(tagId);
    setCopied(tagId);
    setTimeout(() => setCopied(null), 2000);
  }

  const albumsWithTags = albums.filter((a) => getTagId(a));
  const albumsWithoutTags = albums.filter((a) => !getTagId(a));
  const progress = albumsWithTags.length
    ? `${albumsWithTags.filter((a) => written.has(getTagId(a)!)).length}/${albumsWithTags.length}`
    : "0/0";

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text tracking-tight">
          Write NFC Tags
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Write tag IDs to your NFC stickers. Progress: {progress} written.
        </p>
        {!supportsWebNfc && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Web NFC is not supported in this browser. Use Chrome on Android for
            one-tap writing, or copy tag IDs to write via the HA Companion app.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {albumsWithTags.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm">
          <p>No albums with Spotify IDs in your print queue.</p>
          <p className="mt-1 text-xs">
            Import a CSV with a "Spotify Album ID" column, or search with the
            Spotify provider.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {albumsWithTags.map((album, index) => {
          const tagId = getTagId(album)!;
          const isWritten = written.has(tagId);
          const isWriting = writingIndex === index;

          return (
            <div
              key={album.id}
              className={[
                "flex items-center gap-4 rounded-xl border p-3 transition-colors",
                isWritten
                  ? "border-green-200 bg-green-50/50"
                  : "border-border bg-surface",
              ].join(" ")}
            >
              {/* Cover */}
              {album.coverUrl ? (
                <img
                  src={album.coverUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-surface-alt flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {album.title}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {album.artist}
                </p>
                <p className="text-[10px] text-text-faint font-mono mt-0.5 truncate">
                  {tagId}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(tagId)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-border text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
                >
                  {copied === tagId ? "Copied" : "Copy ID"}
                </button>
                {supportsWebNfc && (
                  <button
                    type="button"
                    onClick={() => handleWrite(album, index)}
                    disabled={isWriting}
                    className={[
                      "px-3 py-1 rounded-md text-[11px] font-medium transition-colors",
                      isWritten
                        ? "bg-green-100 text-green-700"
                        : "bg-accent text-white hover:bg-accent-hover",
                      isWriting ? "opacity-50 cursor-wait" : "",
                    ].join(" ")}
                  >
                    {isWriting ? "Hold tag..." : isWritten ? "Rewrite" : "Write"}
                  </button>
                )}
                {isWritten && (
                  <span className="text-green-600 text-sm">&#10003;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {albumsWithoutTags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-text-muted mb-2">
            {albumsWithoutTags.length} album(s) without Spotify ID (cannot generate tag):
          </p>
          <ul className="text-xs text-text-faint space-y-1">
            {albumsWithoutTags.map((a) => (
              <li key={a.id}>{a.title} — {a.artist}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Web NFC type declarations
interface NDEFReader {
  write(message: NDEFMessage): Promise<void>;
}
interface NDEFMessage {
  records: NDEFRecord[];
}
interface NDEFRecord {
  recordType: string;
  data: string;
}
```

**Step 2: Verify build**

Run: `pnpm run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add app/pages/WriteTagsPage.tsx
git commit -m "feat: create Write Tags page with Web NFC support"
```

---

## Task 9: Add Write Tags Route and Nav Link

**Files:**
- Modify: `app/App.tsx` (add route)
- Modify: `app/components/TopBar.tsx` (add nav link)

**Step 1: Add route in App.tsx**

In `app/App.tsx`, add import and route:

Import (after line 9):
```typescript
import WriteTagsPage from "./pages/WriteTagsPage";
```

Add route inside `<Routes>` (after the `/about` route, line 26):
```tsx
<Route path="/write-tags" element={<WriteTagsPage />} />
```

**Step 2: Add nav link in TopBar.tsx**

In `app/components/TopBar.tsx`, add an NFC icon component and a new nav entry.

Add icon component (after PrinterIcon, around line 39):

```tsx
function NfcIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
      <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
      <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
    </svg>
  );
}
```

Add to `NAV_LINKS` array (after the Print entry):
```typescript
{ to: "/write-tags", label: "NFC", icon: <NfcIcon /> },
```

**Step 3: Verify in browser**

Run: `pnpm run dev`
Verify "NFC" appears in the top nav and clicking it navigates to the Write Tags page.

**Step 4: Commit**

```bash
git add app/App.tsx app/components/TopBar.tsx
git commit -m "feat: add Write Tags page to routing and navigation"
```

---

## Task 10: Add R2 Share Code Backend

**Files:**
- Modify: `wrangler.jsonc` (add R2 binding)
- Modify: `src/index.ts` (add share code API routes)

**Step 1: Add R2 binding to wrangler.jsonc**

Update `wrangler.jsonc` to add an R2 bucket binding:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "cardpress",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-26",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "observability": {
    "enabled": true
  },
  "routes": [
    { "pattern": "cardpress.miscellanics.com", "custom_domain": true }
  ],
  "r2_buckets": [
    {
      "binding": "SHARE_BUCKET",
      "bucket_name": "cardpress-shares"
    }
  ]
}
```

**Step 2: Create R2 bucket**

```bash
npx wrangler r2 bucket create cardpress-shares
```

**Step 3: Update Env interface and add share routes**

In `src/index.ts`, update the `Env` interface:

```typescript
interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  SHARE_BUCKET?: R2Bucket;
}
```

Add a helper to generate short codes (add near other helpers):

```typescript
function generateShareCode(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

Add two new API routes in the fetch handler, before the SPA fallback:

```typescript
    // POST /api/share — store album list, return share code
    if (url.pathname === "/api/share" && request.method === "POST") {
      if (!env.SHARE_BUCKET) {
        return json({ error: "Share storage not configured" }, 503);
      }
      try {
        const body = await request.json() as { albums: unknown[] };
        if (!Array.isArray(body.albums) || body.albums.length === 0) {
          return json({ error: "albums array required" }, 400);
        }
        const code = generateShareCode();
        await env.SHARE_BUCKET.put(`share/${code}`, JSON.stringify(body.albums), {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { created: new Date().toISOString() },
        });
        return json({ code });
      } catch {
        return json({ error: "Failed to create share" }, 500);
      }
    }

    // GET /api/share/:code — retrieve shared album list
    if (url.pathname.startsWith("/api/share/")) {
      const code = url.pathname.split("/api/share/")[1];
      if (!code || !env.SHARE_BUCKET) {
        return json({ error: "Not found" }, 404);
      }
      const obj = await env.SHARE_BUCKET.get(`share/${code}`);
      if (!obj) {
        return json({ error: "Share code not found or expired" }, 404);
      }
      const data = await obj.text();
      return new Response(data, {
        headers: { "content-type": "application/json" },
      });
    }
```

Also update the method check at the top to allow POST:

```typescript
    if (request.method !== "GET" && request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }
```

**Step 4: Verify build**

Run: `pnpm run typecheck`
Expected: No type errors

**Step 5: Commit**

```bash
git add wrangler.jsonc src/index.ts
git commit -m "feat: add R2 share code API for desktop-to-phone handoff"
```

---

## Task 11: Add Share Code UI to Write Tags Page

**Files:**
- Modify: `app/pages/WriteTagsPage.tsx`

**Step 1: Add share code generation and QR display**

Add a "Send to Phone" button that:
1. POSTs the album list to `/api/share`
2. Gets back a share code
3. Shows a QR code on screen with the URL `{origin}/write-tags?code={code}`

Import qrcode at the top:
```typescript
import QRCode from "qrcode";
```

Add state and handler for sharing. Add these state variables:

```typescript
const [shareUrl, setShareUrl] = useState<string | null>(null);
const [shareQrDataUrl, setShareQrDataUrl] = useState<string | null>(null);
const [isSharing, setIsSharing] = useState(false);
```

Add this function:

```typescript
  async function handleShare() {
    if (!albumsWithTags.length) return;
    setIsSharing(true);
    try {
      const resp = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albums: albumsWithTags }),
      });
      const data = await resp.json() as { code: string };
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
```

Add a `useEffect` to load albums from a share code if present in the URL:

```typescript
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    fetch(`/api/share/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlbums(data as AlbumDetail[]);
        }
      })
      .catch(() => setError("Failed to load shared album list"));
  }, []);
```

Add the share UI block after the progress text and before the album list:

```tsx
      {/* Send to Phone */}
      {albumsWithTags.length > 0 && (
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
              <div>
                <p className="text-sm font-medium text-text">
                  Scan this QR code with your phone
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Opens the Write Tags page on your phone with the same album list.
                </p>
                <p className="text-[11px] text-text-faint font-mono mt-2 break-all">
                  {shareUrl}
                </p>
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
```

**Step 2: Add `/write-tags` to the SPA fallback**

The SPA fallback in `src/index.ts` already handles all non-API routes, so `/write-tags?code=abc` will serve the React app which reads the query param.

**Step 3: Verify in browser**

Run: `pnpm run dev`
Go to Write Tags page with albums in queue. Click "Send to Phone" — should show a QR code. The QR encodes a URL with a share code. Visiting that URL on another device should load the same album list.

**Step 4: Commit**

```bash
git add app/pages/WriteTagsPage.tsx
git commit -m "feat: add Send to Phone with R2 share code and QR handoff"
```

---

## Task 12: Add HA Setup Section

**Files:**
- Create: `app/components/HaSetupSection.tsx`
- Modify: `app/pages/WriteTagsPage.tsx` (include the section)

**Step 1: Create the HA setup component**

Create `app/components/HaSetupSection.tsx`:

```tsx
import { useState } from "react";

const DEFAULT_ENTITY = "media_player.salon";
const DEFAULT_VOLUME = "0.3";

function generateAutomationYaml(entityId: string, volume: string): string {
  return `alias: "NFC \u2013 Play Album on Speaker"
description: "Scan any album NFC card to play on your speaker"
triggers:
  - trigger: tag
conditions:
  - condition: template
    value_template: "{{ trigger.tag_id.startswith('album-spotify-') }}"
actions:
  - action: media_player.volume_set
    target:
      entity_id: ${entityId}
    data:
      volume_level: ${volume}
  - action: media_player.play_media
    target:
      entity_id: ${entityId}
    data:
      media_content_id: >-
        https://open.spotify.com/album/{{ trigger.tag_id.replace('album-spotify-', '') }}
      media_content_type: music
mode: single`;
}

export default function HaSetupSection() {
  const [entityId, setEntityId] = useState(DEFAULT_ENTITY);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [copied, setCopied] = useState(false);

  const yaml = generateAutomationYaml(entityId, volume);

  async function handleCopy() {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nfc-play-album.yaml";
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none";

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h2 className="text-base font-semibold text-text mb-1">
        Home Assistant Setup
      </h2>
      <p className="text-xs text-text-muted mb-4">
        Copy this automation into your Home Assistant. It handles all album
        NFC tags with a single automation — no changes needed when you add
        new albums.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Speaker Entity ID
          </label>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Default Volume (0-1)
          </label>
          <input
            type="text"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <pre className="rounded-xl border border-border bg-surface-alt p-4 text-xs text-text font-mono overflow-x-auto whitespace-pre leading-relaxed">
        {yaml}
      </pre>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
        >
          {copied ? "Copied!" : "Copy YAML"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
        >
          Download .yaml
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Include in WriteTagsPage**

In `app/pages/WriteTagsPage.tsx`, import and render at the bottom:

```typescript
import HaSetupSection from "../components/HaSetupSection";
```

Add at the end of the page, before the closing `</div>`:

```tsx
      <HaSetupSection />
```

**Step 3: Verify in browser**

Run: `pnpm run dev`
Go to Write Tags page. Verify the HA Setup section appears at the bottom with customizable fields, copyable YAML, and download button.

**Step 4: Commit**

```bash
git add app/components/HaSetupSection.tsx app/pages/WriteTagsPage.tsx
git commit -m "feat: add HA automation template with copy and download"
```

---

## Task 13: Update About Page

**Files:**
- Modify: `app/pages/AboutPage.tsx`

**Step 1: Rewrite About page content**

Update the content in `app/pages/AboutPage.tsx` to describe the full physical card + NFC workflow:

Replace the "What is this?" section content:

```tsx
        <section>
          <h2 className="text-base font-semibold text-text mb-2">
            What is this?
          </h2>
          <p>
            Cardpress turns your digital music collection into a deck of
            physical album cards. Each 63&times;88&nbsp;mm card features the
            cover art and track listing, with an optional QR code that links
            to the album on Spotify or your preferred service.
          </p>
          <p className="mt-2">
            Stick an NFC tag behind each card and pair it with a Home Assistant
            automation — tap the card on your phone to play the album on your
            home speaker. The result is a tangible, scannable music collection
            you can browse, gift, and display.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text mb-2">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-text">
            <li><strong>Design</strong> — Search for an album, customize the card style.</li>
            <li><strong>Print</strong> — Import your collection via CSV, generate duplex-ready PDF sheets.</li>
            <li><strong>Write NFC</strong> — Use the Write Tags page to program NFC stickers with album tag IDs.</li>
            <li><strong>Play</strong> — Tap a card on your phone to play the album on your home speaker.</li>
          </ol>
        </section>
```

**Step 2: Verify in browser**

Run: `pnpm run dev`
Go to About page and verify the updated content.

**Step 3: Commit**

```bash
git add app/pages/AboutPage.tsx
git commit -m "docs: update About page with NFC card workflow description"
```

---

## Task 14: Update README

**Files:**
- Modify: `README.md`

**Step 1: Update README with NFC integration overview**

Add a section near the top of the README explaining the NFC workflow and what the app does. Update the feature list to include:
- NFC tag writing with Web NFC API
- Spotify, HA Tag, Discogs QR content modes
- Desktop-to-phone handoff via share codes
- Home Assistant automation template

Keep existing content about local dev, deployment, and attribution.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with NFC integration and full workflow"
```

---

## Summary of All Tasks

| # | Task | Key Files | Depends On |
|---|------|-----------|------------|
| 1 | Extend AlbumDetail type | `types.ts`, `src/index.ts` | — |
| 2 | Add new QR content modes | `qr.ts` | 1 |
| 3 | Update QR mode UI | `CardSection.tsx` | 2 |
| 4 | Extract Spotify/Discogs from CSV | `csv.ts` | 1 |
| 5 | Add QR override to edit modal | `AlbumEditModal.tsx` | 2 |
| 6 | Add Spotify provider to Worker | `src/index.ts` | 1 |
| 7 | Add Spotify to provider selector | `SearchBar.tsx` | 6 |
| 8 | Create Write Tags page | `WriteTagsPage.tsx` | 1 |
| 9 | Add route and nav link | `App.tsx`, `TopBar.tsx` | 8 |
| 10 | Add R2 share code backend | `wrangler.jsonc`, `src/index.ts` | — |
| 11 | Add share code UI | `WriteTagsPage.tsx` | 8, 10 |
| 12 | Add HA Setup section | `HaSetupSection.tsx`, `WriteTagsPage.tsx` | 8 |
| 13 | Update About page | `AboutPage.tsx` | — |
| 14 | Update README | `README.md` | — |

**Parallelizable groups:**
- Tasks 1-5 (data model + QR) are sequential
- Task 6-7 (Spotify API) depend only on Task 1
- Tasks 8-9 (Write Tags page) depend only on Task 1
- Tasks 10-11 (R2 share) are semi-independent
- Tasks 12-14 (docs) are independent of each other
