"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { friendlyError } from "@/lib/auth";
import type { FoodItem } from "@/types";

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [item, setItem] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, string>>({}); // groupName -> variationId (single-select per group, simplified)
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api
      .get<FoodItem>(`/food/items/${id}`)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const groups = useMemo(() => {
    if (!item) return {};
    return item.variations.reduce<Record<string, typeof item.variations>>((acc, v) => {
      acc[v.groupName] = [...(acc[v.groupName] ?? []), v];
      return acc;
    }, {});
  }, [item]);

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    const variationTotal = Object.values(selected).reduce((sum, variationId) => {
      const v = item.variations.find((x) => x.id === variationId);
      return sum + (v ? Number(v.priceDelta) : 0);
    }, 0);
    return (Number(item.basePrice) + variationTotal) * quantity;
  }, [item, selected, quantity]);

  async function handleAddToCart() {
    if (!item) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const missingRequired = Object.entries(groups).find(([, opts]) => opts.some((o) => o.isRequired) && !selected[opts[0].groupName]);
    if (missingRequired) {
      setError(`Please choose a ${missingRequired[0]} option`);
      return;
    }
    setAdding(true);
    setError("");
    try {
      await addItem({ foodItemId: item.id, quantity, notes: notes || undefined, variationIds: Object.values(selected) });
      router.push("/cart");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12 text-stone">Loading…</div>;
  if (!item) return <div className="max-w-3xl mx-auto px-4 py-12 text-stone">Item not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="aspect-[16/9] bg-stone/20 rounded-card overflow-hidden mb-6 flex items-center justify-center text-6xl">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          "🍽️"
        )}
      </div>

      {item.vendor && <p className="text-sm font-semibold text-stone">{item.vendor.businessName}</p>}
      <h1 className="font-display text-3xl font-extrabold text-ink mt-1">{item.name}</h1>
      {item.description && <p className="text-stone mt-2">{item.description}</p>}
      <p className="text-chili font-bold text-xl mt-3">KES {Number(item.basePrice).toLocaleString()}</p>

      {Object.entries(groups).map(([groupName, options]) => (
        <div key={groupName} className="mt-6">
          <h3 className="font-display font-bold text-ink mb-2">
            {groupName} {options.some((o) => o.isRequired) && <span className="text-chili text-sm">· required</span>}
          </h3>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelected((s) => ({ ...s, [groupName]: opt.id }))}
                className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                  selected[groupName] === opt.id ? "bg-marigold border-marigold text-ink" : "border-ink/10 hover:border-marigold"
                }`}
              >
                {opt.name} {Number(opt.priceDelta) > 0 && `+KES ${opt.priceDelta}`}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6">
        <h3 className="font-display font-bold text-ink mb-2">Special instructions</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. no chili, extra sauce"
          className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
          rows={2}
        />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center border-2 border-ink/10 rounded-card">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-2 font-bold text-lg">−</button>
          <span className="px-3 font-semibold">{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)} className="px-4 py-2 font-bold text-lg">+</button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="flex-1 bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60"
        >
          {adding ? "Adding…" : `Add to cart — KES ${totalPrice.toLocaleString()}`}
        </button>
      </div>
      {error && <p className="text-chili text-sm mt-3">{error}</p>}
    </div>
  );
}
