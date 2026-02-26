# AGENTS.md

Guidance for coding agents and contributors working in this repository.

## Project Summary
- App: Album Card Generator
- Runtime: Cloudflare Workers + static assets
- Package manager: `pnpm`
- UI: React 19 + Tailwind CSS v4 + Radix UI in `app/`
- Build tool: Vite 6 with @cloudflare/vite-plugin
- Worker/API: TypeScript in `src/index.ts`

## Key Paths
- `app/main.tsx` — React entry point
- `app/App.tsx` — root component, routing, providers
- `app/lib/types.ts` — shared types, defaults, presets
- `app/lib/canvas.ts` — canvas rendering (pure functions)
- `app/lib/api.ts` — API client
- `app/lib/export.ts` — PNG/PDF export
- `app/lib/profiles.ts` — localStorage profile management
- `app/lib/csv.ts` — CSV parsing and batch PDF generation
- `app/components/` — React components
- `app/pages/` — page-level components
- `app/context/` — React context providers
- `src/index.ts` — Worker API routes (unchanged)
- `wrangler.jsonc` — Worker config (unchanged)

## Core Behavior
- Card size is fixed at **63x88 mm**.
- Front side: cover image + title + artist.
- Back side: track list + durations, reserved lower strip with QR + blank area.
- Batch mode outputs duplex-ready PDFs with 3x3 layout.

## Commands
- Install: `pnpm install`
- Dev: `pnpm run dev` (Vite dev server with Worker)
- Build: `pnpm run build`
- Typecheck: `pnpm run typecheck`
- Deploy: `pnpm run deploy`

## Engineering Rules
- UI framework: React 19 + Vite
- Styling: Tailwind CSS v4 (utility-first, tokens in `app/index.css` @theme)
- UI primitives: Radix UI (accordion, slider, switch)
- Animations: Framer Motion
- State: React Context (`SettingsContext`, `AlbumContext`)
- Canvas rendering is pure TypeScript functions in `app/lib/canvas.ts` — do not add React dependencies there
- Preserve mm-based print math and conversion helpers.
- When changing print/output behavior, verify:
  - single-card PNG/PDF export
  - batch duplex PDF generation
  - bleed/crop-mark logic
- Keep style/profile settings compatible with localStorage format; prefer additive changes.

## Data Provider and Attribution
- Current provider is Apple iTunes Search/Lookup API.
- If data provider behavior changes, update:
  - `src/index.ts` API logic
  - public README attribution/legal section
- Do not imply endorsement by Apple.

## Pre-PR / Pre-Deploy Checklist
1. `pnpm run typecheck`
2. `pnpm run build`
3. Smoke test in dev server:
   - `/api/health`
   - album search
   - single export
   - CSV batch generation

## Security / Privacy
- No secrets should be hardcoded in repo files.
- Keep remote image handling through controlled Worker proxy logic.
