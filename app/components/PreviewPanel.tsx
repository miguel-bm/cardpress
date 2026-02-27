import CardCanvas from "./CardCanvas";
import ExportActions from "./ExportActions";

// ---------------------------------------------------------------------------
// PreviewPanel — sticky sidebar with front/back card previews (vertical),
// and compact export actions
// ---------------------------------------------------------------------------

interface Props {
  className?: string;
}

export default function PreviewPanel({ className = "" }: Props) {
  return (
    <div
      className={[
        "lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]",
        "flex flex-col items-center gap-3",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 w-full items-center flex-1 justify-center">
        <div className="w-full max-w-[260px]">
          <p className="text-[10px] font-medium text-text-faint mb-1 uppercase tracking-widest text-center">
            Front
          </p>
          <CardCanvas side="front" />
        </div>
        <div className="w-full max-w-[260px]">
          <p className="text-[10px] font-medium text-text-faint mb-1 uppercase tracking-widest text-center">
            Back
          </p>
          <CardCanvas side="back" />
        </div>
      </div>
      <ExportActions />
    </div>
  );
}
