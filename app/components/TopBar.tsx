import { Link, useLocation } from "react-router";
import SearchBar from "./SearchBar";

// ---------------------------------------------------------------------------
// Nav link data
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { to: "/", label: "Design" },
  { to: "/batch", label: "Batch" },
] as const;

// ---------------------------------------------------------------------------
// TopBar component
// ---------------------------------------------------------------------------

export default function TopBar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-x-6 gap-y-2 py-2 sm:py-0 sm:h-16">
        {/* Left: Brand */}
        <Link
          to="/"
          className="flex-shrink-0 font-semibold text-lg tracking-tight text-text hover:text-text transition-colors duration-150"
        >
          Album Cards
        </Link>

        {/* Right: Navigation (stays on same line as brand) */}
        <nav className="flex-shrink-0 flex items-center gap-1 ml-auto md:ml-0 md:order-last">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium",
                  "transition-all duration-150",
                  isActive
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-text hover:bg-accent-soft",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Center: SearchBar (only on design page) — wraps to full width on mobile */}
        <div className="w-full md:w-auto md:flex-1 md:flex md:justify-center order-last md:order-none">
          {location.pathname === "/" && <SearchBar />}
        </div>
      </div>
    </header>
  );
}
