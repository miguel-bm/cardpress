import AccordionSection from "../ui/AccordionSection";
import SettingSwitch from "../ui/SettingSwitch";
import SettingColor from "../ui/SettingColor";
import SettingSlider from "../ui/SettingSlider";

export default function FrameQrSection() {
  return (
    <AccordionSection value="frame-qr" title="Frame & QR">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <SettingSwitch settingKey="borderEnabled" label="Border" />
        <SettingColor settingKey="borderColor" label="Border Color" />
        <SettingSlider
          settingKey="borderWidthMm"
          label="Border Width"
          min={0}
          max={2}
          step={0.1}
          unit="mm"
        />
        <SettingSlider
          settingKey="cornerRadiusMm"
          label="Corner Radius"
          min={0}
          max={8}
          step={0.5}
          unit="mm"
        />
        <SettingColor settingKey="qrDark" label="QR Dark" />
        <SettingColor settingKey="qrLight" label="QR Light" />
        <SettingSlider
          settingKey="qrScale"
          label="QR Scale"
          min={0.65}
          max={1}
          step={0.05}
        />
        <SettingColor settingKey="backReserveBg" label="Strip BG" />
      </div>
    </AccordionSection>
  );
}
