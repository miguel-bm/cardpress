import { useState, useCallback, useRef, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useSettings } from "../../context/SettingsContext";
import type { CardSettings } from "../../lib/types";

interface Props {
  settingKey: keyof CardSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export default function SettingSlider({
  settingKey,
  label,
  min,
  max,
  step,
  unit,
}: Props) {
  const { settings, updateSetting } = useSettings();
  const raw = settings[settingKey];
  const value = typeof raw === "number" ? raw : 0;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(
    (text: string) => {
      const parsed = parseFloat(text);
      if (!Number.isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parsed));
        const rounded = Math.round(clamped / step) * step;
        const dec = step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
        const final = parseFloat(rounded.toFixed(dec));
        updateSetting(settingKey as keyof CardSettings, final as never);
      }
      setEditing(false);
    },
    [max, min, step, settingKey, updateSetting],
  );

  const decimals = step < 1 ? String(step).split(".")[1]?.length ?? 1 : 0;
  const displayValue = value.toFixed(decimals).replace(/\.0+$/, "");

  // Fixed height for both states to prevent layout shift
  const cellClass = "h-5 leading-5 text-xs tabular-nums";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-text">{label}</label>
        <div className="flex items-center gap-0.5">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              className={`${cellClass} w-12 rounded border border-border bg-surface px-1 text-right text-text outline-none focus:border-border-focus box-border`}
              defaultValue={displayValue}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commit(draft || displayValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
                if (e.key === "Escape") setEditing(false);
              }}
            />
          ) : (
            <button
              type="button"
              className={`${cellClass} rounded px-1 text-text-muted hover:bg-surface-alt hover:text-text transition-colors cursor-text`}
              onClick={() => {
                setDraft(displayValue);
                setEditing(true);
              }}
            >
              {displayValue}
            </button>
          )}
          {unit && <span className="text-xs text-text-faint">{unit}</span>}
        </div>
      </div>
      <Slider.Root
        className="relative flex h-4 w-full touch-none items-center select-none"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => {
          updateSetting(settingKey as keyof CardSettings, v as never);
        }}
      >
        <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-surface-alt">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-surface shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      </Slider.Root>
    </div>
  );
}
