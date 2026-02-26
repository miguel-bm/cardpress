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

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text">{label}</label>
        <span className="text-xs tabular-nums text-text-muted">
          {value}
          {unit ? unit : ""}
        </span>
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
