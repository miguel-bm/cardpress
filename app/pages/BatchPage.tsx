import { useState } from "react";
import { toast } from "sonner";
import { useSettings } from "../context/SettingsContext";
import { useAlbum } from "../context/AlbumContext";
import { generateBatchPdf } from "../lib/csv";
import CsvDropZone from "../components/CsvDropZone";
import BatchSettings from "../components/BatchSettings";
import BatchProgress from "../components/BatchProgress";

// ---------------------------------------------------------------------------
// BatchPage — CSV upload and duplex 3x3 PDF generation
// ---------------------------------------------------------------------------

export default function BatchPage() {
  const { settings } = useSettings();
  const { provider } = useAlbum();

  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [enrichTracks, setEnrichTracks] = useState(true);
  const [mirrorBack, setMirrorBack] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  async function handleGenerate() {
    if (!csvRows.length) return;
    setIsGenerating(true);
    setProgressMessage("Starting batch generation...");
    try {
      await generateBatchPdf(csvRows, settings, provider, enrichTracks, {
        mirrorBack,
        onProgress: (message: string) => setProgressMessage(message),
      });
      toast.success(`PDF generated — ${csvRows.length} cards`);
    } catch (err) {
      console.error("Batch generation failed:", err);
      const message =
        err instanceof Error ? err.message : "Generation failed.";
      setProgressMessage(message);
      toast.error("Batch generation failed: " + message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-semibold text-text">Batch Generator</h1>
        <p className="text-text-muted">
          Upload a CSV and generate duplex-ready 3x3 print sheets.
        </p>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        <CsvDropZone onParsed={setCsvRows} />

        <BatchSettings
          enrichTracks={enrichTracks}
          setEnrichTracks={setEnrichTracks}
          mirrorBack={mirrorBack}
          setMirrorBack={setMirrorBack}
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!csvRows.length || isGenerating}
          className={[
            "w-full py-3 rounded-xl font-medium transition-colors",
            "bg-accent text-white hover:bg-accent-hover",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          {isGenerating ? "Generating..." : "Generate Duplex 3x3 PDF"}
        </button>

        <BatchProgress message={progressMessage} isActive={isGenerating} />
      </div>
    </div>
  );
}
