type ProviderName = "itunes" | "musicbrainz" | "spotify";
type ProviderMode = ProviderName | "auto";

interface AlbumSearchItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  trackCount: number;
  source: ProviderName;
}

interface TrackItem {
  trackNumber: number;
  title: string;
  durationMs: number | null;
  duration: string;
}

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

interface ItunesCollectionRecord {
  wrapperType?: string;
  collectionType?: string;
  collectionId?: number;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  trackCount?: number;
}

interface ItunesTrackRecord {
  wrapperType?: string;
  trackName?: string;
  trackNumber?: number;
  trackTimeMillis?: number;
  discNumber?: number;
}

interface MusicBrainzArtistCredit {
  name?: string;
  artist?: { name?: string };
}

interface MusicBrainzMediaSummary {
  "track-count"?: number;
}

interface MusicBrainzReleaseSearchItem {
  id?: string;
  title?: string;
  date?: string;
  media?: MusicBrainzMediaSummary[];
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface MusicBrainzSearchPayload {
  releases?: MusicBrainzReleaseSearchItem[];
}

interface MusicBrainzTrack {
  title?: string;
  length?: number;
  number?: string;
}

interface MusicBrainzMedia {
  position?: number;
  tracks?: MusicBrainzTrack[];
}

interface MusicBrainzReleasePayload {
  id?: string;
  title?: string;
  date?: string;
  media?: MusicBrainzMedia[];
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface CoverArtImage {
  front?: boolean;
  image?: string;
  thumbnails?: {
    large?: string;
    small?: string;
    [key: string]: string | undefined;
  };
}

interface CoverArtArchivePayload {
  images?: CoverArtImage[];
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const ITUNES_SEARCH = "https://itunes.apple.com/search";
const ITUNES_LOOKUP = "https://itunes.apple.com/lookup";
const MUSICBRAINZ_RELEASE_SEARCH = "https://musicbrainz.org/ws/2/release/";
const MUSICBRAINZ_RELEASE_LOOKUP = "https://musicbrainz.org/ws/2/release";
const COVER_ART_ARCHIVE = "https://coverartarchive.org/release";

const DEFAULT_USER_AGENT = "cardpress/0.1";
const MUSICBRAINZ_USER_AGENT = "cardpress/0.1 (https://cardpress.miscellanics.com)";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function safeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

function formatDuration(ms?: number): string {
  if (!Number.isFinite(ms)) return "--:--";
  const totalSec = Math.max(0, Math.floor((ms as number) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function upscaleArtwork(url?: string): string | null {
  if (!url) return null;
  return url.replace(/\d+x\d+bb/g, "1200x1200bb");
}

function parseProvider(raw: string | null): ProviderMode {
  const value = (raw || "itunes").trim().toLowerCase();
  if (value === "musicbrainz") return "musicbrainz";
  if (value === "auto") return "auto";
  return "itunes";
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatArtistCredit(credits?: MusicBrainzArtistCredit[]): string {
  if (!Array.isArray(credits) || !credits.length) {
    return "Unknown Artist";
  }
  const names = credits
    .map((credit) => safeText(credit.name || credit.artist?.name))
    .filter(Boolean);
  return names.join(", ") || "Unknown Artist";
}

function trackCountFromMedia(media?: MusicBrainzMediaSummary[]): number {
  if (!Array.isArray(media)) return 0;
  return media.reduce((total, part) => total + (part["track-count"] ?? 0), 0);
}

async function fetchJson<T>(
  url: URL | string,
  options?: { userAgent?: string; cacheTtl?: number }
): Promise<T> {
  const response = await fetch(url.toString(), {
    headers: {
      "user-agent": options?.userAgent || DEFAULT_USER_AGENT,
      accept: "application/json"
    },
    cf: options?.cacheTtl
      ? {
          cacheEverything: true,
          cacheTtl: options.cacheTtl
        }
      : undefined
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`Upstream request failed with ${response.status}`);
  }

  return response.json<T>();
}

async function searchItunesAlbums(query: string, limit: number): Promise<AlbumSearchItem[]> {
  const url = new URL(ITUNES_SEARCH);
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "album");
  url.searchParams.set("media", "music");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));

  const payload = await fetchJson<{ results?: ItunesCollectionRecord[] }>(url);
  const results = payload.results ?? [];

  return results
    .filter((item) => item.wrapperType === "collection" && item.collectionType === "Album" && Number.isFinite(item.collectionId))
    .map((item) => ({
      id: String(item.collectionId as number),
      title: safeText(item.collectionName, "Untitled Album"),
      artist: safeText(item.artistName, "Unknown Artist"),
      coverUrl: upscaleArtwork(item.artworkUrl100),
      releaseDate: item.releaseDate ?? null,
      trackCount: item.trackCount ?? 0,
      source: "itunes" as const
    }));
}

function toItunesAlbumDetail(records: Array<ItunesCollectionRecord | ItunesTrackRecord>): AlbumDetail | null {
  const collection = records.find(
    (item): item is ItunesCollectionRecord => item.wrapperType === "collection" && Number.isFinite((item as ItunesCollectionRecord).collectionId)
  );

  if (!collection || !Number.isFinite(collection.collectionId)) {
    return null;
  }

  const tracks = records
    .filter((item): item is ItunesTrackRecord => item.wrapperType === "track" && typeof (item as ItunesTrackRecord).trackName === "string")
    .sort((a, b) => {
      const discA = a.discNumber ?? 1;
      const discB = b.discNumber ?? 1;
      if (discA !== discB) return discA - discB;
      return (a.trackNumber ?? 999) - (b.trackNumber ?? 999);
    })
    .map((track, index) => ({
      trackNumber: track.trackNumber ?? index + 1,
      title: safeText(track.trackName, `Track ${index + 1}`),
      durationMs: Number.isFinite(track.trackTimeMillis) ? (track.trackTimeMillis as number) : null,
      duration: formatDuration(track.trackTimeMillis)
    }));

  return {
    id: String(collection.collectionId),
    title: safeText(collection.collectionName, "Untitled Album"),
    artist: safeText(collection.artistName, "Unknown Artist"),
    coverUrl: upscaleArtwork(collection.artworkUrl100),
    releaseDate: collection.releaseDate ?? null,
    tracks,
    source: "itunes"
  };
}

async function fetchItunesAlbumById(id: string): Promise<AlbumDetail | null> {
  const numericId = parsePositiveInt(id);
  if (!numericId) return null;

  const url = new URL(ITUNES_LOOKUP);
  url.searchParams.set("id", String(numericId));
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "500");

  const payload = await fetchJson<{ results?: Array<ItunesCollectionRecord | ItunesTrackRecord> }>(url);
  return toItunesAlbumDetail(payload.results ?? []);
}

async function searchMusicBrainzAlbums(query: string, limit: number): Promise<AlbumSearchItem[]> {
  const url = new URL(MUSICBRAINZ_RELEASE_SEARCH);
  url.searchParams.set("query", query);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));

  const payload = await fetchJson<MusicBrainzSearchPayload>(url, {
    userAgent: MUSICBRAINZ_USER_AGENT,
    cacheTtl: 1800
  });

  return (payload.releases ?? []).map((release) => ({
    id: safeText(release.id),
    title: safeText(release.title, "Untitled Album"),
    artist: formatArtistCredit(release["artist-credit"]),
    coverUrl: null,
    releaseDate: safeText(release.date) || null,
    trackCount: trackCountFromMedia(release.media),
    source: "musicbrainz" as const
  })).filter((item) => Boolean(item.id));
}

async function fetchCoverArtUrl(releaseId: string): Promise<string | null> {
  const url = new URL(`${COVER_ART_ARCHIVE}/${encodeURIComponent(releaseId)}`);

  try {
    const payload = await fetchJson<CoverArtArchivePayload>(url, {
      userAgent: MUSICBRAINZ_USER_AGENT,
      cacheTtl: 86400
    });

    const images = payload.images ?? [];
    if (!images.length) return null;

    const preferred = images.find((image) => image.front) || images[0];
    return preferred.thumbnails?.large || preferred.thumbnails?.["1200"] || preferred.image || null;
  } catch {
    return null;
  }
}

function parseMusicBrainzTrackNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function fetchMusicBrainzAlbumById(id: string): Promise<AlbumDetail | null> {
  if (!isUuidLike(id)) return null;

  const url = new URL(`${MUSICBRAINZ_RELEASE_LOOKUP}/${encodeURIComponent(id)}`);
  url.searchParams.set("inc", "recordings+artist-credits");
  url.searchParams.set("fmt", "json");

  const payload = await fetchJson<MusicBrainzReleasePayload>(url, {
    userAgent: MUSICBRAINZ_USER_AGENT,
    cacheTtl: 1800
  });

  if (!payload.id) return null;

  const media = (payload.media ?? []).slice().sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  let running = 0;

  const tracks: TrackItem[] = [];
  for (const medium of media) {
    for (const track of medium.tracks ?? []) {
      running += 1;
      const trackNumber = parseMusicBrainzTrackNumber(track.number, running);
      const durationMs = Number.isFinite(track.length) ? (track.length as number) : null;
      tracks.push({
        trackNumber,
        title: safeText(track.title, `Track ${running}`),
        durationMs,
        duration: formatDuration(durationMs ?? undefined)
      });
    }
  }

  const coverUrl = await fetchCoverArtUrl(payload.id);

  return {
    id: payload.id,
    title: safeText(payload.title, "Untitled Album"),
    artist: formatArtistCredit(payload["artist-credit"]),
    coverUrl,
    releaseDate: safeText(payload.date) || null,
    tracks,
    source: "musicbrainz"
  };
}

function scoreCandidate(candidate: AlbumSearchItem, title: string, artist?: string): number {
  const candidateTitle = normalizeText(candidate.title);
  const titleNorm = normalizeText(title);
  const candidateArtist = normalizeText(candidate.artist);
  const artistNorm = artist ? normalizeText(artist) : "";

  let score = 0;

  if (candidateTitle === titleNorm) score += 80;
  else if (candidateTitle.includes(titleNorm)) score += 45;
  else if (titleNorm.includes(candidateTitle)) score += 30;

  if (artistNorm) {
    if (candidateArtist === artistNorm) score += 60;
    else if (candidateArtist.includes(artistNorm) || artistNorm.includes(candidateArtist)) score += 30;
  }

  const releaseYear = candidate.releaseDate ? Number.parseInt(candidate.releaseDate.slice(0, 4), 10) : NaN;
  if (Number.isFinite(releaseYear)) {
    score += Math.max(0, 12 - Math.abs(new Date().getUTCFullYear() - releaseYear) / 5);
  }

  return score;
}

async function fetchItunesAlbumByTitleArtist(title: string, artist?: string): Promise<AlbumDetail | null> {
  const query = artist ? `${title} ${artist}` : title;
  const candidates = await searchItunesAlbums(query, 20);
  if (!candidates.length) return null;

  const best = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, title, artist) }))
    .sort((a, b) => b.score - a.score)[0]?.candidate;

  if (!best) return null;
  return fetchItunesAlbumById(best.id);
}

async function fetchMusicBrainzAlbumByTitleArtist(title: string, artist?: string): Promise<AlbumDetail | null> {
  const query = artist ? `${title} ${artist}` : title;
  const candidates = await searchMusicBrainzAlbums(query, 20);
  if (!candidates.length) return null;

  const best = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, title, artist) }))
    .sort((a, b) => b.score - a.score)[0]?.candidate;

  if (!best) return null;
  return fetchMusicBrainzAlbumById(best.id);
}

async function searchAlbums(query: string, provider: ProviderMode): Promise<AlbumSearchItem[]> {
  if (provider === "itunes") return searchItunesAlbums(query, 25);
  if (provider === "musicbrainz") return searchMusicBrainzAlbums(query, 25);

  const itunes = await searchItunesAlbums(query, 25);
  if (itunes.length) return itunes;
  return searchMusicBrainzAlbums(query, 25);
}

async function fetchAlbumById(id: string, provider: ProviderMode): Promise<AlbumDetail | null> {
  if (provider === "itunes") return fetchItunesAlbumById(id);
  if (provider === "musicbrainz") return fetchMusicBrainzAlbumById(id);

  if (isUuidLike(id)) {
    const musicBrainzAlbum = await fetchMusicBrainzAlbumById(id);
    if (musicBrainzAlbum) return musicBrainzAlbum;
  }

  const itunesAlbum = await fetchItunesAlbumById(id);
  if (itunesAlbum) return itunesAlbum;
  return fetchMusicBrainzAlbumById(id);
}

async function fetchAlbumByTitleArtist(title: string, artist: string | undefined, provider: ProviderMode): Promise<AlbumDetail | null> {
  if (provider === "itunes") return fetchItunesAlbumByTitleArtist(title, artist);
  if (provider === "musicbrainz") return fetchMusicBrainzAlbumByTitleArtist(title, artist);

  const itunesAlbum = await fetchItunesAlbumByTitleArtist(title, artist);
  if (itunesAlbum) return itunesAlbum;
  return fetchMusicBrainzAlbumByTitleArtist(title, artist);
}

// ---------------------------------------------------------------------------
// Songlink enrichment — resolve a music URL to its Spotify equivalent
// ---------------------------------------------------------------------------

async function fetchSpotifyIdViaSonglink(musicUrl: string): Promise<{ spotifyId: string; spotifyUrl: string } | null> {
  const reqUrl = new URL("https://api.song.link/v1-alpha.1/links");
  reqUrl.searchParams.set("url", musicUrl);

  const resp = await fetch(reqUrl.toString());
  if (!resp.ok) return null;

  const data = await resp.json() as {
    linksByPlatform?: {
      spotify?: { url?: string };
    };
  };

  const spotifyUrl = data.linksByPlatform?.spotify?.url;
  if (!spotifyUrl) return null;

  const match = spotifyUrl.match(/album\/([a-zA-Z0-9]+)/);
  if (!match) return null;

  return { spotifyId: match[1], spotifyUrl };
}

function isSafeImageTarget(target: URL): boolean {
  if (!["http:", "https:"].includes(target.protocol)) return false;
  if (target.username || target.password) return false;
  return true;
}

async function proxyImage(target: URL): Promise<Response> {
  const upstream = await fetch(target.toString(), {
    cf: {
      cacheEverything: true,
      cacheTtl: 86400
    }
  } as RequestInit);

  if (!upstream.ok || !upstream.body) {
    return new Response("Image fetch failed", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return new Response("Unsupported content type", { status: 415 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400"
    }
  });
}

function generateShareCode(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SHARE_BUCKET?: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, providers: ["itunes", "musicbrainz"], defaultProvider: "itunes" });
    }

    if (url.pathname === "/api/search") {
      const query = safeText(url.searchParams.get("q"));
      if (query.length < 2) {
        return json({ error: "Query must be at least 2 characters." }, 400);
      }

      const provider = parseProvider(url.searchParams.get("provider"));

      try {
        const items = await searchAlbums(query, provider);
        return json({ provider, results: items });
      } catch (error) {
        return json({ error: (error as Error).message }, 502);
      }
    }

    if (url.pathname === "/api/album") {
      const id = safeText(url.searchParams.get("id"));
      if (!id) {
        return json({ error: "Missing or invalid id." }, 400);
      }

      const provider = parseProvider(url.searchParams.get("provider"));

      try {
        const album = await fetchAlbumById(id, provider);
        if (!album) {
          return json({ error: "Album not found." }, 404);
        }
        return json({ provider, album });
      } catch (error) {
        return json({ error: (error as Error).message }, 502);
      }
    }

    if (url.pathname === "/api/album-by-text") {
      const title = safeText(url.searchParams.get("title"));
      const artist = safeText(url.searchParams.get("artist"));
      if (!title) {
        return json({ error: "Missing title." }, 400);
      }

      const provider = parseProvider(url.searchParams.get("provider"));

      try {
        const album = await fetchAlbumByTitleArtist(title, artist || undefined, provider);
        if (!album) {
          return json({ error: "Album not found." }, 404);
        }
        return json({ provider, album });
      } catch (error) {
        return json({ error: (error as Error).message }, 502);
      }
    }

    if (url.pathname === "/api/enrich-spotify") {
      const musicUrl = url.searchParams.get("url");
      const title = safeText(url.searchParams.get("title"));
      const artist = safeText(url.searchParams.get("artist"));

      // Direct URL path: caller provides an iTunes/Apple Music URL
      if (musicUrl) {
        const result = await fetchSpotifyIdViaSonglink(musicUrl);
        return json({ spotify: result });
      }

      // Title+artist path: search iTunes first, then resolve via Songlink
      if (title) {
        const itunesResults = await searchItunesAlbums(artist ? `${title} ${artist}` : title, 5);
        const best = itunesResults.length
          ? itunesResults
              .map((c) => ({ c, score: scoreCandidate(c, title, artist || undefined) }))
              .sort((a, b) => b.score - a.score)[0]?.c
          : null;

        if (best) {
          const itunesUrl = `https://music.apple.com/album/${best.id}`;
          const result = await fetchSpotifyIdViaSonglink(itunesUrl);
          return json({ spotify: result });
        }
        return json({ spotify: null });
      }

      return json({ error: "Provide url or title parameter" }, 400);
    }

    if (url.pathname === "/api/image") {
      const raw = url.searchParams.get("url");
      if (!raw) {
        return new Response("Missing url", { status: 400 });
      }

      let target: URL;
      try {
        target = new URL(raw);
      } catch {
        return new Response("Invalid url", { status: 400 });
      }

      if (!isSafeImageTarget(target)) {
        return new Response("Unsupported image url", { status: 400 });
      }

      return proxyImage(target);
    }

    // Share: store album list, return share code
    if (url.pathname === "/api/share" && request.method === "POST") {
      if (!env.SHARE_BUCKET) {
        return json({ error: "Share storage not configured" }, 503);
      }
      const body = await request.json() as { albums: unknown[] };
      if (!Array.isArray(body.albums) || body.albums.length === 0) {
        return json({ error: "albums array required" }, 400);
      }
      if (body.albums.length > 200) {
        return json({ error: "Too many albums (max 200)" }, 400);
      }
      const code = generateShareCode();
      await env.SHARE_BUCKET.put(`share/${code}`, JSON.stringify(body.albums), {
        httpMetadata: { contentType: "application/json" },
      });
      return json({ code });
    }

    // Share: retrieve shared album list
    if (url.pathname.startsWith("/api/share/")) {
      const code = url.pathname.split("/api/share/")[1];
      if (!code || !/^[a-z2-9]{6}$/.test(code) || !env.SHARE_BUCKET) {
        return json({ error: "Not found" }, 404);
      }
      const obj = await env.SHARE_BUCKET.get(`share/${code}`);
      if (!obj) {
        return json({ error: "Share code not found or expired" }, 404);
      }
      const data = await obj.text();
      return new Response(data, { headers: { "content-type": "application/json" } });
    }

    // SPA fallback — serve index.html for non-API routes
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
