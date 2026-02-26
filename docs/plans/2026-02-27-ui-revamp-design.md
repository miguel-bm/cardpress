# UI Revamp Design — Album Card Generator

## Goal

Replace the current vanilla HTML/CSS/JS UI with a modern, premium, responsive interface using React + Tailwind CSS + Radix UI + Framer Motion. Visual direction: light editorial (Anthropic/Nixtio-inspired). The Style Studio is the primary workspace.

## Tech Stack

| Layer | Current | New |
|-------|---------|-----|
| Framework | Vanilla JS | React 19 + Vite |
| Styling | Monolithic CSS | Tailwind CSS v4 |
| Components | Native HTML | Radix UI primitives |
| Animations | None | Framer Motion |
| Routing | Tab JS | React Router (2 routes) |
| Build | Wrangler serves `public/` | Vite builds to `public/`, Wrangler serves it |

The Cloudflare Worker backend (`src/index.ts`) remains untouched. Only the frontend changes.

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Topbar: Logo + Search (centered, prominent) + Actions    │
├──────────────────────────────────────────────────────────┤
│                       │                                   │
│   Preview Panel       │     Style Studio                  │
│   (sticky, ~40%)      │     (scrollable, ~60%)            │
│                       │                                   │
│   ┌───────┐ ┌───────┐ │  ┌─ Presets (visual grid) ─────┐ │
│   │ Front │ │ Back  │ │  └──────────────────────────────┘ │
│   │       │ │       │ │  ┌─ Typography ─────────────────┐ │
│   │       │ │       │ │  └──────────────────────────────┘ │
│   └───────┘ └───────┘ │  ┌─ Front Background ──────────┐ │
│                       │  └──────────────────────────────┘ │
│   Album info + Export  │  ┌─ Back Background ───────────┐ │
│                       │  └──────────────────────────────┘ │
│                       │  ┌─ Frame + QR ─────────────────┐ │
│                       │  └──────────────────────────────┘ │
│                       │  ┌─ Print Production ───────────┐ │
│                       │  └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- Preview panel is `position: sticky` so cards remain visible while scrolling studio.
- Style Studio sections are Radix Accordion groups — collapsible, one or many open at once.
- Mobile: single column, preview at top, studio below.

### Routes

1. **`/`** — Design workspace (search + preview + style studio). This is the main experience.
2. **`/batch`** — CSV batch generator. Separate page with drag-and-drop upload, settings, and progress feedback.

## Visual Design

### Color palette

```
--bg:           #FAFAF8   (warm off-white)
--surface:      #FFFFFF   (cards, panels)
--surface-alt:  #F5F5F3   (subtle alternating rows, hover states)
--border:       #E8E5E0   (fine panel borders)
--border-focus: #1A1A1A   (focus rings)
--text:         #1A1A1A   (primary text)
--text-muted:   #6B6966   (secondary text)
--accent:       #1A1A1A   (primary buttons — black)
--accent-hover: #333333
--accent-soft:  #F0EFED   (secondary buttons, tags)
--success:      #16803C
--error:        #DC2626
```

### Typography

- **Font:** Inter (loaded via Google Fonts) — clean, professional, excellent at all sizes
- **Headings:** Semibold 600, generous size steps
- **Body:** Regular 400, 15-16px base
- **Monospace elements:** JetBrains Mono for code/values

### Panels and cards

- White background, 1px border `--border`, border-radius 12px
- Subtle box-shadow: `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)`
- No heavy shadows — the light editorial look relies on borders and whitespace

### Interactive elements

- **Buttons:** Two tiers — primary (black bg, white text) and secondary (transparent, border)
- **Inputs/selects:** Clean borders, generous padding, subtle focus ring
- **Sliders:** Custom-styled Radix sliders with visible value labels
- **Color pickers:** Popover-based picker (Radix popover + canvas picker), not native `<input type="color">`
- **Toggles:** Radix Switch components instead of checkboxes
- **Hover states:** Subtle background shifts, 150ms transitions

### Animations (Framer Motion)

- **Page transitions:** Fade + slight vertical translate between routes
- **Accordion open/close:** Smooth height animation (Radix + CSS)
- **Card preview:** Optional 3D flip on hover/click to toggle front ↔ back
- **Search results:** Staggered fade-in for result items
- **Toast notifications:** Slide in from top-right, auto-dismiss
- **Button feedback:** Scale on press (0.97)

## Component Architecture

```
App
├── TopBar
│   ├── Logo
│   ├── SearchBar (with autocomplete dropdown)
│   └── NavLinks (Design / Batch)
├── DesignPage (route: /)
│   ├── PreviewPanel (sticky)
│   │   ├── CardPreview (front canvas)
│   │   ├── CardPreview (back canvas)
│   │   ├── AlbumInfo
│   │   └── ExportActions
│   └── StyleStudio (scrollable)
│       ├── PresetPicker (visual grid)
│       ├── ProfileManager (save/load/delete)
│       ├── TypographySection (accordion)
│       ├── FrontBackgroundSection (accordion)
│       ├── BackBackgroundSection (accordion)
│       ├── BackOverflowSection (accordion)
│       ├── FrameQrSection (accordion)
│       └── PrintProductionSection (accordion)
├── BatchPage (route: /batch)
│   ├── CsvDropZone
│   ├── BatchSettings
│   ├── BatchProgress
│   └── BatchActions
└── Toaster (global)
```

### State management

- **React Context** for settings state (replaces the global `state` object)
- **localStorage** persistence remains compatible with current format (STYLE_STORAGE_KEY)
- **Canvas rendering** stays as imperative JS functions, called from React `useEffect` hooks when settings or album data change

### Key component behaviors

**SearchBar:** Debounced input (300ms), shows dropdown with album art thumbnails, keyboard navigable. Selected album populates the preview. Provider selector as a small dropdown inside the search bar.

**PresetPicker:** Grid of small cards, each showing a mini-preview (generated via tiny canvas or CSS representation). Click to apply. Current preset highlighted.

**CardPreview:** Wraps the existing canvas rendering logic. `useEffect` triggers re-render when settings or album change. Click to toggle front/back with flip animation.

**StyleStudio sections:** Each is an Accordion.Item with Radix. Controls inside use Radix Slider, Select, Switch. Every control calls a shared `updateSetting(key, value)` that updates context and triggers re-render.

**ExportActions:** Row of buttons — "Front PNG", "Back PNG", "2-Side PDF". Uses existing export logic wrapped in async handlers with loading states.

## Build & Deploy Integration

- Vite configured to output to `dist/` (or `public/` — needs to match wrangler.jsonc assets directory)
- `wrangler.jsonc` updated: `assets.directory` → `"./dist"`
- Dev workflow: `vite dev` proxies API requests to Wrangler, or we use Wrangler's built-in Vite support
- Scripts updated: `pnpm run dev` runs both Vite + Wrangler

## Migration Strategy

The existing `public/app.js` canvas rendering functions (`drawFrontCard`, `drawBackCard`, `generateBatchPdf`, etc.) are extracted into a standalone `lib/canvas.ts` module. These are pure functions that take a canvas context + settings + album data. The React layer calls them — no canvas logic is rewritten.

## What stays the same

- `src/index.ts` — backend Worker untouched
- Card dimensions (63x88mm), DPI constants, all print math
- localStorage format for profiles
- All API routes and provider logic
- Canvas rendering logic (extracted, not rewritten)

## What changes

- Entire `public/` directory rebuilt with Vite + React
- All HTML structure → React components
- All CSS → Tailwind utilities
- Tab navigation → React Router routes
- Native form controls → Radix UI primitives
- No animations → Framer Motion transitions
- Inline status messages → Toast notifications
