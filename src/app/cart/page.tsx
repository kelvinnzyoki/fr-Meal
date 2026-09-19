"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/cart");
  }, [authLoading, user, router]);

  if (authLoading || loading) return <div className="max-w-3xl mx-auto px-4 py-12 text-stone">Loading your cart…</div>;
  if (!user) return null;

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, i) => {
    const variationTotal = i.variations.reduce((s, v) => s + Number(v.foodVariation.priceDelta), 0);
    return sum + (Number(i.foodItem.basePrice) + variationTotal) * i.quantity;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Your cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone mb-4">Your cart is empty.</p>
          <Link href="/menu" className="bg-marigold text-ink font-bold px-6 py-3 rounded-card hover:bg-marigoldDark transition-colors">
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-stone mb-4">{items[0].foodItem.vendor?.businessName}</p>
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i.id} className="flex gap-4 bg-white border-2 border-ink/10 rounded-card p-4">
                <div className="w-16 h-16 bg-stone/20 rounded-card flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-ink truncate">{i.foodItem.name}</h3>
                  {i.variations.length > 0 && (
                    <p className="text-xs text-stone truncate">{i.variations.map((v) => v.foodVariation.name).join(", ")}</p>
                  )}
                  {i.notes && <p className="text-xs text-stone italic truncate">&quot;{i.notes}&quot;</p>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border-2 border-ink/10 rounded-card">
                      <button onClick={() => updateQuantity(i.id, Math.max(1, i.quantity - 1))} className="px-3 py-1 font-bold">−</button>
                      <span className="px-2 font-semibold text-sm">{i.quantity}</span>
                      <button onClick={() => updateQuantity(i.id, i.quantity + 1)} className="px-3 py-1 font-bold">+</button>
                    </div>
                    <button onClick={() => removeItem(i.id)} className="text-chili text-sm font-semibold hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t-2 border-ink/10 pt-4 flex items-center justify-between">
            <span className="font-display text-xl font-bold text-ink">Subtotal</span>
            <span className="font-display text-xl font-bold text-chili">KES {subtotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-stone mt-1">Delivery fee and any discounts are calculated at checkout.</p>

          <Link
            href="/checkout"
            className="mt-6 block text-center bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors"
          >
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  );
}
