<p align="center">
  <img src="app/assets/logo.svg" width="80" height="80" alt="Cardpress logo" />
</p>

<h1 align="center">Cardpress</h1>

<p align="center">
  Design and print beautiful album cards from your music collection.
</p>

<p align="center">
  <a href="https://cardpress.miscellanics.com"><strong>cardpress.miscellanics.com</strong></a>
</p>

---

Cardpress generates **63x88 mm** double-sided music album cards — front with cover art, title and artist; back with the full tracklist, durations, and an optional QR code. Search any album, customize the design in the Style Studio, then export as PNG, PDF, or print-ready duplex sheets.

## Features

- **Search** albums via iTunes or MusicBrainz (or auto-detect)
- **Design** front and back cards with a visual Style Studio
  - Typography, colors, gradients, borders, spacing
  - Built-in presets: Paper, Slate, Midnight, Rosé, Brutalist, Forest
  - Save/load custom style profiles
- **Export** single cards as front PNG, back PNG, or 2-page PDF
- **Batch** generate duplex print PDFs from CSV (3x3 per page)
- **Print production** controls: A4/Letter, bleed, margins, crop marks
- **Tracklist overflow** handling: auto-downscale, multi-column, wrapping

## Pages

| Page | Purpose |
|------|---------|
| **Design** | Search, preview, style, and export a single card |
| **Print** | Queue multiple cards and generate duplex print sheets |

## CSV batch

Upload a CSV with these columns (case-insensitive aliases supported):

- **Title**: `Title`, `Album`, `Album Title`
- **Artist**: `Artist`, `Album Artist`, `Band`, `Performer`
- **Cover URL**: `Cover Image URL`, `Cover URL`, `Cover`, `Image URL`, `Artwork URL`

Extra columns are ignored. A template CSV can be downloaded from the UI.

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

## License

MIT (see [LICENSE](./LICENSE)).
