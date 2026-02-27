import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { searchAlbums, fetchAlbum, proxyImageUrl } from "../../lib/api";
import type {
  AlbumDetail,
  AlbumSearchItem,
  ProviderMode,
} from "../../lib/types";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-text-muted"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

const PROVIDER_OPTIONS: { value: ProviderMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "itunes", label: "iTunes" },
  { value: "musicbrainz", label: "MusicBrainz" },
];

// ---------------------------------------------------------------------------
// PrintSearch — self-contained album search for the print queue
// ---------------------------------------------------------------------------

interface Props {
  onAdd: (album: AlbumDetail) => void;
  disabled?: boolean;
}

export default function PrintSearch({ onAdd, disabled }: Props) {
  const [provider, setProvider] = useState<ProviderMode>("auto");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlbumSearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      const id = ++searchIdRef.current;
      try {
        const items = await searchAlbums(trimmed, provider);
        if (id === searchIdRef.current) {
          setResults(items);
          setIsOpen(items.length > 0);
          setActiveIndex(-1);
        }
      } catch (err) {
        if (id === searchIdRef.current) {
          setResults([]);
          setIsOpen(false);
          toast.error(
            "Search failed: " +
              (err instanceof Error ? err.message : "Unknown error"),
          );
        }
      } finally {
        if (id === searchIdRef.current) setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, provider]);

  // Click-outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Select album → fetch full detail → add to queue
  const handleSelect = useCallback(
    async (item: AlbumSearchItem) => {
      if (disabled) return;
      setIsSelecting(true);
      setIsOpen(false);

      try {
        const album = await fetchAlbum(item.id, provider);
        onAdd(album);
        setQuery("");
        setResults([]);
      } catch (err) {
        toast.error(
          "Could not load album" +
            (err instanceof Error ? ": " + err.message : ""),
        );
      } finally {
        setIsSelecting(false);
      }
    },
    [provider, onAdd, disabled],
  );

  // Keyboard nav
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleSelect(results[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, activeIndex, handleSelect],
  );

  const listboxId = "print-search-listbox";

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div
        className={[
          "flex items-center gap-2",
          "bg-surface-alt border border-border rounded-xl px-3 h-10",
          "transition-all duration-150",
          "focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus",
          disabled ? "opacity-50 pointer-events-none" : "",
        ].join(" ")}
      >
        <div className="flex-shrink-0 text-text-muted">
          {isLoading || isSelecting ? <Spinner /> : <SearchIcon />}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search albums to add..."
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-text placeholder:text-text-faint"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `print-search-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-label="Search albums to add to print queue"
        />

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as ProviderMode)}
          className="flex-shrink-0 bg-transparent border-none outline-none cursor-pointer text-xs text-text-muted hover:text-text transition-colors duration-150"
          aria-label="Search provider"
        >
          {PROVIDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dropdown results */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={[
              "absolute top-full left-0 right-0 mt-1.5 z-50",
              "bg-surface border border-border rounded-xl shadow-lg",
              "max-h-80 overflow-auto",
              "py-1",
            ].join(" ")}
          >
            {results.map((item, index) => (
              <motion.li
                key={`${item.source}-${item.id}`}
                id={`print-search-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index, 10) * 0.03 }}
                className={[
                  "flex items-center gap-3 px-3 py-2 cursor-pointer",
                  "transition-colors duration-150",
                  index === activeIndex
                    ? "bg-surface-alt"
                    : "hover:bg-surface-alt",
                ].join(" ")}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
              >
                {item.coverUrl ? (
                  <img
                    src={proxyImageUrl(item.coverUrl) ?? ""}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0 bg-surface-alt"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-surface-alt flex-shrink-0 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-text-faint"
                      aria-hidden="true"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="2" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="12" cy="12" r="1" />
                    </svg>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {item.artist}
                  </div>
                </div>

                <span className="flex-shrink-0 text-[10px] text-text-faint uppercase tracking-wider">
                  {item.source === "itunes" ? "IT" : "MB"}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
