import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AlbumDetail, ProviderMode } from "../lib/types";
import { PROVIDER_STORAGE_KEY } from "../lib/profiles";

interface AlbumContextValue {
  album: AlbumDetail | null;
  setAlbum: (album: AlbumDetail | null) => void;
  provider: ProviderMode;
  setProvider: (provider: ProviderMode) => void;
}

const AlbumContext = createContext<AlbumContextValue | null>(null);

export function AlbumProvider({ children }: { children: ReactNode }) {
  const [album, setAlbum] = useState<AlbumDetail | null>(null);

  const [provider, setProviderState] = useState<ProviderMode>(() => {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (stored === "musicbrainz" || stored === "auto") return stored;
    return "itunes";
  });

  const setProvider = useCallback((value: ProviderMode) => {
    setProviderState(value);
    localStorage.setItem(PROVIDER_STORAGE_KEY, value);
  }, []);

  return (
    <AlbumContext.Provider value={{ album, setAlbum, provider, setProvider }}>
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum() {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error("useAlbum must be used within AlbumProvider");
  return ctx;
}
