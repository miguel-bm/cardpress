import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../context/SettingsContext";
import AccordionSection from "../ui/AccordionSection";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";
import SettingSwitch from "../ui/SettingSwitch";
import SettingToggle from "../ui/SettingToggle";

const fillModeOptions = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
];

const overflowModeOptions = [
  { value: "auto", label: "Auto" },
  { value: "downscale", label: "Downscale" },
  { value: "multicolumn", label: "Multi-col" },
];

const trackNumberOptions = [
  { value: "dot", label: "1." },
  { value: "padded", label: "01." },
  { value: "none", label: "None" },
];

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2 },
};

export default function BackSection() {
  const { settings } = useSettings();
  const isGradient = settings.backFillMode === "gradient";

  return (
    <AccordionSection value="back" title="Back Side">
      <div className="space-y-4">
        {/* Background */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Background
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingToggle
              settingKey="backFillMode"
              label="Mode"
              options={fillModeOptions}
            />
            <SettingColor settingKey="backBg" label="Primary" />
          </div>
          <AnimatePresence initial={false}>
            {isGradient && (
              <motion.div {...collapse} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                  <SettingColor settingKey="backBg2" label="Secondary" />
                  <SettingSlider
                    settingKey="backGradientAngle"
                    label="Angle"
                    min={0}
                    max={360}
                    step={5}
                    unit="°"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
            <SettingColor settingKey="lineColor" label="Line Color" />
            <SettingSlider
              settingKey="trackSpacing"
              label="Track Spacing"
              min={0.8}
              max={1.8}
              step={0.05}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Track List */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Track List
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSwitch settingKey="backHeaderEnabled" label="Back Header" />
            <SettingSwitch settingKey="trackDurationsEnabled" label="Track Durations" />
            <SettingToggle
              settingKey="trackNumberFormat"
              label="Track Numbers"
              options={trackNumberOptions}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Columns */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Columns
          </p>
          <SettingToggle
            settingKey="backOverflowMode"
            options={overflowModeOptions}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
            <SettingSlider
              settingKey="backMinTrackSizePt"
              label="Min Track Size"
              min={5}
              max={10}
              step={0.5}
              unit="pt"
            />
            <SettingSlider
              settingKey="backMaxColumns"
              label="Max Columns"
              min={1}
              max={3}
              step={1}
            />
            <SettingSlider
              settingKey="backColumnGapMm"
              label="Column Gap"
              min={0.5}
              max={5}
              step={0.1}
              unit="mm"
            />
            <SettingSwitch settingKey="backColumnDividerEnabled" label="Column Divider" />
            <SettingSwitch settingKey="backEvenColumns" label="Even Distribution" />
            <SettingSwitch settingKey="backTrackWrapEnabled" label="Wrap Track Names" />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Bottom Strip */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Bottom Strip
          </p>
          <SettingColor settingKey="backReserveBg" label="Strip BG" />
        </div>

        <div className="border-t border-border" />

        {/* Spacing */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Spacing
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="backTopPaddingMm"
              label="Top Padding"
              min={1}
              max={6}
              step={0.5}
              unit="mm"
            />
            <SettingSlider
              settingKey="backHeaderGapMm"
              label="Header Gap"
              min={0.5}
              max={4}
              step={0.25}
              unit="mm"
            />
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}
