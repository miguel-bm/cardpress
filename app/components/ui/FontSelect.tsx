import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../../context/SettingsContext";

interface FontOption {
  value: string;
  label: string;
}

interface Props {
  options: FontOption[];
}

export default function FontSelect({ options }: Props) {
  const { settings, updateSetting } = useSettings();
  const value = String(settings.fontFamily);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const select = useCallback(
    (opt: FontOption) => {
      updateSetting("fontFamily", opt.value as never);
      setOpen(false);
      setSearch("");
    },
    [updateSetting],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filtered.length) select(filtered[activeIndex]);
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, activeIndex, filtered, select],
  );

  const currentLabel = options.find((o) => o.value === value)?.label ?? "Select font";

  return (
    <div ref={containerRef} className="space-y-1 relative">
      <label className="text-xs font-medium text-text">Font Family</label>
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text hover:border-border-focus transition-colors text-left"
        style={{ fontFamily: value }}
        onClick={() => {
          setOpen(!open);
          setSearch("");
          setActiveIndex(-1);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="px-2 pt-2 pb-1">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search fonts..."
                className="w-full rounded-lg border border-border bg-surface-alt px-2.5 py-1.5 text-xs text-text placeholder:text-text-faint outline-none focus:border-border-focus"
              />
            </div>

            {/* Options list */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-52 overflow-auto py-1"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-text-faint">No fonts found</li>
              )}
              {filtered.map((opt, i) => {
                const selected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    className={[
                      "px-3 py-1.5 cursor-pointer text-sm transition-colors",
                      i === activeIndex ? "bg-surface-alt" : "hover:bg-surface-alt",
                      selected ? "font-semibold text-text" : "text-text-muted",
                    ].join(" ")}
                    style={{ fontFamily: opt.value }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(opt)}
                  >
                    {opt.label}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
