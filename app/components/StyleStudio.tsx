import * as Accordion from "@radix-ui/react-accordion";
import PresetPicker from "./studio/PresetPicker";
import ProfileManager from "./studio/ProfileManager";
import TypographySection from "./studio/TypographySection";
import FrontBackgroundSection from "./studio/FrontBackgroundSection";
import BackBackgroundSection from "./studio/BackBackgroundSection";
import BackOverflowSection from "./studio/BackOverflowSection";
import FrameQrSection from "./studio/FrameQrSection";
import PrintSection from "./studio/PrintSection";

export default function StyleStudio() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-text">Style Studio</h2>
        <p className="mt-1 text-sm text-text-muted">
          Design once, reuse in single and batch mode.
        </p>
      </div>
      <PresetPicker />
      <ProfileManager />
      <Accordion.Root
        type="multiple"
        defaultValue={["typography"]}
        className="space-y-2"
      >
        <TypographySection />
        <FrontBackgroundSection />
        <BackBackgroundSection />
        <BackOverflowSection />
        <FrameQrSection />
        <PrintSection />
      </Accordion.Root>
    </div>
  );
}
