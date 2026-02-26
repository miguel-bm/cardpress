import * as Switch from "@radix-ui/react-switch";
import { useSettings } from "../../context/SettingsContext";
import type { CardSettings } from "../../lib/types";

interface Props {
  settingKey: keyof CardSettings;
  label: string;
}

export default function SettingSwitch({ settingKey, label }: Props) {
  const { settings, updateSetting } = useSettings();
  const checked = Boolean(settings[settingKey]);

  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-text">{label}</label>
      <Switch.Root
        className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-surface-alt data-[state=checked]:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        checked={checked}
        onCheckedChange={(val) => {
          updateSetting(settingKey as keyof CardSettings, val as never);
        }}
      >
        <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-surface transition-transform duration-200 will-change-transform data-[state=checked]:translate-x-[18px]" />
      </Switch.Root>
    </div>
  );
}
