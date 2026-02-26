import PreviewPanel from "../components/PreviewPanel";
import StyleStudio from "../components/StyleStudio";

export default function DesignPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,2fr)_minmax(400px,3fr)] gap-6 lg:gap-8 items-start">
        <PreviewPanel />
        <StyleStudio />
      </div>
    </div>
  );
}
