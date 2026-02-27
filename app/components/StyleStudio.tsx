import * as Accordion from "@radix-ui/react-accordion";
import PresetPicker from "./studio/PresetPicker";
import ProfileManager from "./studio/ProfileManager";
import TypographySection from "./studio/TypographySection";
import FrontSection from "./studio/FrontSection";
import BackSection from "./studio/BackSection";
import CardSection from "./studio/CardSection";

interface Props {
  className?: string;
}

export default function StyleStudio({ className = "" }: Props) {
  return (
    <div className={`space-y-5 ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-text">Style Studio</h2>
        <p className="mt-1 text-sm text-text-muted">
          Customize your card design.
        </p>
      </div>
      <PresetPicker />
      <ProfileManager />
      <Accordion.Root
        type="multiple"
        defaultValue={["typography", "front"]}
        className="space-y-2"
      >
        <TypographySection />
        <FrontSection />
        <BackSection />
        <CardSection />
      </Accordion.Root>
    </div>
  );
}
