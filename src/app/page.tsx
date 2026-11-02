"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/apiClient";
import { FoodCard } from "@/components/FoodCard";
import type { FoodItem, Vendor } from "@/types";

const CATEGORIES = [
  { label: "Kenyan Delicacies", slug: "kenyan-delicacies", emoji: "🍲" },
  { label: "Breakfast", slug: "breakfast", emoji: "🥞" },
  { label: "Lunch", slug: "lunch", emoji: "🍛" },
  { label: "Dinner", slug: "dinner", emoji: "🌙" },
  { label: "Drinks", slug: "drinks", emoji: "🥤" },
  { label: "Snacks", slug: "snacks", emoji: "🥟" },
];

// Remembers the picked category chip and the strip's scroll offset so
// coming back (e.g. browser back) doesn't reset to the first chip.
const CATEGORY_ACTIVE_KEY = "kulago:homeCategoryActive";
const CATEGORY_SCROLL_KEY = "kulago:homeCategoryScroll";

const eyebrow = "text-[11px] tracking-[0.2em] uppercase";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-chrome";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${className}`} aria-hidden="true">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-shrink-0 text-accent" aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

// Placeholder shapes sized to match the real grids below, so content
// settles into place when it arrives instead of the page jumping. A shared
// `animate-pulse` on the wrapper pulses every block together rather than
// each one flickering on its own; `role="status"` + the sr-only text keep
// screen readers informed even though there's no visible "Loading" label.
function FoodGridSkeleton() {
  return (
    <div className="animate-pulse" role="status">
      <span className="sr-only">Loading today&apos;s picks…</span>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          // Mirrors FoodCard.tsx's own markup — same aspect ratio, border,
          // radius and card background — plus bg-stone/20, which is the
          // exact tone FoodCard already uses for its own image placeholder.
          <div key={i} className="bg-white border-2 border-ink/10 rounded-card overflow-hidden">
            <div className="aspect-[4/3] bg-stone/20" />
            <div className="p-3">
              <div className="h-3 w-2/5 rounded bg-stone/20" />
              <div className="mt-1.5 h-4 w-4/5 rounded bg-stone/20" />
              <div className="mt-2 flex items-baseline justify-between">
                <div className="h-4 w-14 rounded bg-stone/20" />
                <div className="h-3 w-10 rounded bg-stone/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorListSkeleton() {
  return (
    <div className="animate-pulse" role="status">
      <span className="sr-only">Loading kitchens near you…</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4">
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-stone/20 sm:h-14 sm:w-14" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-4 w-2/3 rounded bg-stone/20" />
              <div className="h-3 w-1/2 rounded bg-stone/20" />
              <div className="h-3 w-1/4 rounded bg-stone/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [todaysMenu, setTodaysMenu] = useState<FoodItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const chipStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<FoodItem[]>("/food/search?todaysMenu=true"),
      api.get<Vendor[]>("/vendors"),
    ])
      .then(([menu, vendorList]) => {
        setTodaysMenu(menu);
        setVendors(vendorList);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const savedCategory = window.localStorage.getItem(CATEGORY_ACTIVE_KEY);
    if (savedCategory) setActiveCategory(savedCategory);
    const savedScroll = window.localStorage.getItem(CATEGORY_SCROLL_KEY);
    if (savedScroll && chipStripRef.current) {
      chipStripRef.current.scrollLeft = Number(savedScroll);
    }
  }, []);

  useEffect(() => {
    const el = chipStripRef.current;
    if (!el) return;
    const handleScroll = () => window.localStorage.setItem(CATEGORY_SCROLL_KEY, String(el.scrollLeft));
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    window.localStorage.setItem(CATEGORY_ACTIVE_KEY, slug);
    if (chipStripRef.current) {
      window.localStorage.setItem(CATEGORY_SCROLL_KEY, String(chipStripRef.current.scrollLeft));
    }
  };

  return (
    <div>
      {/* Hero — single centred column: headline, then the photo directly beneath
          it (shown at full strength, no overlay), then the supporting copy. */}
      <section className="relative overflow-hidden bg-chrome text-chromeFg">
        {/* Warm glow only in dark mode; light mode stays clean and neutral. */}
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-br from-transparent via-transparent to-marigold/15 dark:block" />
        <div className="pointer-events-none absolute -top-24 right-0 hidden h-[26rem] w-[26rem] rounded-full bg-marigold/25 blur-[100px] dark:block" />

        <div className="relative mx-auto max-w-3xl px-4 pt-12 pb-24 text-center md:pt-20 md:pb-32">
          {/* The dot is flex-shrink-0 and the text lives in its own nowrap span, so
              the dot can never be squashed into an oval or float between two
              wrapped lines (the cause of the misplacement in Chrome/Android). */}
          <p className={`anim-up mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-full border border-chromeFg/15 bg-white/60 px-4 py-2 text-accent backdrop-blur ${eyebrow} tracking-[0.14em] sm:tracking-[0.2em]`}>
            <span aria-hidden="true" className="block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-marigold" />
            <span className="whitespace-nowrap leading-none">Kakamenga &amp; nearby · delivered hot</span>
          </p>

          <h1 className="anim-up font-display font-light text-[2.6rem] sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight mt-7 [text-wrap:balance]" style={{ animationDelay: "0.1s" }}>
            Kenyan food from a{" "}
            <em className="font-serif-accent italic text-accent">real kitchen</em>, at your door.
          </h1>

          <div className="anim-up mx-auto mt-9 max-w-2xl" style={{ animationDelay: "0.2s" }}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-[0_30px_60px_-25px_rgba(28,26,23,0.5)] ring-1 ring-chromeFg/10">
              <Image
                src="/image.webp"
                alt="Chapati with beans, ugali with beef stew, roasted maize and coffee on a wooden table"
                fill
                priority
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover object-[50%_60%]"
              />
              {/* Soft scrim keeps the caption readable on any part of the photo */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
              {/* text-cream, not text-white: `white` is remapped to the card
                  colour in tailwind.config, so it turned dark in dark mode. */}
              <p className="absolute bottom-3 left-3 rounded-full border border-cream/20 bg-black/55 px-3.5 py-1.5 text-[11px] font-normal tracking-[0.15em] text-cream backdrop-blur-md">
                Nyama choma · Pilau · Mandazi
              </p>
            </div>
          </div>

          <p className="anim-up mx-auto mt-9 max-w-md text-base sm:text-lg font-light leading-relaxed text-chromeFg/80" style={{ animationDelay: "0.3s" }}>
            Nyama choma, pilau, mandazi and more from kitchens near you — free delivery in select zones, no minimum fuss.
          </p>

          <div className="anim-up mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/menu"
              className={`group inline-flex items-center gap-2 rounded-full bg-marigold px-7 py-3.5 text-sm font-medium tracking-wide text-ink shadow-[0_12px_24px_-10px_rgba(201,127,0,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-marigoldDark hover:shadow-[0_16px_28px_-10px_rgba(201,127,0,0.8)] active:translate-y-0 ${focusRing}`}
            >
              Order food
              <ArrowIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/menu?todaysMenu=true"
              className={`inline-flex items-center rounded-full border border-chromeFg/20 bg-white/70 px-7 py-3.5 text-sm font-medium tracking-wide text-chromeFg shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-white hover:text-accent hover:shadow-md active:translate-y-0 ${focusRing}`}
            >
              Today&apos;s menu
            </Link>
            <Link
              href="/orders"
              className={`group inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium tracking-wide text-chromeFg/80 transition-colors duration-200 hover:bg-chromeFg/5 hover:text-accent ${focusRing}`}
            >
              Track order
              <ArrowIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <ul className="anim-up mt-10 flex flex-wrap justify-center gap-x-7 gap-y-2.5 text-xs font-light tracking-wide text-chromeFg/80" style={{ animationDelay: "0.5s" }}>
            {["Free delivery in select zones", "Pay with M-Pesa", "Track from kitchen to door"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckIcon />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Category bar */}
      <section className="relative z-10 mx-auto -mt-9 max-w-5xl px-4">
        <div className="relative">
          <div
            ref={chipStripRef}
            className="hide-scrollbar flex gap-1.5 overflow-x-auto scroll-smooth rounded-full border border-ink/10 bg-white p-1.5 shadow-[0_24px_40px_-24px_rgba(28,26,23,0.4)]"
          >
            {CATEGORIES.map((c) => {
              const isActive = activeCategory === c.slug;
              return (
                <Link
                  key={c.slug}
                  href={`/menu?category=${c.slug}`}
                  onClick={() => handleCategoryClick(c.slug)}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs sm:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold ${
                    isActive ? "bg-ink font-medium text-marigold" : "font-light text-ink/80 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  {c.label}
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 rounded-l-full bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-full bg-gradient-to-l from-white to-transparent" />
        </div>
      </section>

      {/* Today's menu */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className={`mb-2 text-chili/80 ${eyebrow}`}>Fresh today</p>
            <h2 className="font-display text-3xl font-light text-ink sm:text-4xl">
              Today&apos;s <em className="font-serif-accent italic">menu</em>
            </h2>
          </div>
          <Link href="/menu?todaysMenu=true" className="flex-shrink-0 border-b border-ink/20 pb-0.5 text-sm font-light text-ink/80 transition-colors hover:border-chili hover:text-chili">
            See all →
          </Link>
        </div>
        {loading ? (
          <FoodGridSkeleton />
        ) : todaysMenu.length === 0 ? (
          <p className="font-light text-stone">No featured items yet — check back soon, or browse the full menu.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {todaysMenu.slice(0, 8).map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Kitchens */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="mb-8">
          <p className={`mb-2 text-chili/80 ${eyebrow}`}>Cooked with care</p>
          <h2 className="font-display text-3xl font-light text-ink sm:text-4xl">
            Kitchens <em className="font-serif-accent italic">near you</em>
          </h2>
        </div>
        {loading ? (
          <VendorListSkeleton />
        ) : vendors.length === 0 ? (
          <p className="font-light text-stone">No kitchens live yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {vendors.map((v) => (
              <Link
                key={v.id}
                href={`/menu?vendorId=${v.id}`}
                className="group flex min-w-0 items-center gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4 transition-all hover:-translate-y-0.5 hover:border-marigold hover:bg-white hover:shadow-[0_18px_40px_-24px_rgba(28,26,23,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
              >
                <div className="font-serif-accent flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ink text-2xl text-marigold ring-2 ring-marigold/30 ring-offset-2 ring-offset-white sm:h-14 sm:w-14">
                  {v.businessName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-lg font-medium text-ink">{v.businessName}</h3>
                  <p className="truncate text-sm font-light text-stone">{v.description ?? "Kenyan kitchen"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-light">
                    <span className={`flex items-center gap-1.5 ${v.isOpen ? "text-sukuma" : "text-chili"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${v.isOpen ? "bg-sukuma" : "bg-chili"}`} />
                      {v.isOpen ? "Open now" : "Closed"}
                    </span>
                    {v.deliveryZone?.isFreeDelivery && <span className="text-marigoldDark">Free delivery</span>}
                  </div>
                </div>
                <span className="flex-shrink-0 text-ink/30 transition-all group-hover:translate-x-1 group-hover:text-marigold">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
