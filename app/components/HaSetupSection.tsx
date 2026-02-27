import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ClipboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// YAML template builder
// ---------------------------------------------------------------------------

function buildYaml(entityId: string, volume: string): string {
  return `alias: "NFC – Play Album on Speaker"
description: "Scan any album NFC card to play on your speaker"
triggers:
  - trigger: tag
conditions:
  - condition: template
    value_template: "{{ trigger.tag_id.startswith('album-spotify-') }}"
actions:
  - action: media_player.volume_set
    target:
      entity_id: ${entityId}
    data:
      volume_level: ${volume}
  - action: media_player.play_media
    target:
      entity_id: ${entityId}
    data:
      media_content_id: >-
        https://open.spotify.com/album/{{ trigger.tag_id.replace('album-spotify-', '') }}
      media_content_type: music
mode: single`;
}

// ---------------------------------------------------------------------------
// HaSetupSection
// ---------------------------------------------------------------------------

export default function HaSetupSection() {
  const [entityId, setEntityId] = useState("media_player.salon");
  const [volume, setVolume] = useState("0.3");
  const [copied, setCopied] = useState(false);

  const yaml = buildYaml(entityId, volume);

  // Reset copied state after timeout
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
    } catch {
      // Fallback: do nothing if clipboard is unavailable
    }
  }, [yaml]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nfc-play-album.yaml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [yaml]);

  return (
    <div className="mt-10 border-t border-border pt-10">
      {/* Header */}
      <div className="space-y-1 mb-6">
        <h2 className="text-base font-semibold text-text">
          Home Assistant Setup
        </h2>
        <p className="text-xs text-text-muted">
          Add this automation to Home Assistant so scanned NFC album cards
          automatically play on your speaker.
        </p>
      </div>

      {/* Customisable fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <label
            htmlFor="ha-entity-id"
            className="text-xs font-medium text-text"
          >
            Speaker entity_id
          </label>
          <input
            id="ha-entity-id"
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:border-border-focus focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="ha-volume"
            className="text-xs font-medium text-text"
          >
            Volume level
          </label>
          <input
            id="ha-volume"
            type="text"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:border-border-focus focus:outline-none"
          />
        </div>
      </div>

      {/* YAML preview */}
      <pre className="rounded-lg border border-border bg-surface-alt px-4 py-3 text-xs font-mono text-text overflow-x-auto whitespace-pre leading-relaxed">
        {yaml}
      </pre>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handleCopy}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            copied
              ? "bg-green-100 text-green-700"
              : "border border-border text-text-muted hover:text-text hover:border-text-muted",
          ].join(" ")}
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
          {copied ? "Copied!" : "Copy YAML"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text hover:border-text-muted transition-colors"
        >
          <DownloadIcon />
          Download .yaml
        </button>
      </div>
    </div>
  );
}
