// ---------------------------------------------------------------------------
// API client, image loading, and QR code helpers
// Ported from public/app.js lines 392-434
// ---------------------------------------------------------------------------

import QRCode from "qrcode";
import type { AlbumSearchItem, AlbumDetail, ProviderMode } from "./types";

// ---------------------------------------------------------------------------
// Caches
// ---------------------------------------------------------------------------

const imageCache = new Map<string, HTMLImageElement>();
const qrCache = new Map<string, HTMLImageElement>();

// ---------------------------------------------------------------------------
// URL / fetch helpers
// ---------------------------------------------------------------------------

/** Proxy a remote image URL through our Worker endpoint */
export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

/** Fetch JSON from a URL; throw on non-2xx with the server error message */
export async function fetchJsonOrThrow<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}) as T);
  if (!response.ok) {
    throw new Error(
      (payload as Record<string, unknown>).error as string ||
        `Request failed (${response.status})`,
    );
  }
  return payload as T;
}

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

/** Load an image by URL, caching results. Returns null for falsy URLs. */
export async function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url)!;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });

  imageCache.set(url, image);
  return image;
}

// ---------------------------------------------------------------------------
// QR code generation
// ---------------------------------------------------------------------------

/** Generate a QR code as an HTMLImageElement (cached by text + colors). */
export async function getQrImage(
  text: string,
  dark: string,
  light: string,
): Promise<HTMLImageElement | null> {
  const key = `${text}::${dark}::${light}`;
  if (qrCache.has(key)) return qrCache.get(key)!;

  const dataUrl = await QRCode.toDataURL(text || "", {
    width: 900,
    margin: 0,
    color: { dark, light },
  });
  const img = await loadImage(dataUrl);
  qrCache.set(key, img!);
  return img;
}

// ---------------------------------------------------------------------------
// Typed API wrappers
// ---------------------------------------------------------------------------

interface SearchResponse {
  results: AlbumSearchItem[];
}

interface AlbumResponse {
  album: AlbumDetail;
}

/** Search albums via `/api/search` */
export async function searchAlbums(
  query: string,
  provider: ProviderMode,
): Promise<AlbumSearchItem[]> {
  const params = new URLSearchParams({ q: query, provider });
  const payload = await fetchJsonOrThrow<SearchResponse>(
    `/api/search?${params.toString()}`,
  );
  return payload.results || [];
}

/** Fetch a single album by ID via `/api/album` */
export async function fetchAlbum(
  id: string,
  provider: ProviderMode,
): Promise<AlbumDetail> {
  const params = new URLSearchParams({ id, provider });
  const payload = await fetchJsonOrThrow<AlbumResponse>(
    `/api/album?${params.toString()}`,
  );
  return payload.album;
}

/** Enrich an album with a Spotify ID via Songlink if it doesn't already have one.
 *  iTunes albums: resolved directly via Apple Music URL.
 *  MusicBrainz albums: resolved by searching iTunes for the same title+artist first. */
export async function enrichWithSpotifyId(album: AlbumDetail): Promise<AlbumDetail> {
  if (album.spotifyId) return album;

  const params = new URLSearchParams();

  if (album.source === "itunes") {
    params.set("url", `https://music.apple.com/album/${album.id}`);
  } else {
    // MusicBrainz or other sources: use title+artist search via iTunes → Songlink
    params.set("title", album.title);
    if (album.artist) params.set("artist", album.artist);
  }

  try {
    const resp = await fetch(`/api/enrich-spotify?${params.toString()}`);
    const data = await resp.json() as { spotify: { spotifyId: string; spotifyUrl: string } | null };
    if (data.spotify) {
      return { ...album, spotifyId: data.spotify.spotifyId, spotifyUrl: data.spotify.spotifyUrl };
    }
  } catch { /* best effort */ }

  return album;
}

/** Fetch a single album by title+artist text via `/api/album-by-text` */
export async function fetchAlbumByText(
  title: string,
  artist: string | undefined,
  provider: ProviderMode,
): Promise<AlbumDetail> {
  const params = new URLSearchParams({ title, provider });
  if (artist) params.set("artist", artist);
  const payload = await fetchJsonOrThrow<AlbumResponse>(
    `/api/album-by-text?${params.toString()}`,
  );
  return payload.album;
}
