import AccordionSection from "../ui/AccordionSection";
import SettingSelect from "../ui/SettingSelect";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";

const fillModeOptions = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
];

export default function BackBackgroundSection() {
  return (
    <AccordionSection value="back-bg" title="Back Background">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <SettingSelect
          settingKey="backFillMode"
          label="Fill Mode"
          options={fillModeOptions}
        />
        <SettingColor settingKey="backBg" label="Primary" />
        <SettingColor settingKey="backBg2" label="Secondary" />
        <SettingSlider
          settingKey="backGradientAngle"
          label="Gradient Angle"
          min={0}
          max={360}
          step={5}
          unit="°"
        />
        <SettingColor settingKey="lineColor" label="Line Color" />
        <SettingSlider
          settingKey="trackSpacing"
          label="Track Spacing"
          min={0.8}
          max={1.8}
          step={0.05}
        />
      </div>
    </AccordionSection>
  );
}
