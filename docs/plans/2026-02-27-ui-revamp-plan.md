# UI Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the vanilla HTML/CSS/JS frontend with a modern React + Tailwind + Radix UI + Framer Motion interface while preserving all backend and canvas rendering logic.

**Architecture:** Vite builds the React frontend to `dist/`. The Cloudflare Worker serves these static assets and handles API routes unchanged. Canvas rendering functions are extracted from `public/app.js` into TypeScript modules and called from React effects. State lives in React Context with localStorage persistence.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4, Radix UI primitives, Framer Motion, React Router v7, pdf-lib, papaparse, qrcode, sonner (toasts)

---

## Task 1: Scaffold Vite + React + Cloudflare Workers project

**Files:**
- Create: `vite.config.ts`
- Create: `app/main.tsx`
- Create: `app/App.tsx`
- Create: `app/index.css`
- Modify: `package.json`
- Modify: `wrangler.jsonc`
- Modify: `tsconfig.json`

**Step 1: Install dependencies**

```bash
pnpm add react react-dom react-router framer-motion sonner
pnpm add -D @vitejs/plugin-react @cloudflare/vite-plugin tailwindcss @tailwindcss/vite @types/react @types/react-dom
pnpm add pdf-lib papaparse qrcode
pnpm add -D @types/papaparse
```

**Step 2: Create vite.config.ts**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
  ],
});
```

**Step 3: Create app entry point**

Create `app/index.css`:
```css
@import "tailwindcss";
```

Create `app/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create `app/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <h1 className="text-2xl font-semibold p-8">Album Card Generator</h1>
      <p className="px-8 text-[#6B6966]">React shell working.</p>
    </div>
  );
}
```

Create `index.html` at project root (Vite entry):
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Album Card Generator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/app/main.tsx"></script>
  </body>
</html>
```

**Step 4: Update wrangler.jsonc**

Remove the `assets` block (Cloudflare Vite plugin handles this). Keep `main`, `compatibility_date`, `compatibility_flags`, `observability`.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "album-card-generator",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-26",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "observability": {
    "enabled": true
  }
}
```

**Step 5: Update tsconfig.json**

Ensure it includes JSX support and the `app/` directory:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["@cloudflare/workers-types/2023-07-01"]
  },
  "include": ["app/**/*", "src/**/*", "worker-configuration.d.ts"]
}
```

**Step 6: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "cf-typegen": "wrangler types",
    "deploy": "wrangler deploy",
    "deploy:dry-run": "wrangler deploy --dry-run",
    "ops:check": "pnpm run typecheck && pnpm run deploy:dry-run"
  }
}
```

**Step 7: Verify dev server starts**

Run: `pnpm run dev`
Expected: Vite dev server starts, React shell renders at localhost with "Album Card Generator" heading and "React shell working." text. API routes (`/api/health`) proxied through to Worker.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind + Cloudflare Workers"
```

---

## Task 2: Configure Tailwind design tokens and base styles

**Files:**
- Modify: `app/index.css`

**Step 1: Set up Tailwind with custom theme**

Update `app/index.css`:
```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F5F5F3;
  --color-border: #E8E5E0;
  --color-border-focus: #1A1A1A;
  --color-text: #1A1A1A;
  --color-text-muted: #6B6966;
  --color-text-faint: #A09D98;
  --color-accent: #1A1A1A;
  --color-accent-hover: #333333;
  --color-accent-soft: #F0EFED;
  --color-success: #16803C;
  --color-error: #DC2626;
}

@layer base {
  body {
    @apply bg-bg text-text font-sans antialiased;
  }
}
```

**Step 2: Verify tokens apply**

Update `app/App.tsx` temporarily to use custom colors:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <h1 className="text-2xl font-semibold p-8">Album Card Generator</h1>
      <p className="px-8 text-text-muted">Tailwind tokens working.</p>
    </div>
  );
}
```

Run: `pnpm run dev`
Expected: Warm off-white background, correct font, muted text color visible.

**Step 3: Commit**

```bash
git add app/index.css app/App.tsx
git commit -m "feat: configure Tailwind design tokens and base styles"
```

---

## Task 3: Extract canvas rendering into lib/canvas.ts

This is the most critical extraction. All pure canvas functions move to a typed module. No DOM references, no `el.*`, no `state.*` — just functions that take a canvas context, settings, and data.

**Files:**
- Create: `app/lib/canvas.ts`
- Create: `app/lib/types.ts`

**Step 1: Create shared types**

Create `app/lib/types.ts`:
```ts
export interface AlbumSearchItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  trackCount: number;
  source: "itunes" | "musicbrainz";
}

export interface TrackItem {
  trackNumber: number;
  title: string;
  durationMs: number | null;
  duration: string;
}

export interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  tracks: TrackItem[];
  source: "itunes" | "musicbrainz";
}

export type ProviderMode = "itunes" | "musicbrainz" | "auto";

export interface CardSettings {
  fontFamily: string;
  textColor: string;
  titleSizePt: number;
  artistSizePt: number;
  trackSizePt: number;
  titleWeight: string;
  artistWeight: string;
  trackWeight: string;
  titleAlign: string;
  artistAlign: string;

  frontFillMode: string;
  frontBg: string;
  frontBg2: string;
  frontGradientAngle: number;

  backFillMode: string;
  backBg: string;
  backBg2: string;
  backGradientAngle: number;
  lineColor: string;
  trackSpacing: number;
  backReserveBg: string;
  backOverflowMode: string;
  backMinTrackSizePt: number;
  backMaxColumns: number;
  backColumnGapMm: number;

  coverBorderEnabled: boolean;
  coverBorderColor: string;
  coverBorderWidthMm: number;

  borderEnabled: boolean;
  borderColor: string;
  borderWidthMm: number;
  cornerRadiusMm: number;

  qrDark: string;
  qrLight: string;
  qrScale: number;

  printPageSize: string;
  printGapMm: number;
  printMarginMm: number;
  printBleedMm: number;
  printCropMarks: boolean;
  printCropLengthMm: number;
  printCropOffsetMm: number;
}

export const DEFAULT_SETTINGS: CardSettings = {
  fontFamily: "'Inter', sans-serif",
  textColor: "#1f1d17",
  titleSizePt: 13,
  artistSizePt: 10,
  trackSizePt: 7,
  titleWeight: "700",
  artistWeight: "600",
  trackWeight: "500",
  titleAlign: "center",
  artistAlign: "center",
  frontFillMode: "solid",
  frontBg: "#f5f3ee",
  frontBg2: "#eadfce",
  frontGradientAngle: 145,
  backFillMode: "solid",
  backBg: "#fbf9f3",
  backBg2: "#ece8dd",
  backGradientAngle: 160,
  lineColor: "#8a8577",
  trackSpacing: 1,
  backReserveBg: "#f4efe4",
  backOverflowMode: "auto",
  backMinTrackSizePt: 6,
  backMaxColumns: 2,
  backColumnGapMm: 2,
  coverBorderEnabled: false,
  coverBorderColor: "#ffffff",
  coverBorderWidthMm: 0,
  borderEnabled: true,
  borderColor: "#8a8577",
  borderWidthMm: 0.4,
  cornerRadiusMm: 2,
  qrDark: "#111111",
  qrLight: "#ffffff",
  qrScale: 0.9,
  printPageSize: "A4",
  printGapMm: 2,
  printMarginMm: 6,
  printBleedMm: 1.5,
  printCropMarks: true,
  printCropLengthMm: 3,
  printCropOffsetMm: 1.2,
};

export interface BuiltinPreset extends Partial<CardSettings> {
  [key: string]: unknown;
}

export const BUILTIN_PRESETS: Record<string, BuiltinPreset> = {
  "Warm Minimal": {
    fontFamily: "'Space Grotesk', sans-serif",
    frontFillMode: "solid",
    frontBg: "#f5f3ee",
    frontBg2: "#eadfce",
    frontGradientAngle: 145,
    backFillMode: "solid",
    backBg: "#fbf9f3",
    backBg2: "#ece8dd",
    backGradientAngle: 160,
    textColor: "#1f1d17",
    lineColor: "#8a8577",
    titleAlign: "center",
    artistAlign: "center",
    borderEnabled: true,
    borderColor: "#8a8577",
    borderWidthMm: 0.4,
    cornerRadiusMm: 2,
    backReserveBg: "#f4efe4",
  },
  "Mono Studio": {
    fontFamily: "'IBM Plex Sans', sans-serif",
    frontFillMode: "gradient",
    frontBg: "#f1f1f1",
    frontBg2: "#dadada",
    frontGradientAngle: 30,
    backFillMode: "gradient",
    backBg: "#f6f6f6",
    backBg2: "#e2e2e2",
    backGradientAngle: 30,
    textColor: "#1f1f1f",
    lineColor: "#5f5f5f",
    titleWeight: "700",
    artistWeight: "500",
    trackWeight: "500",
    qrDark: "#1a1a1a",
    qrLight: "#fdfdfd",
    borderEnabled: true,
    borderColor: "#3a3a3a",
    borderWidthMm: 0.5,
    cornerRadiusMm: 1.5,
    backReserveBg: "#efefef",
  },
  "Night Vinyl": {
    fontFamily: "'Fira Sans', sans-serif",
    frontFillMode: "gradient",
    frontBg: "#23242a",
    frontBg2: "#3b2e31",
    frontGradientAngle: 225,
    backFillMode: "gradient",
    backBg: "#1f2026",
    backBg2: "#2e333d",
    backGradientAngle: 200,
    textColor: "#f3eee5",
    lineColor: "#cba36c",
    borderEnabled: true,
    borderColor: "#cba36c",
    borderWidthMm: 0.5,
    cornerRadiusMm: 3,
    qrDark: "#f3eee5",
    qrLight: "#23242a",
    backReserveBg: "#2d2f36",
  },
  "Ocean Pop": {
    fontFamily: "'Manrope', sans-serif",
    frontFillMode: "gradient",
    frontBg: "#e9f5fb",
    frontBg2: "#c8e6f5",
    frontGradientAngle: 145,
    backFillMode: "gradient",
    backBg: "#eaf9f5",
    backBg2: "#d3efea",
    backGradientAngle: 160,
    textColor: "#123241",
    lineColor: "#2c7285",
    titleAlign: "left",
    artistAlign: "left",
    borderEnabled: true,
    borderColor: "#2c7285",
    borderWidthMm: 0.4,
    cornerRadiusMm: 4,
    backReserveBg: "#d9f0ea",
  },
};
```

**Step 2: Create canvas rendering module**

Create `app/lib/canvas.ts`. This file contains all pure canvas rendering functions extracted from `public/app.js` lines 282-793 and 827-993 and 1012-1187 and 1188-1302. Port them to TypeScript, keeping the exact same logic. The functions are:

- `mmToPx`, `mmToPt`, `getPageSizeMm`, `formatDuration`, `slug`
- `createGradient`, `fillBackground`, `roundedRectPath`
- `drawImageCover`, `drawWrappedText`, `getAlignedTextX`, `fitText`
- `buildTrackLayoutCandidates`, `computeTrackLayout`
- `drawFront`, `drawBack`, `drawCardFrame`, `drawCardToCanvas`, `drawPlaceholder`
- `extendCanvasWithBleed`, `renderExportCanvas`
- `drawGridGuides`, `drawCropMarksForCard`

All functions receive their dependencies as parameters (canvas context, settings, dimensions, image data) — no global state, no DOM references.

The file should export:
```ts
export {
  CARD_WIDTH_MM, CARD_HEIGHT_MM, BACK_RESERVED_MM,
  PREVIEW_DPI, EXPORT_DPI, SHEET_DPI,
  GRID_COLS, GRID_ROWS, PAGE_SIZES_MM,
  mmToPx, mmToPt, getPageSizeMm, formatDuration, slug,
  createGradient, fillBackground, roundedRectPath,
  drawImageCover, drawWrappedText, getAlignedTextX, fitText,
  buildTrackLayoutCandidates, computeTrackLayout,
  drawFront, drawBack, drawCardFrame, drawCardToCanvas, drawPlaceholder,
  extendCanvasWithBleed, renderExportCanvas,
  drawGridGuides, drawCropMarksForCard,
};
```

Port every function from `public/app.js` faithfully. Use `CardSettings` and `AlbumDetail` types from `types.ts`. Keep the exact same rendering math. Do not change any visual output.

**Step 3: Verify typecheck passes**

Run: `pnpm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/lib/canvas.ts app/lib/types.ts
git commit -m "feat: extract canvas rendering and types into typed modules"
```

---

## Task 4: Extract API client and utility functions

**Files:**
- Create: `app/lib/api.ts`
- Create: `app/lib/export.ts`
- Create: `app/lib/profiles.ts`
- Create: `app/lib/csv.ts`

**Step 1: Create API client**

Create `app/lib/api.ts` — extracts `fetchJsonOrThrow`, `proxyImageUrl`, `loadImage`, `getQrImage` from `public/app.js` lines 392-434. Add typed wrappers for `/api/search`, `/api/album`, `/api/album-by-text`.

```ts
import type { AlbumSearchItem, AlbumDetail, ProviderMode } from "./types";

const imageCache = new Map<string, HTMLImageElement>();
const qrCache = new Map<string, HTMLImageElement>();

export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

export async function fetchJsonOrThrow<T>(url: string): Promise<T> { ... }
export async function loadImage(url: string): Promise<HTMLImageElement | null> { ... }
export async function getQrImage(text: string, dark: string, light: string): Promise<HTMLImageElement> { ... }

export async function searchAlbums(query: string, provider: ProviderMode): Promise<AlbumSearchItem[]> {
  const params = new URLSearchParams({ q: query, provider });
  const data = await fetchJsonOrThrow<{ results: AlbumSearchItem[] }>(`/api/search?${params}`);
  return data.results;
}

export async function fetchAlbum(id: string, provider: ProviderMode): Promise<AlbumDetail> {
  const params = new URLSearchParams({ id, provider });
  const data = await fetchJsonOrThrow<{ album: AlbumDetail }>(`/api/album?${params}`);
  return data.album;
}
```

**Step 2: Create export helpers**

Create `app/lib/export.ts` — extracts `canvasToBlob`, `canvasToBytes`, `downloadBlob`, `downloadSidePng`, `downloadCardPdf` from `public/app.js` lines 933-1067.

These need canvas rendering functions from `canvas.ts` as dependencies.

**Step 3: Create profile management**

Create `app/lib/profiles.ts` — extracts `loadProfilesFromStorage`, `saveProfilesToStorage`, profile CRUD from `public/app.js` lines 1338-1455.

```ts
import type { CardSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const STYLE_STORAGE_KEY = "album-card-style-profiles-v1";
const DEFAULT_PROFILE_NAME = "current-style";

export function loadProfiles(): Record<string, Partial<CardSettings>> { ... }
export function saveProfiles(profiles: Record<string, Partial<CardSettings>>): void { ... }
export function saveProfile(name: string, settings: CardSettings): void { ... }
export function loadProfile(name: string): CardSettings | null { ... }
export function deleteProfile(name: string): void { ... }
export function persistCurrentAsDefault(settings: CardSettings): void { ... }
export function loadInitialSettings(): CardSettings { ... }
```

**Step 4: Create CSV utilities**

Create `app/lib/csv.ts` — extracts `normalizeKey`, `rowValue`, `parseCsvFile`, `buildAlbumFromCsvRow`, `mapWithConcurrency`, `generateBatchPdf` from `public/app.js` lines 1068-1302.

**Step 5: Verify typecheck passes**

Run: `pnpm run typecheck`
Expected: No errors

**Step 6: Commit**

```bash
git add app/lib/api.ts app/lib/export.ts app/lib/profiles.ts app/lib/csv.ts
git commit -m "feat: extract API client, export, profiles, and CSV modules"
```

---

## Task 5: Create React context for app state

**Files:**
- Create: `app/context/SettingsContext.tsx`
- Create: `app/context/AlbumContext.tsx`

**Step 1: Create SettingsContext**

```tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { CardSettings } from "../lib/types";
import { DEFAULT_SETTINGS } from "../lib/types";
import { loadInitialSettings, persistCurrentAsDefault } from "../lib/profiles";

interface SettingsContextValue {
  settings: CardSettings;
  updateSetting: <K extends keyof CardSettings>(key: K, value: CardSettings[K]) => void;
  applySettings: (partial: Partial<CardSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CardSettings>(loadInitialSettings);

  const updateSetting = useCallback(<K extends keyof CardSettings>(key: K, value: CardSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applySettings = useCallback((partial: Partial<CardSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  useEffect(() => {
    persistCurrentAsDefault(settings);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, applySettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
```

**Step 2: Create AlbumContext**

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import type { AlbumDetail, ProviderMode } from "../lib/types";

interface AlbumContextValue {
  album: AlbumDetail | null;
  setAlbum: (album: AlbumDetail | null) => void;
  provider: ProviderMode;
  setProvider: (provider: ProviderMode) => void;
}

const AlbumContext = createContext<AlbumContextValue | null>(null);

export function AlbumProvider({ children }: { children: ReactNode }) {
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [provider, setProvider] = useState<ProviderMode>(() => {
    return (localStorage.getItem("album-card-provider-v1") as ProviderMode) || "itunes";
  });

  return (
    <AlbumContext.Provider value={{ album, setAlbum, provider, setProvider }}>
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum() {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error("useAlbum must be used within AlbumProvider");
  return ctx;
}
```

**Step 3: Wire providers into App**

```tsx
import { SettingsProvider } from "./context/SettingsContext";
import { AlbumProvider } from "./context/AlbumContext";

export default function App() {
  return (
    <SettingsProvider>
      <AlbumProvider>
        <div className="min-h-screen bg-bg">
          <p className="p-8">Context providers working.</p>
        </div>
      </AlbumProvider>
    </SettingsProvider>
  );
}
```

**Step 4: Verify dev server and typecheck**

Run: `pnpm run typecheck && pnpm run dev`
Expected: No errors, page renders.

**Step 5: Commit**

```bash
git add app/context/
git commit -m "feat: create React context for settings and album state"
```

---

## Task 6: Build TopBar with search

**Files:**
- Create: `app/components/TopBar.tsx`
- Create: `app/components/SearchBar.tsx`

**Step 1: Build TopBar component**

The TopBar contains: logo/title on the left, centered search bar, navigation links on the right (Design / Batch).

```tsx
// app/components/TopBar.tsx
import { Link, useLocation } from "react-router";
import SearchBar from "./SearchBar";

export default function TopBar() {
  const location = useLocation();
  const isDesign = location.pathname === "/";
  const isBatch = location.pathname === "/batch";

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center gap-6">
        <Link to="/" className="font-semibold text-lg tracking-tight shrink-0">
          Album Cards
        </Link>
        <div className="flex-1 max-w-xl mx-auto">
          {isDesign && <SearchBar />}
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          <Link to="/" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDesign ? "bg-accent text-white" : "text-text-muted hover:text-text hover:bg-accent-soft"}`}>
            Design
          </Link>
          <Link to="/batch" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isBatch ? "bg-accent text-white" : "text-text-muted hover:text-text hover:bg-accent-soft"}`}>
            Batch
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: Build SearchBar with autocomplete**

The SearchBar has: text input with debounced search, provider dropdown inside the bar, dropdown results with album art thumbnails.

```tsx
// app/components/SearchBar.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useAlbum } from "../context/AlbumContext";
import { searchAlbums, fetchAlbum, proxyImageUrl } from "../lib/api";
import type { AlbumSearchItem } from "../lib/types";

export default function SearchBar() {
  const { setAlbum, provider, setProvider } = useAlbum();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlbumSearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  // Keyboard navigation (ArrowUp/Down/Enter/Escape)
  // Click-outside to close
  // Result selection -> fetchAlbum -> setAlbum

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-surface-alt border border-border rounded-xl px-3 h-10 focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus transition-all">
        <svg className="w-4 h-4 text-text-faint shrink-0" /* search icon */ />
        <input
          type="text"
          value={query}
          onChange={...}
          onKeyDown={...}
          placeholder="Search albums..."
          className="flex-1 bg-transparent border-none outline-none text-sm px-2 placeholder:text-text-faint"
        />
        <select value={provider} onChange={...} className="text-xs bg-transparent border-none outline-none text-text-muted cursor-pointer">
          <option value="itunes">iTunes</option>
          <option value="musicbrainz">MusicBrainz</option>
          <option value="auto">Auto</option>
        </select>
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-lg max-h-80 overflow-auto z-50">
          {results.map((item, i) => (
            <button key={item.id} onClick={() => selectResult(item)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors ${i === focusIndex ? "bg-surface-alt" : ""}`}>
              <img src={proxyImageUrl(item.coverUrl) || ""} className="w-10 h-10 rounded-md object-cover bg-surface-alt" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.title}</div>
                <div className="text-xs text-text-muted truncate">{item.artist}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Set up React Router in App**

```tsx
import { BrowserRouter, Routes, Route } from "react-router";
import TopBar from "./components/TopBar";

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AlbumProvider>
          <div className="min-h-screen bg-bg">
            <TopBar />
            <Routes>
              <Route path="/" element={<div className="p-8">Design page placeholder</div>} />
              <Route path="/batch" element={<div className="p-8">Batch page placeholder</div>} />
            </Routes>
          </div>
        </AlbumProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Verify search works**

Run: `pnpm run dev`
Test: Type "Radiohead" in search bar. Should see results dropdown with album art. Click a result. Console should show album data.

**Step 5: Commit**

```bash
git add app/components/TopBar.tsx app/components/SearchBar.tsx app/App.tsx
git commit -m "feat: build TopBar with search bar and autocomplete"
```

---

## Task 7: Build PreviewPanel with canvas rendering

**Files:**
- Create: `app/components/PreviewPanel.tsx`
- Create: `app/components/CardCanvas.tsx`
- Create: `app/components/AlbumInfo.tsx`
- Create: `app/components/ExportActions.tsx`

**Step 1: Build CardCanvas component**

A reusable component that wraps a `<canvas>` element and calls the extracted rendering functions when settings or album data change.

```tsx
// app/components/CardCanvas.tsx
import { useRef, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useAlbum } from "../context/AlbumContext";
import { drawCardToCanvas, drawPlaceholder, mmToPx, CARD_WIDTH_MM, CARD_HEIGHT_MM, PREVIEW_DPI } from "../lib/canvas";
import { loadImage, proxyImageUrl, getQrImage } from "../lib/api";

interface CardCanvasProps {
  side: "front" | "back";
  className?: string;
}

export default function CardCanvas({ side, className }: CardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();
  const { album } = useAlbum();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set canvas resolution
    // If no album, drawPlaceholder
    // Otherwise, load cover image and QR, then drawCardToCanvas
    // Use abort token pattern to cancel stale renders
  }, [settings, album, side]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full aspect-[63/88] rounded-xl border border-border bg-white shadow-sm ${className || ""}`}
    />
  );
}
```

**Step 2: Build AlbumInfo component**

Shows selected album title, artist, track count, release year below the preview.

**Step 3: Build ExportActions component**

Row of export buttons (Front PNG, Back PNG, 2-Side PDF) that call the extracted export functions.

**Step 4: Build PreviewPanel container**

```tsx
// app/components/PreviewPanel.tsx
import CardCanvas from "./CardCanvas";
import AlbumInfo from "./AlbumInfo";
import ExportActions from "./ExportActions";

export default function PreviewPanel() {
  return (
    <div className="sticky top-20 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Front</p>
          <CardCanvas side="front" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">Back</p>
          <CardCanvas side="back" />
        </div>
      </div>
      <AlbumInfo />
      <ExportActions />
    </div>
  );
}
```

**Step 5: Verify preview rendering**

Run: `pnpm run dev`
Test: Search for an album, select it. Both front and back previews should render with current settings. Changing a style setting should trigger re-render.

**Step 6: Commit**

```bash
git add app/components/PreviewPanel.tsx app/components/CardCanvas.tsx app/components/AlbumInfo.tsx app/components/ExportActions.tsx
git commit -m "feat: build preview panel with live canvas rendering"
```

---

## Task 8: Build Style Studio with Radix Accordion sections

**Files:**
- Create: `app/components/StyleStudio.tsx`
- Create: `app/components/studio/PresetPicker.tsx`
- Create: `app/components/studio/ProfileManager.tsx`
- Create: `app/components/studio/TypographySection.tsx`
- Create: `app/components/studio/FrontBackgroundSection.tsx`
- Create: `app/components/studio/BackBackgroundSection.tsx`
- Create: `app/components/studio/BackOverflowSection.tsx`
- Create: `app/components/studio/FrameQrSection.tsx`
- Create: `app/components/studio/PrintSection.tsx`
- Create: `app/components/ui/SettingSlider.tsx`
- Create: `app/components/ui/SettingSelect.tsx`
- Create: `app/components/ui/SettingSwitch.tsx`
- Create: `app/components/ui/SettingColor.tsx`
- Create: `app/components/ui/AccordionSection.tsx`

**Step 1: Install Radix primitives**

```bash
pnpm add @radix-ui/react-accordion @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-popover
```

**Step 2: Build reusable UI control components**

These are small wrapper components that connect Radix primitives to the settings context:

- `SettingSlider` — Radix Slider with label + current value display
- `SettingSelect` — Radix Select with label
- `SettingSwitch` — Radix Switch with label
- `SettingColor` — Color input with popover preview
- `AccordionSection` — Radix Accordion.Item wrapper with consistent styling

Each control takes a `settingKey` prop and reads/writes from `useSettings()`.

**Step 3: Build PresetPicker**

Grid of visual preset cards. Each shows the preset name and a color swatch strip representing its palette. Click applies the preset via `applySettings()`.

```tsx
// app/components/studio/PresetPicker.tsx
import { useSettings } from "../../context/SettingsContext";
import { BUILTIN_PRESETS } from "../../lib/types";

export default function PresetPicker() {
  const { applySettings } = useSettings();

  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(BUILTIN_PRESETS).map(([name, preset]) => (
        <button
          key={name}
          onClick={() => applySettings(preset)}
          className="group relative p-3 rounded-xl border border-border bg-surface hover:border-border-focus transition-all text-left"
        >
          <div className="flex gap-1 mb-2">
            <span className="w-4 h-4 rounded-full border border-border" style={{ background: preset.frontBg }} />
            <span className="w-4 h-4 rounded-full border border-border" style={{ background: preset.backBg }} />
            <span className="w-4 h-4 rounded-full border border-border" style={{ background: preset.textColor }} />
          </div>
          <span className="text-xs font-medium">{name}</span>
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Build ProfileManager**

Save/load/delete named profiles. Uses `app/lib/profiles.ts` functions.

**Step 5: Build each studio section**

Each section (Typography, Front Background, Back Background, Back Overflow, Frame+QR, Print Production) is a function component containing a grid of the appropriate `Setting*` controls. Map the controls 1:1 from the current `index.html` — same setting keys, same ranges, same options.

**Typography section controls:**
- fontFamily (select), textColor (color), titleSizePt (slider 9-22), titleWeight (select), artistSizePt (slider 8-18), artistWeight (select), trackSizePt (slider 6-12), trackWeight (select), titleAlign (select), artistAlign (select)

**Front Background section controls:**
- frontFillMode (select), frontBg (color), frontBg2 (color), frontGradientAngle (slider 0-360), coverBorderEnabled (switch), coverBorderColor (color), coverBorderWidthMm (slider 0-2)

**Back Background section controls:**
- backFillMode (select), backBg (color), backBg2 (color), backGradientAngle (slider 0-360), lineColor (color), trackSpacing (slider 0.8-1.8)

**Back Overflow section controls:**
- backOverflowMode (select), backMinTrackSizePt (slider 5-10), backMaxColumns (slider 1-3), backColumnGapMm (slider 0.5-5)

**Frame + QR section controls:**
- borderEnabled (switch), borderColor (color), borderWidthMm (slider 0-2), cornerRadiusMm (slider 0-8), qrDark (color), qrLight (color), qrScale (slider 0.65-1), backReserveBg (color)

**Print Production section controls:**
- printPageSize (select), printGapMm (slider 0-6), printMarginMm (slider 0-20), printBleedMm (slider 0-4), printCropMarks (switch), printCropLengthMm (slider 1-8), printCropOffsetMm (slider 0.5-4)

**Step 6: Build StyleStudio container**

```tsx
// app/components/StyleStudio.tsx
import * as Accordion from "@radix-ui/react-accordion";
import PresetPicker from "./studio/PresetPicker";
import ProfileManager from "./studio/ProfileManager";
import TypographySection from "./studio/TypographySection";
// ... other sections

export default function StyleStudio() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Style Studio</h2>
        <p className="text-sm text-text-muted">Design once, reuse in single and batch mode.</p>
      </div>
      <PresetPicker />
      <ProfileManager />
      <Accordion.Root type="multiple" defaultValue={["typography", "front-bg"]} className="space-y-2">
        <TypographySection />
        <FrontBackgroundSection />
        <BackBackgroundSection />
        <BackOverflowSection />
        <FrameQrSection />
        <PrintSection />
      </Accordion.Root>
    </div>
  );
}
```

**Step 7: Verify all controls work**

Run: `pnpm run dev`
Test: Open accordion sections, adjust sliders/colors/selects. Verify preview canvas updates in real time for every control.

**Step 8: Commit**

```bash
git add app/components/StyleStudio.tsx app/components/studio/ app/components/ui/
git commit -m "feat: build Style Studio with Radix accordion and all controls"
```

---

## Task 9: Build the Design page layout

**Files:**
- Create: `app/pages/DesignPage.tsx`
- Modify: `app/App.tsx`

**Step 1: Compose the Design page**

```tsx
// app/pages/DesignPage.tsx
import PreviewPanel from "../components/PreviewPanel";
import StyleStudio from "../components/StyleStudio";

export default function DesignPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,2fr)_minmax(400px,3fr)] gap-8 items-start">
        <PreviewPanel />
        <StyleStudio />
      </div>
    </div>
  );
}
```

**Step 2: Wire into routes**

Update `App.tsx` to use `DesignPage` instead of placeholder.

**Step 3: Verify layout**

Run: `pnpm run dev`
Expected: Side-by-side layout. Preview sticky on left, studio scrollable on right. Responsive stacking on narrow viewports.

**Step 4: Commit**

```bash
git add app/pages/DesignPage.tsx app/App.tsx
git commit -m "feat: compose Design page with side-by-side layout"
```

---

## Task 10: Build the Batch page

**Files:**
- Create: `app/pages/BatchPage.tsx`
- Create: `app/components/CsvDropZone.tsx`
- Create: `app/components/BatchSettings.tsx`
- Create: `app/components/BatchProgress.tsx`

**Step 1: Build CsvDropZone**

A drag-and-drop file upload zone with visual feedback (dashed border, hover highlight, file icon). Uses PapaParse to parse the CSV. Shows row count after upload.

**Step 2: Build BatchSettings**

Provider select, "Fetch track list" toggle, "Mirror back" toggle, page size select. Uses `useSettings()` for print-related settings.

**Step 3: Build BatchProgress**

Progress bar and status text during batch PDF generation. Uses the `generateBatchPdf` function from `app/lib/csv.ts` with a progress callback.

**Step 4: Compose BatchPage**

```tsx
// app/pages/BatchPage.tsx
import CsvDropZone from "../components/CsvDropZone";
import BatchSettings from "../components/BatchSettings";
import BatchProgress from "../components/BatchProgress";

export default function BatchPage() {
  // State: csvRows, isGenerating, progress
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-semibold">Batch Generator</h1>
        <p className="text-text-muted">Upload a CSV and generate duplex-ready 3x3 print sheets.</p>
      </div>
      <div className="space-y-6">
        <CsvDropZone onParsed={setCsvRows} />
        <BatchSettings />
        <button onClick={handleGenerate} disabled={!csvRows.length || isGenerating}
          className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
          Generate Duplex 3x3 PDF
        </button>
        <BatchProgress />
      </div>
    </div>
  );
}
```

**Step 5: Verify batch workflow**

Run: `pnpm run dev`
Test: Navigate to /batch. Upload the included `album_collection_with_covers.csv`. Click generate. PDF should download.

**Step 6: Commit**

```bash
git add app/pages/BatchPage.tsx app/components/CsvDropZone.tsx app/components/BatchSettings.tsx app/components/BatchProgress.tsx
git commit -m "feat: build Batch page with drag-and-drop CSV and progress"
```

---

## Task 11: Add Framer Motion animations

**Files:**
- Modify: `app/App.tsx` (page transitions)
- Modify: `app/components/SearchBar.tsx` (dropdown animation)
- Modify: `app/components/CardCanvas.tsx` (card flip)
- Modify: `app/components/studio/PresetPicker.tsx` (hover effects)
- Modify: `app/components/ExportActions.tsx` (button press)

**Step 1: Add page transition wrapper**

Use `AnimatePresence` + `motion.div` with `Routes` to animate page changes (fade + slight Y translate, 200ms).

**Step 2: Animate search dropdown**

Wrap the search results dropdown in `motion.div` with `initial={{ opacity: 0, y: -8 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -8 }}`.

Stagger results: each search result item gets a slight delay based on index.

**Step 3: Add card flip interaction**

When user clicks a card preview, use a `motion.div` wrapper with `rotateY` transform to flip between front and back views. Optional — can also be just a smooth crossfade.

**Step 4: Button press feedback**

Add `whileTap={{ scale: 0.97 }}` to primary action buttons.

**Step 5: Preset card hover**

Add `whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}` to preset cards.

**Step 6: Verify animations**

Run: `pnpm run dev`
Test: Navigate between pages, search, click presets, export. All transitions should be smooth with no layout shifts or flickers.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Framer Motion animations throughout"
```

---

## Task 12: Add toast notifications

**Files:**
- Modify: `app/App.tsx`
- Modify: `app/components/ExportActions.tsx`
- Modify: `app/components/studio/ProfileManager.tsx`
- Modify: `app/pages/BatchPage.tsx`

**Step 1: Set up Sonner**

Add `<Toaster />` to App.tsx root. Configure position (top-right), theme, styling to match design tokens.

**Step 2: Replace inline status messages**

Every place that currently uses `setStatus()`, `setCsvStatus()`, or `setStudioStatus()` should instead call `toast.success()`, `toast.error()`, or `toast.loading()`. Specifically:

- Export success: `toast.success("Front PNG downloaded")`
- Export error: `toast.error("Export failed: ...")`
- Profile saved: `toast.success("Profile saved")`
- Profile deleted: `toast.success("Profile deleted")`
- Batch progress: `toast.loading("Generating PDF... 4/12")`
- Batch complete: `toast.success("PDF ready — 12 cards generated")`

**Step 3: Verify toasts**

Run: `pnpm run dev`
Test: Export a PNG, save a profile, generate a batch. Toasts should appear and auto-dismiss.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add toast notifications replacing inline status text"
```

---

## Task 13: Responsive polish and mobile layout

**Files:**
- Modify: `app/pages/DesignPage.tsx`
- Modify: `app/components/TopBar.tsx`
- Modify: `app/components/SearchBar.tsx`
- Modify: various component files

**Step 1: Mobile TopBar**

On small screens (< 768px): collapse search into an expandable search overlay (click search icon → full-width search input slides down). Nav links become icon-only or a hamburger menu.

**Step 2: Mobile DesignPage**

On small screens: single column. Preview section at top (not sticky), Style Studio below. Card previews side-by-side even on mobile (they're small enough).

**Step 3: Mobile BatchPage**

Already single column. Ensure drop zone is touch-friendly, buttons are full-width.

**Step 4: Tablet breakpoints**

At medium widths (768-1024px): Design page may still be single column with preview above studio, or a narrower two-column layout.

**Step 5: Test all breakpoints**

Run: `pnpm run dev`
Test: Resize browser through 320px, 768px, 1024px, 1440px. Verify no overflow, no broken layouts, all controls accessible.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: responsive polish for mobile and tablet"
```

---

## Task 14: Clean up old files and finalize

**Files:**
- Delete: `public/app.js`
- Delete: `public/styles.css`
- Delete: `public/index.html`
- Modify: `AGENTS.md`
- Modify: `package.json`

**Step 1: Remove old vanilla files**

The old `public/` directory is no longer served by Wrangler (assets now come from Vite build output). Remove the three old files. Keep `public/` if any static assets (favicons, etc.) are needed, otherwise remove the directory.

**Step 2: Update AGENTS.md**

Update key paths to reflect the new structure:
- `app/main.tsx` — entry point
- `app/App.tsx` — root component + routing
- `app/lib/canvas.ts` — canvas rendering
- `app/lib/types.ts` — shared types
- `app/components/` — React components
- `app/pages/` — page-level components
- `app/context/` — React context providers

Update commands:
- Dev: `pnpm run dev`
- Build: `pnpm run build`

Update engineering rules:
- Framework: React 19 + Vite + Tailwind CSS v4
- UI primitives: Radix UI
- Animations: Framer Motion
- State: React Context

**Step 3: Run full verification**

```bash
pnpm run typecheck
pnpm run build
```

Verify build output is clean and deployable.

**Step 4: Smoke test**

Run: `pnpm run dev`
Test the full flow:
1. `/api/health` returns OK
2. Search for an album, select it
3. Preview renders correctly (front and back)
4. Adjust style settings — preview updates live
5. Save a profile, load it, delete it
6. Apply a preset
7. Export Front PNG, Back PNG, 2-Side PDF
8. Navigate to /batch
9. Upload CSV, configure settings, generate PDF
10. Test on mobile viewport

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old vanilla UI files, update AGENTS.md"
```

---

## Task Summary

| # | Task | Key Output |
|---|------|-----------|
| 1 | Scaffold Vite + React + CF Workers | Build pipeline working |
| 2 | Tailwind design tokens | Visual design system |
| 3 | Extract canvas rendering | `app/lib/canvas.ts` — pure rendering functions |
| 4 | Extract API, export, profiles, CSV | `app/lib/*.ts` — all business logic |
| 5 | React context | Settings + Album state management |
| 6 | TopBar + SearchBar | Navigation + search with autocomplete |
| 7 | PreviewPanel + CardCanvas | Live canvas preview |
| 8 | Style Studio + all controls | Full Radix accordion with every setting |
| 9 | Design page layout | Side-by-side composition |
| 10 | Batch page | CSV upload + progress + generation |
| 11 | Framer Motion animations | Page transitions, hover effects, card flip |
| 12 | Toast notifications | Sonner replacing inline status |
| 13 | Responsive polish | Mobile + tablet layouts |
| 14 | Cleanup + finalize | Remove old files, update docs, verify |
