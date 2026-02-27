import type { AlbumDetail, CardSettings } from "./types";

/**
 * Resolve the text to encode in the QR code based on settings and album data.
 */
export function resolveQrText(settings: CardSettings, album: AlbumDetail): string {
  switch (settings.qrContentMode) {
    case "album-id":
      return album.id;
    case "title":
      return `${album.title} - ${album.artist}`;
    case "spotify": {
      const q = encodeURIComponent(`${album.title} ${album.artist}`);
      return `https://open.spotify.com/search/${q}`;
    }
    case "apple-music": {
      const q = encodeURIComponent(`${album.title} ${album.artist}`);
      return `https://music.apple.com/search?term=${q}`;
    }
    case "custom":
      return settings.qrCustomText || album.title;
    default:
      return `${album.title} - ${album.artist}`;
  }
}
