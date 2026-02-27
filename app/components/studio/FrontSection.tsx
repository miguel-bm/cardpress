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

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2 },
};

export default function FrontSection() {
  const { settings } = useSettings();
  const isGradient = settings.frontFillMode === "gradient";
  const hasCoverBorder = settings.coverBorderEnabled;
  const hasInsetBorder = settings.coverInsetBorderEnabled;

  return (
    <AccordionSection value="front" title="Front Side">
      <div className="space-y-4">
        {/* Background */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Background
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingToggle
              settingKey="frontFillMode"
              label="Mode"
              options={fillModeOptions}
            />
            <SettingColor settingKey="frontBg" label="Primary" />
          </div>
          <AnimatePresence initial={false}>
            {isGradient && (
              <motion.div {...collapse} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                  <SettingColor settingKey="frontBg2" label="Secondary" />
                  <SettingSlider
                    settingKey="frontGradientAngle"
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
        </div>

        <div className="border-t border-border" />

        {/* Cover Art */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Cover Art
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="coverBorderRadiusMm"
              label="Corner Radius"
              min={0}
              max={8}
              step={0.5}
              unit="mm"
            />
          </div>

          {/* Overlay Border */}
          <div className="mt-3">
            <SettingSwitch
              settingKey="coverBorderEnabled"
              label="Overlay Border"
            />
            <AnimatePresence initial={false}>
              {hasCoverBorder && (
                <motion.div {...collapse} className="overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                    <SettingColor
                      settingKey="coverBorderColor"
                      label="Color"
                    />
                    <SettingSlider
                      settingKey="coverBorderWidthMm"
                      label="Width"
                      min={0}
                      max={2}
                      step={0.1}
                      unit="mm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inset Border */}
          <div className="mt-3">
            <SettingSwitch
              settingKey="coverInsetBorderEnabled"
              label="Inset Border"
            />
            <AnimatePresence initial={false}>
              {hasInsetBorder && (
                <motion.div {...collapse} className="overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                    <SettingColor
                      settingKey="coverInsetBorderColor"
                      label="Color"
                    />
                    <SettingSlider
                      settingKey="coverInsetBorderWidthMm"
                      label="Width"
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

        <div className="border-t border-border" />

        {/* Spacing */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Spacing
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="cardPaddingMm"
              label="Content Padding"
              min={1}
              max={6}
              step={0.5}
              unit="mm"
            />
            <SettingSlider
              settingKey="coverGapMm"
              label="Cover-to-Title Gap"
              min={1}
              max={6}
              step={0.2}
              unit="mm"
            />
            <SettingSlider
              settingKey="titleArtistGapMm"
              label="Title-to-Artist Gap"
              min={0.2}
              max={4}
              step={0.2}
              unit="mm"
            />
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}
