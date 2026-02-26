import AccordionSection from "../ui/AccordionSection";
import SettingSelect from "../ui/SettingSelect";
import SettingSlider from "../ui/SettingSlider";
import SettingSwitch from "../ui/SettingSwitch";

const pageSizeOptions = [
  { value: "A4", label: "A4 210x297mm" },
  { value: "Letter", label: "US Letter 215.9x279.4mm" },
];

export default function PrintSection() {
  return (
    <AccordionSection value="print" title="Print Production">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <SettingSelect
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
        <SettingSwitch settingKey="printCropMarks" label="Crop Marks" />
        <SettingSlider
          settingKey="printCropLengthMm"
          label="Crop Length"
          min={1}
          max={8}
          step={0.5}
          unit="mm"
        />
        <SettingSlider
          settingKey="printCropOffsetMm"
          label="Crop Offset"
          min={0.5}
          max={4}
          step={0.25}
          unit="mm"
        />
      </div>
    </AccordionSection>
  );
}
