import type { ReactNode } from "react";
import AccordionSection from "../ui/AccordionSection";
import FontSelect from "../ui/FontSelect";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";
import SettingSwitch from "../ui/SettingSwitch";
import SettingToggle from "../ui/SettingToggle";

// ---------------------------------------------------------------------------
// Inline SVG icons (14x14)
// ---------------------------------------------------------------------------

const sz = 14;
const iconClass = "shrink-0";

function AlignLeftIcon() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={iconClass}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={iconClass}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={iconClass}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function WeightIcon({ weight }: { weight: string }) {
  return (
    <span style={{ fontWeight: Number(weight) }} className="text-[11px] leading-none font-[inherit]">
      A
    </span>
  );
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const fontOptions = [
  // Sans-serif
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Space Grotesk', sans-serif", label: "Space Grotesk" },
  { value: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans" },
  { value: "'Manrope', sans-serif", label: "Manrope" },
  { value: "'Fira Sans', sans-serif", label: "Fira Sans" },
  { value: "'DM Sans', sans-serif", label: "DM Sans" },
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
  { value: "'Outfit', sans-serif", label: "Outfit" },
  { value: "'Sora', sans-serif", label: "Sora" },
  { value: "'Nunito Sans', sans-serif", label: "Nunito Sans" },
  { value: "'Work Sans', sans-serif", label: "Work Sans" },
  { value: "'Raleway', sans-serif", label: "Raleway" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Rubik', sans-serif", label: "Rubik" },
  { value: "'Josefin Sans', sans-serif", label: "Josefin Sans" },
  // Serif
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Fraunces', serif", label: "Fraunces" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Lora', serif", label: "Lora" },
  { value: "'Libre Baskerville', serif", label: "Libre Baskerville" },
  { value: "'Crimson Pro', serif", label: "Crimson Pro" },
  { value: "'Source Serif 4', serif", label: "Source Serif 4" },
  // Mono
  { value: "'JetBrains Mono', monospace", label: "JetBrains Mono" },
  { value: "'IBM Plex Mono', monospace", label: "IBM Plex Mono" },
];

function wOpt(value: string, label: string): { value: string; label: string; icon: ReactNode } {
  return { value, label, icon: <WeightIcon weight={value} /> };
}

const weightOptions = [
  wOpt("700", "Bold"),
  wOpt("600", "Semi"),
  wOpt("500", "Med"),
  wOpt("400", "Reg"),
];

const trackWeightOptions = [
  wOpt("500", "Med"),
  wOpt("400", "Reg"),
];

const alignOptions = [
  { value: "left", label: "", icon: <AlignLeftIcon /> },
  { value: "center", label: "", icon: <AlignCenterIcon /> },
  { value: "right", label: "", icon: <AlignRightIcon /> },
];

export default function TypographySection() {
  return (
    <AccordionSection value="typography" title="Typography & Content">
      <div className="space-y-4">
        {/* Font */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Font
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <FontSelect options={fontOptions} />
            <SettingColor settingKey="textColor" label="Text Color" />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Title */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Title
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="titleSizePt"
              label="Size"
              min={9}
              max={22}
              step={1}
              unit="pt"
            />
            <SettingToggle
              settingKey="titleWeight"
              label="Weight"
              options={weightOptions}
            />
            <SettingToggle
              settingKey="titleAlign"
              label="Alignment"
              options={alignOptions}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Artist */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Artist
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="artistSizePt"
              label="Size"
              min={8}
              max={18}
              step={1}
              unit="pt"
            />
            <SettingToggle
              settingKey="artistWeight"
              label="Weight"
              options={weightOptions}
            />
            <SettingToggle
              settingKey="artistAlign"
              label="Alignment"
              options={alignOptions}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Tracks */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Tracks
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <SettingSlider
              settingKey="trackSizePt"
              label="Size"
              min={6}
              max={12}
              step={1}
              unit="pt"
            />
            <SettingToggle
              settingKey="trackWeight"
              label="Weight"
              options={trackWeightOptions}
            />
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Text Cleanup */}
        <div>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
            Text Cleanup
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-text-muted mb-1.5">Title</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <SettingSwitch settingKey="stripParensTitle" label="Remove (parentheses)" />
                <SettingSwitch settingKey="stripBracketsTitle" label="Remove [brackets]" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-text-muted mb-1.5">Artist</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <SettingSwitch settingKey="stripParensArtist" label="Remove (parentheses)" />
                <SettingSwitch settingKey="stripBracketsArtist" label="Remove [brackets]" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-text-muted mb-1.5">Tracks</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <SettingSwitch settingKey="stripParensTracks" label="Remove (parentheses)" />
                <SettingSwitch settingKey="stripBracketsTracks" label="Remove [brackets]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}
