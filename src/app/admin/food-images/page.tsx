"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";
import { FOOD_IMAGE_OPTIONS } from "@/lib/foodImages";

interface AdminFoodItem {
  id: string;
  name: string;
  imageUrl: string | null;
  vendor: { id: string; businessName: string };
  category: { id: string; name: string };
}

function FoodImagesAdminContent() {
  const [items, setItems] = useState<AdminFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function load(query = "") {
    setLoading(true);
    setError("");
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : "";
      const list = await api.get<AdminFoodItem[]>(`/admin/food-items${qs}`);
      setItems(list);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setImage(id: string, imageUrl: string) {
    setSavingId(id);
    setError("");
    try {
      const updated = await api.patch<AdminFoodItem>(`/admin/food-items/${id}/image`, {
        imageUrl: imageUrl || null,
      });
      setItems((list) => list.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-2">Food item images</h1>
      <p className="text-stone text-sm mb-6">
        Assign a photo from the preset gallery to any food item, across every vendor.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2 mb-6"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by food item name…"
          className="flex-1 border-2 border-ink/10 rounded-card px-4 py-2.5 focus-ring"
        />
        <button className="bg-marigold text-ink font-bold px-4 rounded-card hover:bg-marigoldDark transition-colors">
          Search
        </button>
      </form>

      {error && <p className="text-chili text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-stone">Loading food items…</p>
      ) : items.length === 0 ? (
        <p className="text-stone">No food items match.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white border-2 border-ink/10 rounded-card p-3">
              <div className="w-16 h-16 rounded-card bg-stone/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🍽️</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink truncate">{item.name}</p>
                <p className="text-xs text-stone truncate">
                  {item.vendor.businessName} · {item.category.name}
                </p>
              </div>

              <select
                value={item.imageUrl ?? ""}
                onChange={(e) => setImage(item.id, e.target.value)}
                disabled={savingId === item.id}
                className="border-2 border-ink/10 rounded-card px-3 py-2 text-sm focus-ring flex-shrink-0 max-w-[160px] disabled:opacity-60"
              >
                <option value="">No image</option>
                {FOOD_IMAGE_OPTIONS.map((opt) => (
                  <option key={opt.path} value={opt.path}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminFoodImagesPage() {
  return (
    <Protected role="ADMIN">
      <FoodImagesAdminContent />
    </Protected>
  );
}
