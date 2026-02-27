import { useSettings } from "../../context/SettingsContext";
import type { CardSettings } from "../../lib/types";
import type { ReactNode } from "react";

interface ToggleOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  settingKey: keyof CardSettings;
  label?: string;
  options: ToggleOption[];
  fullWidth?: boolean;
}

export default function SettingToggle({
  settingKey,
  label,
  options,
  fullWidth,
}: Props) {
  const { settings, updateSetting } = useSettings();
  const value = String(settings[settingKey]);

  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-text">
          {label}
        </label>
      )}
      <div className="inline-flex rounded-lg border border-border bg-surface-alt p-0.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              className={[
                "flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text",
              ].join(" ")}
              onClick={() =>
                updateSetting(
                  settingKey as keyof CardSettings,
                  opt.value as never,
                )
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
