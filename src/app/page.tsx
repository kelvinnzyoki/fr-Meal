"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-marigold/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-chili/25 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(251,246,236,0.07)_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-28 md:pt-24 md:pb-36 grid md:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <p className={`anim-up inline-flex items-center gap-2 rounded-full border border-cream/15 px-3.5 py-1.5 text-marigold ${eyebrow}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              Nairobi &amp; nearby · delivered hot
            </p>

            <h1
              className="anim-up font-display font-light text-[2.6rem] sm:text-6xl md:text-7xl leading-[1.02] tracking-tight mt-7"
              style={{ animationDelay: "0.1s" }}
            >
              Kenyan food from a{" "}
              <em className="font-serif-accent italic text-marigold">real kitchen</em>, at your door.
            </h1>

            <p
              className="anim-up mt-6 max-w-md text-base sm:text-lg font-light leading-relaxed text-cream/70"
              style={{ animationDelay: "0.2s" }}
            >
              Nyama choma, pilau, mandazi and more from kitchens near you — free delivery in select zones, no minimum fuss.
            </p>

            <div className="anim-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.3s" }}>
              <Link href="/menu" className="rounded-full bg-marigold px-7 py-3 text-sm font-medium tracking-wide text-ink hover:bg-marigoldDark transition-colors">
                Order food
              </Link>
              <Link href="/menu?todaysMenu=true" className="rounded-full border border-cream/25 px-7 py-3 text-sm font-light tracking-wide text-cream hover:border-marigold hover:text-marigold transition-colors">
                Today&apos;s menu
              </Link>
              <Link href="/orders" className="px-3 py-3 text-sm font-light text-cream/60 hover:text-marigold transition-colors">
                Track order →
              </Link>
            </div>

            <ul className="anim-up mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs font-light tracking-wide text-cream/50" style={{ animationDelay: "0.4s" }}>
              <li>Free delivery in select zones</li>
              <li className="hidden sm:block text-cream/20">|</li>
              <li>Pay with M-Pesa</li>
              <li className="hidden sm:block text-cream/20">|</li>
              <li>Track from kitchen to door</li>
            </ul>
          </div>

          {/* Dish composition */}
          <div className="relative mx-auto aspect-square w-60 sm:w-72 md:w-full max-w-sm">
            <div className="absolute inset-0 rounded-full border border-cream/10" />
            <div className="absolute inset-6 rounded-full border border-marigold/30" />
            <div className="anim-float absolute inset-12 flex items-center justify-center rounded-full bg-gradient-to-br from-marigold to-chili text-7xl sm:text-8xl shadow-[0_30px_80px_-20px_rgba(240,165,0,0.5)]">
              🍛
            </div>
            <div className="anim-float-slow absolute top-2 right-4 flex h-14 w-14 items-center justify-center rounded-full border border-cream/15 bg-cream/10 text-2xl backdrop-blur">🥟</div>
            <div className="anim-float-slow absolute bottom-10 left-1 flex h-12 w-12 items-center justify-center rounded-full border border-cream/15 bg-cream/10 text-xl backdrop-blur" style={{ animationDelay: "-5s" }}>🍲</div>
            <div className="anim-float absolute top-1/2 -right-1 flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 bg-cream/10 text-lg backdrop-blur" style={{ animationDelay: "-2s" }}>🥤</div>
            <p className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-cream/15 bg-ink/80 px-4 py-1.5 text-[11px] font-light tracking-[0.15em] text-cream/70 backdrop-blur">
              Nyama choma · Pilau · Mandazi
            </p>
          </div>
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
                    isActive ? "bg-ink font-medium text-marigold" : "font-light text-ink/70 hover:bg-ink/5 hover:text-ink"
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
          <Link href="/menu?todaysMenu=true" className="flex-shrink-0 border-b border-ink/20 pb-0.5 text-sm font-light text-ink/70 transition-colors hover:border-chili hover:text-chili">
            See all →
          </Link>
        </div>
        {loading ? (
          <p className="font-light text-stone">Loading today&apos;s picks…</p>
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
        {vendors.length === 0 ? (
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
