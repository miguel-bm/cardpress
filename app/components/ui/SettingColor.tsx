import { useSettings } from "../../context/SettingsContext";
import type { CardSettings } from "../../lib/types";

interface Props {
  settingKey: keyof CardSettings;
  label: string;
}

export default function SettingColor({ settingKey, label }: Props) {
  const { settings, updateSetting } = useSettings();
  const value = String(settings[settingKey]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-text">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-full cursor-pointer rounded-lg border border-border"
          value={value}
          onChange={(e) => {
            updateSetting(settingKey as keyof CardSettings, e.target.value as never);
          }}
        />
        <span className="shrink-0 text-xs tabular-nums text-text-muted">
          {value}
        </span>
      </div>
    </div>
  );
}
