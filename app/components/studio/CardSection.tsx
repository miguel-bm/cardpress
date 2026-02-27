import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../context/SettingsContext";
import AccordionSection from "../ui/AccordionSection";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";
import SettingSwitch from "../ui/SettingSwitch";
import SettingToggle from "../ui/SettingToggle";

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2 },
};

const CARD_SIZE_PRESETS = [
  { label: "Poker", w: 63, h: 88 },
  { label: "Tarot", w: 70, h: 120 },
  { label: "Mini", w: 44, h: 63 },
  { label: "Square", w: 63, h: 63 },
] as const;

const qrContentOptions = [
  { value: "title", label: "Title" },
  { value: "spotify", label: "Spotify" },
  { value: "apple-music", label: "Apple" },
  { value: "custom", label: "Custom" },
];

export default function CardSection() {
  const { settings, updateSetting } = useSettings();
  const hasBorder = settings.borderEnabled;
  const qrEnabled = settings.qrEnabled;

  return (
    <AccordionSection value="card" title="Card & QR">
      <div className="space-y-4">
        {/* Dimensions */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Dimensions
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CARD_SIZE_PRESETS.map((p) => {
              const active =
                settings.cardWidthMm === p.w && settings.cardHeightMm === p.h;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    updateSetting("cardWidthMm", p.w);
                    updateSetting("cardHeightMm", p.h);
                  }}
                  className={[
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    active
                      ? "bg-accent text-white"
                      : "bg-surface-alt text-text-muted hover:text-text hover:bg-surface-alt/80",
                  ].join(" ")}
                >
                  {p.label}
                  <span className="ml-1 opacity-60">
                    {p.w}×{p.h}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="cardWidthMm"
              label="Width"
              min={40}
              max={100}
              step={1}
              unit="mm"
            />
            <SettingSlider
              settingKey="cardHeightMm"
              label="Height"
              min={50}
              max={130}
              step={1}
              unit="mm"
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Shape */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Shape
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="cornerRadiusMm"
              label="Corner Radius"
              min={0}
              max={8}
              step={0.5}
              unit="mm"
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Border */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Border
          </p>
          <SettingSwitch settingKey="borderEnabled" label="Border" />
          <AnimatePresence initial={false}>
            {hasBorder && (
              <motion.div {...collapse} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                  <SettingColor settingKey="borderColor" label="Color" />
                  <SettingSlider
                    settingKey="borderWidthMm"
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

        <div className="border-t border-border" />

        {/* QR Code */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            QR Code
          </p>
          <SettingSwitch settingKey="qrEnabled" label="QR Code" />
          <AnimatePresence initial={false}>
            {qrEnabled && (
              <motion.div {...collapse} className="overflow-hidden">
                <div className="space-y-3 mt-3">
                  <SettingToggle
                    settingKey="qrContentMode"
                    label="Content"
                    options={qrContentOptions}
                  />
                  <AnimatePresence initial={false}>
                    {settings.qrContentMode === "custom" && (
                      <motion.div {...collapse} className="overflow-hidden">
                        <div className="mt-1">
                          <label className="mb-1.5 block text-xs font-medium text-text">
                            Custom Text
                          </label>
                          <input
                            type="text"
                            value={settings.qrCustomText}
                            onChange={(e) =>
                              updateSetting("qrCustomText", e.target.value)
                            }
                            placeholder="Enter text or URL..."
                            className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <SettingColor settingKey="qrDark" label="Dark" />
                    <SettingColor settingKey="qrLight" label="Light" />
                    <SettingSlider
                      settingKey="qrScale"
                      label="Scale"
                      min={0.65}
                      max={1}
                      step={0.05}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AccordionSection>
  );
}
