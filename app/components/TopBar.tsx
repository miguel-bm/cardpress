import { Link, useLocation } from "react-router";
import type { ReactNode } from "react";
import SearchBar from "./SearchBar";
import logoSvg from "../assets/logo.svg";

// ---------------------------------------------------------------------------
// Nav icons (inline SVGs, 15px)
// ---------------------------------------------------------------------------

function PenRulerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 19 7-7 3 3-7 7-3-3z" />
      <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="m2 2 7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3h12v6" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nav link data
// ---------------------------------------------------------------------------

const NAV_LINKS: { to: string; label: string; icon: ReactNode }[] = [
  { to: "/", label: "Design", icon: <PenRulerIcon /> },
  { to: "/print", label: "Print", icon: <PrinterIcon /> },
];

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
          className="flex-shrink-0 flex items-center gap-2 font-semibold text-lg tracking-tight text-text hover:text-text transition-colors duration-150"
        >
          <img src={logoSvg} alt="" width={24} height={24} className="flex-shrink-0" />
          Cardpress
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
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium",
                  "transition-all duration-150",
                  isActive
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-text hover:bg-accent-soft",
                ].join(" ")}
              >
                {link.icon}
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
