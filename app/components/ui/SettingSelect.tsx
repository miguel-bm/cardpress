import { useSettings } from "../../context/SettingsContext";
import type { CardSettings } from "../../lib/types";

interface Props {
  settingKey: keyof CardSettings;
  label: string;
  options: { value: string; label: string }[];
}

export default function SettingSelect({ settingKey, label, options }: Props) {
  const { settings, updateSetting } = useSettings();
  const value = String(settings[settingKey]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-text">{label}</label>
      <select
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:border-border-focus focus:outline-none"
        value={value}
        onChange={(e) => {
          updateSetting(settingKey as keyof CardSettings, e.target.value as never);
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
