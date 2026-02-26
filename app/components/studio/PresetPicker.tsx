import { motion } from "framer-motion";
import { useSettings } from "../../context/SettingsContext";
import { BUILTIN_PRESETS } from "../../lib/types";

export default function PresetPicker() {
  const { applySettings } = useSettings();

  const presetEntries = Object.entries(BUILTIN_PRESETS);

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text">Presets</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presetEntries.map(([name, preset]) => (
          <motion.button
            key={name}
            type="button"
            className="flex items-center gap-2.5 rounded-xl border border-border p-3 text-left transition-colors hover:border-border-focus"
            onClick={() => applySettings(preset)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex gap-1">
              {[preset.frontBg, preset.backBg, preset.textColor]
                .filter(Boolean)
                .map((color, i) => (
                  <span
                    key={i}
                    className="block h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
            </div>
            <span className="text-xs font-medium text-text">{name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
