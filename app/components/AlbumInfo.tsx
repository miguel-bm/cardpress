import { useAlbum } from "../context/AlbumContext";

// ---------------------------------------------------------------------------
// AlbumInfo — compact display of selected album metadata
// ---------------------------------------------------------------------------

export default function AlbumInfo() {
  const { album } = useAlbum();

  if (!album) {
    return (
      <p className="text-xs text-text-faint text-center">
        Search for an album to get started
      </p>
    );
  }

  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;
  const trackCount = album.tracks.length;

  return (
    <div className="space-y-0.5">
      <p className="font-medium text-text truncate">{album.title}</p>
      <p className="text-sm text-text-muted truncate">{album.artist}</p>
      <p className="text-xs text-text-faint">
        {trackCount} {trackCount === 1 ? "track" : "tracks"}
        {year ? ` \u00B7 ${year}` : ""}
      </p>
    </div>
  );
}
