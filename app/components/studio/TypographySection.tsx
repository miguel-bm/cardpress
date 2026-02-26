import AccordionSection from "../ui/AccordionSection";
import SettingSelect from "../ui/SettingSelect";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";

const fontOptions = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Space Grotesk', sans-serif", label: "Space Grotesk" },
  { value: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Manrope', sans-serif", label: "Manrope" },
  { value: "'Fraunces', serif", label: "Fraunces" },
  { value: "'Fira Sans', sans-serif", label: "Fira Sans" },
];

const weightOptions = [
  { value: "700", label: "Bold" },
  { value: "600", label: "Semibold" },
  { value: "500", label: "Medium" },
  { value: "400", label: "Regular" },
];

const trackWeightOptions = [
  { value: "500", label: "Medium" },
  { value: "400", label: "Regular" },
];

const alignOptions = [
  { value: "center", label: "Center" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export default function TypographySection() {
  return (
    <AccordionSection value="typography" title="Typography">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <SettingSelect
          settingKey="fontFamily"
          label="Font Family"
          options={fontOptions}
        />
        <SettingColor settingKey="textColor" label="Text Color" />

        <SettingSlider
          settingKey="titleSizePt"
          label="Title Size"
          min={9}
          max={22}
          step={1}
          unit="pt"
        />
        <SettingSelect
          settingKey="titleWeight"
          label="Title Weight"
          options={weightOptions}
        />

        <SettingSlider
          settingKey="artistSizePt"
          label="Artist Size"
          min={8}
          max={18}
          step={1}
          unit="pt"
        />
        <SettingSelect
          settingKey="artistWeight"
          label="Artist Weight"
          options={weightOptions}
        />

        <SettingSlider
          settingKey="trackSizePt"
          label="Track Size"
          min={6}
          max={12}
          step={1}
          unit="pt"
        />
        <SettingSelect
          settingKey="trackWeight"
          label="Track Weight"
          options={trackWeightOptions}
        />

        <SettingSelect
          settingKey="titleAlign"
          label="Title Align"
          options={alignOptions}
        />
        <SettingSelect
          settingKey="artistAlign"
          label="Artist Align"
          options={alignOptions}
        />
      </div>
    </AccordionSection>
  );
}
