import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../context/SettingsContext";
import SettingSlider from "../ui/SettingSlider";
import SettingSwitch from "../ui/SettingSwitch";
import SettingToggle from "../ui/SettingToggle";

const pageSizeOptions = [
  { value: "A4", label: "A4" },
  { value: "Letter", label: "Letter" },
];

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2 },
};

export default function PrintProductionSettings() {
  const { settings } = useSettings();
  const hasCropMarks = settings.printCropMarks;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Print Production</h3>

      {/* Layout */}
      <div>
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
          Layout
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <SettingToggle
            settingKey="printPageSize"
            label="Page Size"
            options={pageSizeOptions}
          />
          <SettingSlider
            settingKey="printGapMm"
            label="Gap"
            min={0}
            max={6}
            step={0.5}
            unit="mm"
          />
          <SettingSlider
            settingKey="printMarginMm"
            label="Margin"
            min={0}
            max={20}
            step={0.5}
            unit="mm"
          />
          <SettingSlider
            settingKey="printBleedMm"
            label="Bleed"
            min={0}
            max={4}
            step={0.25}
            unit="mm"
          />
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Crop Marks */}
      <div>
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
          Crop Marks
        </p>
        <SettingSwitch settingKey="printCropMarks" label="Crop Marks" />
        <AnimatePresence initial={false}>
          {hasCropMarks && (
            <motion.div {...collapse} className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                <SettingSlider
                  settingKey="printCropLengthMm"
                  label="Length"
                  min={1}
                  max={8}
                  step={0.5}
                  unit="mm"
                />
                <SettingSlider
                  settingKey="printCropOffsetMm"
                  label="Offset"
                  min={0.5}
                  max={4}
                  step={0.25}
                  unit="mm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
