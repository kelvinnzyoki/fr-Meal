"use client";

import { useEffect } from "react";

const STORAGE_KEY = "theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  // Safety net: if ThemeScript isn't in the layout yet, still apply the saved
  // (or system) preference on mount. It's idempotent when the script ran.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {}
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    } catch {}
  }

  // Icons swap through CSS (.dark .theme-icon-*), so the markup is identical
  // on server and client — no hydration mismatch.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      title="Toggle theme"
      className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition-colors hover:bg-chromeFg/10 focus-ring ${className}`}
    >
      {/* Moon — shown in light mode */}
      <svg className="theme-icon-moon col-start-1 row-start-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      {/* Sun — shown in dark mode */}
      <svg className="theme-icon-sun col-start-1 row-start-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    </button>
  );
}
