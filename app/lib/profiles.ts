// ---------------------------------------------------------------------------
// Profile / preset management — localStorage persistence for card styles
// Ported from public/app.js lines 1338-1518
// ---------------------------------------------------------------------------

import type { CardSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const STYLE_STORAGE_KEY = "album-card-style-profiles-v1";
export const DEFAULT_PROFILE_NAME = "current-style";
export const PROVIDER_STORAGE_KEY = "album-card-provider-v1";

// ---------------------------------------------------------------------------
// Profile record
// ---------------------------------------------------------------------------

export interface StyleProfile {
  name: string;
  settings: Partial<CardSettings>;
}

// ---------------------------------------------------------------------------
// Low-level storage helpers (app.js lines 1338-1353)
// ---------------------------------------------------------------------------

/** Load all saved profiles from localStorage. Returns [] on any error. */
export function loadProfilesFromStorage(): StyleProfile[] {
  try {
    const raw = localStorage.getItem(STYLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StyleProfile =>
        item != null &&
        typeof item.name === "string" &&
        item.settings != null &&
        typeof item.settings === "object",
    );
  } catch {
    return [];
  }
}

/** Persist the full profile list to localStorage. */
export function saveProfilesToStorage(profiles: StyleProfile[]): void {
  localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(profiles));
}

// ---------------------------------------------------------------------------
// Profile CRUD helpers
// ---------------------------------------------------------------------------

/** Save (create or update) a named profile. */
export function saveProfile(name: string, settings: CardSettings): void {
  const profiles = loadProfilesFromStorage();
  const record: StyleProfile = { name, settings: { ...settings } };
  const existingIndex = profiles.findIndex((item) => item.name === name);
  if (existingIndex >= 0) {
    profiles[existingIndex] = record;
  } else {
    profiles.push(record);
  }
  saveProfilesToStorage(profiles);
}

/** Load a named profile's settings (returns null if not found). */
export function loadProfile(name: string): Partial<CardSettings> | null {
  const profiles = loadProfilesFromStorage();
  const profile = profiles.find((item) => item.name === name);
  return profile ? profile.settings : null;
}

/** Delete a named profile. Returns true if it existed. */
export function deleteProfile(name: string): boolean {
  const profiles = loadProfilesFromStorage();
  const filtered = profiles.filter((item) => item.name !== name);
  const deleted = filtered.length < profiles.length;
  saveProfilesToStorage(filtered);
  return deleted;
}

/** List all saved profile names. */
export function listProfiles(): string[] {
  return loadProfilesFromStorage().map((p) => p.name);
}

// ---------------------------------------------------------------------------
// Default-profile persistence (app.js lines 1509-1518)
// ---------------------------------------------------------------------------

/**
 * Persist the given settings as the default profile (auto-saved on every
 * control change so the user picks up where they left off).
 */
export function persistCurrentAsDefault(settings: CardSettings): void {
  const profiles = loadProfilesFromStorage();
  const record: StyleProfile = {
    name: DEFAULT_PROFILE_NAME,
    settings: { ...settings },
  };
  const index = profiles.findIndex(
    (item) => item.name === DEFAULT_PROFILE_NAME,
  );
  if (index >= 0) {
    profiles[index] = record;
  } else {
    profiles.push(record);
  }
  saveProfilesToStorage(profiles);
}

/**
 * Ensure the default profile exists; if it does not, create one with the
 * given settings.
 */
export function ensureDefaultProfile(settings: CardSettings): void {
  const profiles = loadProfilesFromStorage();
  const hasDefault = profiles.some(
    (item) => item.name === DEFAULT_PROFILE_NAME,
  );
  if (hasDefault) return;
  profiles.push({ name: DEFAULT_PROFILE_NAME, settings: { ...settings } });
  saveProfilesToStorage(profiles);
}

// ---------------------------------------------------------------------------
// Initial settings loader (app.js lines 1498-1507)
// ---------------------------------------------------------------------------

/**
 * Load settings from localStorage (default profile), merging with the
 * built-in defaults. Returns a complete CardSettings object.
 */
export function loadInitialSettings(): CardSettings {
  const profiles = loadProfilesFromStorage();
  const defaultProfile = profiles.find(
    (item) => item.name === DEFAULT_PROFILE_NAME,
  );
  if (defaultProfile) {
    return { ...DEFAULT_SETTINGS, ...defaultProfile.settings };
  }
  return { ...DEFAULT_SETTINGS };
}
