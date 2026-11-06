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

const btnPrimary =
  "group inline-flex items-center gap-2.5 rounded-full bg-marigold py-2.5 pl-7 pr-2.5 text-sm font-semibold tracking-wide text-ink ring-1 ring-inset ring-cream/40 shadow-[0_14px_30px_-12px_rgb(var(--color-gold)/0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_36px_-12px_rgb(var(--color-gold)/0.95)]";
const btnSecondary =
  "group inline-flex items-center gap-2 rounded-full border border-chromeFg/20 bg-white/60 px-6 py-3 text-sm font-medium tracking-wide text-chromeFg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-[0_14px_30px_-16px_rgba(11,31,58,0.35)]";
const btnGhost =
  "group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-chromeFg/90 transition-colors hover:bg-chromeFg/5 hover:text-accent";

const Svg = ({ children, size = 16 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IconArrow = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const IconMenu = () => <Svg><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Svg>;
const IconPin = () => <Svg><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>;
const IconCheck = () => <Svg size={13}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className={`mb-3 inline-flex items-center gap-3 text-chili ${eyebrow}`}>
      <span className="h-px w-8 bg-marigold" aria-hidden="true" />
      {children}
    </p>
  );
}

const STEPS = [
  { n: "01", title: "Choose your meal", body: "Browse today's menu or order from a kitchen near you." },
  { n: "02", title: "Pay with M-Pesa", body: "Approve the prompt on your phone — that's it." },
  { n: "03", title: "Track to your door", body: "Follow your order from the kitchen all the way to you." },
];

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
      {/* Hero — headline, then the photo directly beneath it, then supporting copy */}
      <section className="relative overflow-hidden bg-chrome text-chromeFg">
        {/* Light mode: clean pale surface fading to white. Dark mode: a soft gold glow. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white dark:hidden" />
        <div className="pointer-events-none absolute -top-24 right-0 hidden h-[26rem] w-[26rem] rounded-full bg-marigold/20 blur-[100px] dark:block" />

        <div className="relative mx-auto max-w-3xl px-4 pt-12 pb-24 text-center md:pt-20 md:pb-32">
          <p className="anim-up inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-chromeFg/15 bg-white/50 px-3.5 py-2 text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-accent sm:text-[11px] sm:tracking-[0.2em]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" aria-hidden="true" />
            <span>
              Kakamenga Town &amp; nearby
              <span className="hidden min-[360px]:inline"> · delivered hot</span>
            </span>
          </p>

          <h1 className="anim-up font-display font-light text-[2.6rem] sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight mt-7" style={{ animationDelay: "0.1s" }}>
            Kenyan food from a{" "}
            <em className="font-serif-accent italic text-accent">real kitchen</em>, at your door.
          </h1>

          <div className="anim-up mx-auto mt-9 max-w-2xl" style={{ animationDelay: "0.2s" }}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-[0_30px_60px_-25px_rgba(11,31,58,0.55)] ring-1 ring-chromeFg/10">
              <Image
                src="/image.webp"
                alt="Chapati with beans, ugali with beef stew, roasted maize and coffee on a wooden table"
                fill
                priority
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover object-[50%_60%]"
              />
              {/* text-cream (not text-white): `white` is the themed card colour and turns dark in dark mode */}
              <p className="absolute bottom-3 left-3 w-fit max-w-[calc(100%-1.5rem)] truncate rounded-full border border-cream/25 bg-ink/70 px-4 py-2 text-[11px] font-medium tracking-[0.15em] text-cream backdrop-blur-md">
                Nyama choma · Pilau · Mandazi
              </p>
            </div>
          </div>

          <p className="anim-up mx-auto mt-9 max-w-md text-base sm:text-lg font-light leading-relaxed text-chromeFg/80" style={{ animationDelay: "0.3s" }}>
            Nyama choma, pilau, mandazi and more from kitchens near you — free delivery in select zones, no minimum fuss.
          </p>

          <div className="anim-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.4s" }}>
            <Link href="/menu" className={btnPrimary}>
              Order food
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-cream transition-transform duration-300 group-hover:translate-x-0.5">
                <IconArrow />
              </span>
            </Link>
            <Link href="/menu?todaysMenu=true" className={btnSecondary}>
              <span className="text-accent"><IconMenu /></span>
              Today&apos;s menu
            </Link>
            <Link href="/orders" className={btnGhost}>
              <span className="text-accent"><IconPin /></span>
              Track order
              <span className="transition-transform duration-300 group-hover:translate-x-0.5"><IconArrow /></span>
            </Link>
          </div>

          <ul className="anim-up mt-10 flex flex-wrap justify-center gap-2 text-xs" style={{ animationDelay: "0.5s" }}>
            {["Free delivery in select zones", "Pay with M-Pesa", "Track from kitchen to door"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-chromeFg/10 bg-white/50 px-3 py-1.5 font-normal text-chromeFg/80">
                <span className="text-accent"><IconCheck /></span>
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
                  className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs sm:text-sm transition-colors ${
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
            <SectionEyebrow>Fresh today</SectionEyebrow>
            <h2 className="font-display text-3xl font-light text-ink sm:text-4xl">
              Today&apos;s <em className="font-serif-accent italic">menu</em>
            </h2>
          </div>
          <Link href="/menu?todaysMenu=true" className="flex-shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/80 transition-all hover:border-marigold hover:bg-marigold/10 hover:text-ink">
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

      {/* How it works */}
      <section className="border-y border-ink/10 bg-chrome/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((st) => (
            <div key={st.n} className="text-center sm:text-left">
              <span className="font-serif-accent text-4xl italic text-accent">{st.n}</span>
              <h3 className="mt-2 font-display text-lg font-medium text-ink">{st.title}</h3>
              <p className="mt-1.5 text-sm font-normal leading-relaxed text-stone">{st.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kitchens */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="mb-8">
          <SectionEyebrow>Cooked with care</SectionEyebrow>
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
                className="group flex min-w-0 items-center gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4 transition-all hover:border-marigold hover:bg-white hover:shadow-[0_18px_40px_-24px_rgba(28,26,23,0.35)]"
              >
                <div className="font-serif-accent flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ink text-2xl text-marigold sm:h-14 sm:w-14">
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
