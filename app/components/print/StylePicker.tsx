import { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { BUILTIN_PRESETS } from "../../lib/types";
import {
  listProfiles,
  loadProfile,
  DEFAULT_PROFILE_NAME,
} from "../../lib/profiles";

// ---------------------------------------------------------------------------
// StylePicker — compact preset/profile selector for the Print page sidebar
// ---------------------------------------------------------------------------

export default function StylePicker() {
  const { settings, applySettings } = useSettings();
  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");

  // Refresh saved profiles on mount
  useEffect(() => {
    setProfiles(
      listProfiles().filter((name) => name !== DEFAULT_PROFILE_NAME),
    );
  }, []);

  function handleApplyProfile() {
    if (!selectedProfile) return;
    const partial = loadProfile(selectedProfile);
    if (partial) applySettings(partial);
  }

  // Check which preset is roughly active
  const activePreset = Object.entries(BUILTIN_PRESETS).find(
    ([, p]) =>
      p.frontBg === settings.frontBg &&
      p.fontFamily === settings.fontFamily,
  )?.[0];

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
        Style
      </span>

      {/* Built-in presets */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {Object.entries(BUILTIN_PRESETS).map(([name, preset]) => (
          <button
            key={name}
            type="button"
            onClick={() => applySettings(preset)}
            className={[
              "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
              activePreset === name
                ? "border-accent bg-accent/5 text-accent"
                : "border-border bg-surface hover:border-border-focus text-text-muted hover:text-text",
            ].join(" ")}
            title={name}
          >
            {/* Color swatch */}
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${preset.frontBg || "#f5f3ee"} 50%, ${preset.textColor || "#1f1d17"} 50%)`,
              }}
            />
            <span className="whitespace-nowrap">{name}</span>
          </button>
        ))}
      </div>

      {/* Saved profiles */}
      {profiles.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="flex-1 min-w-0 bg-surface-alt border border-border rounded-lg px-2 py-1.5 text-xs text-text outline-none focus:border-border-focus"
          >
            <option value="">Saved profiles...</option>
            {profiles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedProfile}
            onClick={handleApplyProfile}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text hover:border-border-focus disabled:opacity-40 transition-all"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
