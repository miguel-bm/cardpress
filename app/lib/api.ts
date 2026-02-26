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
