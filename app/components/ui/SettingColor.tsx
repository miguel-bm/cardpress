import { useState, useRef, useCallback } from "react";
import { useSettings } from "../../context/SettingsContext";
import type { CardSettings } from "../../lib/types";

interface Props {
  settingKey: keyof CardSettings;
  label: string;
}

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(raw: string): string | null {
  const m = raw.trim().match(HEX_RE);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return `#${hex.toLowerCase()}`;
}

export default function SettingColor({ settingKey, label }: Props) {
  const { settings, updateSetting } = useSettings();
  const value = String(settings[settingKey]);
  const pickerRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const apply = useCallback(
    (hex: string) => {
      updateSetting(settingKey as keyof CardSettings, hex as never);
    },
    [settingKey, updateSetting],
  );

  const commitText = useCallback(
    (text: string) => {
      const hex = normalizeHex(text);
      if (hex) apply(hex);
      setEditing(false);
    },
    [apply],
  );

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-text">{label}</label>
      <div className="flex items-center gap-2 h-7">
        {/* Color swatch — clicking opens native picker */}
        <button
          type="button"
          className="h-6 w-6 shrink-0 rounded-md border border-border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => pickerRef.current?.click()}
          aria-label={`Pick ${label} color`}
        />
        {/* Hidden native color picker */}
        <input
          ref={pickerRef}
          type="color"
          className="sr-only"
          value={value}
          onChange={(e) => apply(e.target.value)}
        />
        {/* Editable hex value */}
        {editing ? (
          <input
            type="text"
            autoFocus
            className="h-6 w-20 rounded border border-border bg-surface px-1.5 text-xs tabular-nums text-text outline-none focus:border-border-focus font-mono box-border"
            defaultValue={value}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commitText(draft || value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText((e.target as HTMLInputElement).value);
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="h-6 rounded px-1.5 text-xs tabular-nums text-text-muted hover:bg-surface-alt hover:text-text transition-colors cursor-text font-mono"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
          >
            {value}
          </button>
        )}
      </div>
    </div>
  );
}
