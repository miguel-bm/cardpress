import CardCanvas from "./CardCanvas";
import AlbumInfo from "./AlbumInfo";
import ExportActions from "./ExportActions";

// ---------------------------------------------------------------------------
// PreviewPanel — sticky sidebar with front/back card previews,
// album info, and export actions
// ---------------------------------------------------------------------------

export default function PreviewPanel() {
  return (
    <div className="lg:sticky lg:top-20 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">
            Front
          </p>
          <CardCanvas side="front" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">
            Back
          </p>
          <CardCanvas side="back" />
        </div>
      </div>
      <AlbumInfo />
      <ExportActions />
    </div>
  );
}
