"use client";

import { useEffect, useState } from "react";
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

export default function HomePage() {
  const [todaysMenu, setTodaysMenu] = useState<FoodItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-cream">
        <div className="max-w-5xl mx-auto px-4 py-14 md:py-20">
          <p className="text-marigold font-semibold mb-3">Nairobi &amp; nearby, delivered hot</p>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[1.05] max-w-2xl">
            Kenyan food from a real kitchen, at your door.
          </h1>
          <p className="mt-5 text-cream/80 max-w-lg">
            Nyama choma, pilau, mandazi, and more from kitchens near you — free delivery in select zones, no minimum fuss.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="bg-marigold text-ink font-bold px-6 py-3 rounded-card hover:bg-marigoldDark transition-colors">
              Order Food
            </Link>
            <Link href="/menu?todaysMenu=true" className="border-2 border-cream/30 text-cream font-semibold px-6 py-3 rounded-card hover:border-marigold hover:text-marigold transition-colors">
              Today&apos;s Menu
            </Link>
            <Link href="/orders" className="text-cream/80 font-semibold px-6 py-3 hover:text-marigold transition-colors">
              Track Order →
            </Link>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white border-2 border-ink/10 rounded-card p-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/menu?category=${c.slug}`}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-cream hover:bg-marigold/20 transition-colors text-sm font-semibold text-ink"
            >
              <span>{c.emoji}</span>
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Today's menu */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-ink">Today&apos;s Menu</h2>
          <Link href="/menu?todaysMenu=true" className="text-sm font-semibold text-chili hover:underline">See all</Link>
        </div>
        {loading ? (
          <p className="text-stone">Loading today&apos;s picks…</p>
        ) : todaysMenu.length === 0 ? (
          <p className="text-stone">No featured items yet — check back soon, or browse the full menu.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {todaysMenu.slice(0, 8).map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Vendors */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl font-bold text-ink mb-4">Kitchens near you</h2>
        {vendors.length === 0 ? (
          <p className="text-stone">No kitchens live yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vendors.map((v) => (
              <Link key={v.id} href={`/menu?vendorId=${v.id}`} className="flex items-center gap-4 bg-white border-2 border-ink/10 rounded-card p-4 hover:border-marigold transition-colors">
                <div className="w-14 h-14 rounded-full bg-stone/20 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-ink truncate">{v.businessName}</h3>
                  <p className="text-sm text-stone truncate">{v.description ?? "Kenyan kitchen"}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs font-semibold">
                    <span className={v.isOpen ? "text-sukuma" : "text-chili"}>{v.isOpen ? "Open now" : "Closed"}</span>
                    {v.deliveryZone?.isFreeDelivery && <span className="text-marigoldDark">· Free delivery</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
