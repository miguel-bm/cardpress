import { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import {
  saveProfile,
  loadProfile,
  deleteProfile,
  listProfiles,
} from "../../lib/profiles";

export default function ProfileManager() {
  const { settings, applySettings } = useSettings();
  const [profileName, setProfileName] = useState("");
  const [profiles, setProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");

  useEffect(() => {
    setProfiles(listProfiles());
  }, []);

  const handleSave = () => {
    const name = profileName.trim();
    if (!name) return;
    saveProfile(name, settings);
    setProfileName("");
    const updated = listProfiles();
    setProfiles(updated);
    setSelectedProfile(name);
  };

  const handleLoad = () => {
    if (!selectedProfile) return;
    const loaded = loadProfile(selectedProfile);
    if (loaded) {
      applySettings(loaded);
    }
  };

  const handleDelete = () => {
    if (!selectedProfile) return;
    deleteProfile(selectedProfile);
    const updated = listProfiles();
    setProfiles(updated);
    setSelectedProfile(updated[0] ?? "");
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text">Profiles</h3>

      {/* Save row */}
      <div className="flex gap-2">
        <input
          type="text"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text placeholder:text-text-faint focus:border-border-focus focus:outline-none"
          placeholder="Profile name..."
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
        <button
          type="button"
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-surface transition-opacity hover:opacity-80 disabled:opacity-40"
          onClick={handleSave}
          disabled={!profileName.trim()}
        >
          Save
        </button>
      </div>

      {/* Load / Delete row */}
      {profiles.length > 0 && (
        <div className="flex gap-2">
          <select
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:border-border-focus focus:outline-none"
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
          >
            <option value="">Select profile...</option>
            {profiles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-alt disabled:opacity-40"
            onClick={handleLoad}
            disabled={!selectedProfile}
          >
            Load
          </button>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-surface-alt disabled:opacity-40"
            onClick={handleDelete}
            disabled={!selectedProfile}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
