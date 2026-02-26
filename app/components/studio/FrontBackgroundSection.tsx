import AccordionSection from "../ui/AccordionSection";
import SettingSelect from "../ui/SettingSelect";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";
import SettingSwitch from "../ui/SettingSwitch";

const fillModeOptions = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
];

export default function FrontBackgroundSection() {
  return (
    <AccordionSection value="front-bg" title="Front Background">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <SettingSelect
          settingKey="frontFillMode"
          label="Fill Mode"
          options={fillModeOptions}
        />
        <SettingColor settingKey="frontBg" label="Primary" />
        <SettingColor settingKey="frontBg2" label="Secondary" />
        <SettingSlider
          settingKey="frontGradientAngle"
          label="Gradient Angle"
          min={0}
          max={360}
          step={5}
          unit="°"
        />
        <SettingSwitch
          settingKey="coverBorderEnabled"
          label="Cover Border"
        />
        <SettingColor settingKey="coverBorderColor" label="Cover Border Color" />
        <SettingSlider
          settingKey="coverBorderWidthMm"
          label="Cover Border Width"
          min={0}
          max={2}
          step={0.1}
          unit="mm"
        />
      </div>
    </AccordionSection>
  );
}
