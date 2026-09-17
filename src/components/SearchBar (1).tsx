"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({
  placeholder = "Search for nyama choma, pilau, mandazi…",
  className = "",
  defaultValue = "",
  onSearch,
}: {
  placeholder?: string;
  className?: string;
  /** Initial text in the box — e.g. the current ?q= value on the menu page. */
  defaultValue?: string;
  /**
   * When provided, submitting calls this instead of navigating — for use on
   * a page (like /menu) that already tracks its own search state. When
   * omitted, submitting navigates to /menu?q=<value>, e.g. from the homepage.
   */
  onSearch?: (value: string) => void;
}) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(trimmed ? `/menu?q=${encodeURIComponent(trimmed)}` : "/menu");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`} role="search">
      <div className="flex items-center gap-2 w-full bg-white rounded-card border-2 border-ink/10 focus-within:border-marigold transition-colors px-3 sm:px-4 py-2 sm:py-2.5">
        <SearchIcon className="text-stone flex-shrink-0" />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search for food"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm sm:text-base text-ink placeholder:text-stone/70"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="flex-shrink-0 text-stone hover:text-ink transition-colors"
          >
            <ClearIcon />
          </button>
        )}

        {/* On very narrow screens the icon + Enter key is enough; the
            explicit button appears once there's room for it. */}
        <button
          type="submit"
          className="flex-shrink-0 hidden sm:inline-block bg-marigold text-ink font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-marigoldDark transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
