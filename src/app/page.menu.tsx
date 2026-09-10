"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { FoodCard } from "@/components/FoodCard";
import type { FoodItem, Vendor, FoodCategory } from "@/types";

function MenuContent() {
  const params = useSearchParams();
  const vendorId = params.get("vendorId");
  const category = params.get("category") ?? "";
  const todaysMenu = params.get("todaysMenu") === "true";
  const initialQ = params.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [vendorMenu, setVendorMenu] = useState<{ vendor: Vendor; categories: FoodCategory[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (vendorId) {
      api
        .get<Vendor & { categories: FoodCategory[] }>(`/vendors/${vendorId}`)
        .then((v) => setVendorMenu({ vendor: v, categories: v.categories }))
        .catch(() => setVendorMenu(null))
        .finally(() => setLoading(false));
      return;
    }
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (todaysMenu) qs.set("todaysMenu", "true");
    if (q) qs.set("q", q);
    api
      .get<FoodItem[]>(`/food/search?${qs.toString()}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [vendorId, category, todaysMenu, q]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {!vendorId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ((document.getElementById("menu-search") as HTMLInputElement).value);
          }}
          className="mb-6 flex gap-2"
        >
          <input
            id="menu-search"
            defaultValue={q}
            placeholder="Search for nyama choma, pilau, mandazi…"
            className="flex-1 border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
          />
          <button className="bg-marigold text-ink font-bold px-5 rounded-card hover:bg-marigoldDark transition-colors">
            Search
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-stone">Loading menu…</p>
      ) : vendorMenu ? (
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink mb-1">{vendorMenu.vendor.businessName}</h1>
          <p className="text-stone mb-6">{vendorMenu.vendor.description}</p>
          {vendorMenu.categories.length === 0 && <p className="text-stone">This kitchen hasn&apos;t added any items yet.</p>}
          {vendorMenu.categories.map((cat) => (
            <div key={cat.id} className="mb-8">
              <h2 className="font-display text-xl font-bold text-ink mb-3">{cat.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cat.foodItems?.map((item: FoodItem) => (
                  <FoodCard key={item.id} item={{ ...item, vendor: { id: vendorMenu.vendor.id, businessName: vendorMenu.vendor.businessName } }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-stone">No items found. Try a different search or category.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 text-stone">Loading…</div>}>
      <MenuContent />
    </Suspense>
  );
}
