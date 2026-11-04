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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2 break-words">
        Food item images
      </h1>
      <p className="text-stone text-sm mb-5 sm:mb-6">
        Assign a photo from the preset gallery to any food item, across every vendor.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex flex-col sm:flex-row gap-2 mb-5 sm:mb-6"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by food item name…"
          className="w-full min-w-0 sm:flex-1 border-2 border-ink/10 rounded-card px-4 py-2.5 focus-ring"
        />
        <button className="w-full sm:w-auto bg-marigold text-ink font-bold px-5 py-2.5 rounded-card hover:bg-marigoldDark transition-colors">
          Search
        </button>
      </form>

      {error && <p className="text-chili text-sm mb-4 break-words">{error}</p>}

      {loading ? (
        <p className="text-stone">Loading food items…</p>
      ) : items.length === 0 ? (
        <p className="text-stone">No food items match.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white border-2 border-ink/10 rounded-card p-3"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 sm:flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-card bg-stone/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
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
              </div>

              <select
                value={item.imageUrl ?? ""}
                onChange={(e) => setImage(item.id, e.target.value)}
                disabled={savingId === item.id}
                className="w-full sm:w-44 sm:flex-shrink-0 min-w-0 border-2 border-ink/10 rounded-card px-3 py-2 text-sm focus-ring disabled:opacity-60"
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
