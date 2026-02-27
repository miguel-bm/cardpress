<p align="center">
  <img src="app/assets/logo.svg" width="80" height="80" alt="Cardpress logo" />
</p>

<h1 align="center">Cardpress</h1>

<p align="center">
  Turn your digital music collection into physical album cards with NFC playback.
</p>

<p align="center">
  <a href="https://cardpress.miscellanics.com"><strong>cardpress.miscellanics.com</strong></a>
</p>

---

Cardpress turns your digital music collection into a deck of physical **63x88 mm** album cards. Each double-sided card shows cover art, title, and artist on the front; the back lists every track with durations and an optional QR code linking to Spotify, Discogs, or a Home Assistant tag URL. Stick an NFC tag behind each card, pair it with a Home Assistant automation, and tap the card on your phone to play the album on your home speaker.

### Workflow

1. **Design** -- Search for an album, customize the card style in the visual Style Studio.
2. **Print** -- Import your collection via CSV, generate duplex-ready PDF sheets (3x3 per page).
3. **Write NFC** -- Use the Write Tags page to program NFC stickers with album tag IDs via Web NFC.
4. **Play** -- Tap a card on your phone to trigger a Home Assistant automation and play the album.

## Features

- **Search** albums via iTunes or MusicBrainz (auto-detect or manual selection)
- **Design** front and back cards with a visual Style Studio
  - Typography, colors, gradients, borders, spacing
  - Built-in presets: Paper, Slate, Midnight, Rosé, Brutalist, Forest
  - Save/load custom style profiles
- **QR code modes**: Spotify link, HA Tag (Home Assistant tag URL), or Discogs
- **Export** single cards as front PNG, back PNG, or 2-page PDF
- **Print** queue with duplex PDF generation (3x3 per page), CSV bulk import
- **Print production** controls: A4/Letter, bleed, margins, crop marks
- **Tracklist overflow** handling: auto-downscale, multi-column, wrapping
- **NFC tag writing** via Web NFC API -- program NFC stickers directly from the browser (Chrome on Android)
- **Desktop-to-phone handoff** -- generate a share code on desktop, open it on your phone to write tags
- **Home Assistant automation** template -- copy or download a ready-made YAML automation that plays albums when an NFC tag is scanned

## Pages

| Page | Purpose |
|------|---------|
| **Design** | Search, preview, style, and export a single card |
| **Print** | Queue multiple cards and generate duplex print sheets |
| **Write Tags** | Program NFC stickers with album tag IDs via Web NFC; includes share-code handoff and HA automation template |
| **About** | Project overview, workflow summary, and links |

## CSV import

From the Print page, click **Import CSV** to bulk-add albums to your print queue. The CSV uses these columns (case-insensitive, order doesn't matter):

| Column | Required | Description |
|--------|----------|-------------|
| `title` | Yes | Album title |
| `artist` | No | Artist or band name |
| `cover_url` | No | URL to cover artwork image |
| `tracks` | No | Semicolon-separated track titles, e.g. `Intro;Main Theme;Credits` |
| `spotify_album_id` | No | Spotify album ID (used for QR codes and NFC tag IDs) |
| `spotify_album_url` | No | Spotify album URL |
| `discogs_url` | No | Discogs release URL (used for Discogs QR mode) |

Extra columns are ignored. Values containing commas must be quoted (standard CSV rules).

When **Fetch track list** is enabled during import, missing artist, cover art, and tracks are filled in automatically via API lookup.

## Local development

### Requirements

- Node.js 20+
- pnpm 10+

### Setup

```bash
pnpm install
pnpm run cf-typegen
pnpm run dev
```

Open `http://127.0.0.1:8787`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Local dev server |
| `pnpm run build` | Production build |
| `pnpm run typecheck` | TypeScript checks |
| `pnpm run deploy` | Build + deploy to Cloudflare Workers |
| `pnpm run deploy:dry-run` | Validate deploy bundle |
| `pnpm run ops:check` | Typecheck + dry-run deploy |

## Tech stack

- **Runtime**: Cloudflare Workers (static assets + API routes)
- **UI**: React 19, Tailwind CSS v4, Radix UI, Framer Motion
- **Build**: Vite + @cloudflare/vite-plugin
- **Rendering**: Canvas API (pure TypeScript)
- **PDF**: pdf-lib
- **QR**: qrcode
- **CSV**: PapaParse

## Data provider attribution

### Apple iTunes Search API

- [Search API docs](https://performance-partners.apple.com/search-api)
- [Linking policies](https://performance-partners.apple.com/linking-policies)

iTunes is a trademark of Apple Inc., registered in the U.S. and other countries and regions. This project is not affiliated with, endorsed by, or sponsored by Apple Inc.

### MusicBrainz + Cover Art Archive

- [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)
- [Cover Art Archive API](https://musicbrainz.org/doc/Cover_Art_Archive/API)

### Songlink/Odesli API

- [Songlink API docs](https://odesli.co/)

Used to resolve iTunes/MusicBrainz album URLs to their Spotify equivalents for NFC tag ID generation. Free, no authentication required.

## License

MIT (see [LICENSE](./LICENSE)).
