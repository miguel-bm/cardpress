import AccordionSection from "../ui/AccordionSection";
import SettingSelect from "../ui/SettingSelect";
import SettingSlider from "../ui/SettingSlider";

const overflowModeOptions = [
  { value: "auto", label: "Auto" },
  { value: "downscale", label: "Downscale only" },
  { value: "multicolumn", label: "Multi-column first" },
];

export default function BackOverflowSection() {
  return (
    <AccordionSection value="back-overflow" title="Track Overflow">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <SettingSelect
          settingKey="backOverflowMode"
          label="Overflow Mode"
          options={overflowModeOptions}
        />
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
      </div>
    </AccordionSection>
  );
}
