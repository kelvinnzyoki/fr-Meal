"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import type { Address, Order } from "@/types";

type Stage = "form" | "placing" | "awaiting-payment";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", building: "", area: "", landmark: "", latitude: 0, longitude: 0 });
  const [locating, setLocating] = useState(false);

  const [phone, setPhone] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");
  // Tracks whether an order has actually been created this session. Once
  // true, the cart being empty is EXPECTED (checkout clears it server-side)
  // and must never again be treated as "nothing to check out" — that mix-up
  // was the root cause of the "sent to an empty cart" bug.
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/checkout");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setPhone(user.phone);
      api.get<Address[]>("/users/me/addresses").then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setAddressId(def.id);
        else setShowNewAddress(true);
      });
    }
  }, [user]);

  function useCurrentLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewAddress((a) => ({ ...a, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  async function saveNewAddress() {
    if (!newAddress.latitude || !newAddress.longitude) {
      setError("Tap \"Use my current location\" so we know where to deliver.");
      return;
    }
    const created = await api.post<Address>("/users/me/addresses", { ...newAddress, isDefault: addresses.length === 0 });
    setAddresses((a) => [created, ...a]);
    setAddressId(created.id);
    setShowNewAddress(false);
  }

  async function placeOrder() {
    if (!addressId) {
      setError("Choose or add a delivery address first.");
      return;
    }
    setError("");
    setStage("placing");

    let createdOrder: Order;
    try {
      createdOrder = await api.post<Order>("/orders/checkout", {
        addressId,
        couponCode: couponCode || undefined,
        specialInstructions: specialInstructions || undefined,
        recipientName: forSomeoneElse ? recipientName : undefined,
        recipientPhone: forSomeoneElse ? recipientPhone : undefined,
      });
    } catch (err) {
      // Order was never created (bad address, kitchen closed, item no
      // longer available, etc.) — the cart still has items, so staying on
      // this page and letting them fix it is correct.
      setError(friendlyError(err));
      setStage("form");
      return;
    }

    // Past this point the order DEFINITELY EXISTS (status PENDING_PAYMENT)
    // and the cart has already been cleared server-side. There is no
    // remaining scenario where "your cart is empty, browse the menu" is
    // the right thing to show — from here on we always end up on a screen
    // that shows this real order.
    setOrder(createdOrder);
    await refreshCart();

    try {
      await api.post("/payments/mpesa/stk-push", { orderId: createdOrder.id, phone });
      setStage("awaiting-payment");
      pollPaymentStatus(createdOrder.id);
    } catch (err) {
      // STK push failed to even initiate (M-Pesa not configured yet, phone
      // number malformed, Daraja unreachable, etc.). The order is still
      // valid and payable — send them to the order page to see it and
      // retry payment from there, instead of trapping them here on a form
      // whose cart the checkout call already (correctly) emptied.
      router.push(`/orders/${createdOrder.id}?paymentError=${encodeURIComponent(friendlyError(err))}`);
    }
  }

  function pollPaymentStatus(orderId: string) {
    const start = Date.now();
    const interval = setInterval(async () => {
      try {
        const status = await api.get<{ status: string; orderStatus?: string }>(`/payments/mpesa/status/${orderId}`);
        if (status.status === "SUCCESS" || status.orderStatus === "PLACED") {
          clearInterval(interval);
          router.push(`/orders/${orderId}`);
        } else if (["FAILED", "CANCELLED", "TIMEOUT"].includes(status.status)) {
          clearInterval(interval);
          // Same principle as above: the order exists, send them to it
          // rather than showing an in-place "failed" screen on checkout.
          router.push(`/orders/${orderId}?paymentError=${encodeURIComponent("Payment was cancelled or timed out.")}`);
        } else if (Date.now() - start > 90_000) {
          clearInterval(interval);
          router.push(
            `/orders/${orderId}?paymentError=${encodeURIComponent(
              "We didn't hear back from M-Pesa in time. You can retry payment from here."
            )}`
          );
        }
      } catch {
        // transient — keep polling until the timeout above
      }
    }, 3000);
  }

  if (authLoading || cartLoading) return <div className="max-w-2xl mx-auto px-4 py-12 text-stone">Loading…</div>;
  if (!user) return null;

  const items = cart?.items ?? [];
  // The `!order` guard is the actual fix: an empty cart only means "nothing
  // to check out" BEFORE an order has been created. After that, an empty
  // cart is expected and must not trigger this screen.
  if (items.length === 0 && stage === "form" && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-stone">
        Your cart is empty. <br />
        <a href="/menu" className="text-chili font-semibold hover:underline">Browse the menu</a>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => {
    const variationTotal = i.variations.reduce((s, v) => s + Number(v.foodVariation.priceDelta), 0);
    return sum + (Number(i.foodItem.basePrice) + variationTotal) * i.quantity;
  }, 0);

  if (stage === "awaiting-payment") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4 animate-pulse">📱</div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Check your phone</h1>
        <p className="text-stone">
          We&apos;ve sent an M-Pesa prompt to <strong>{phone}</strong>. Enter your PIN to complete payment of{" "}
          <strong>KES {order?.total?.toLocaleString()}</strong>.
        </p>
        <p className="text-xs text-stone mt-4">This page will update automatically once payment is confirmed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Checkout</h1>

      <section className="mb-6">
        <h2 className="font-display font-bold text-ink mb-2">Delivery address</h2>
        <div className="space-y-2">
          {addresses.map((a) => (
            <label key={a.id} className={`flex gap-3 p-3 border-2 rounded-card cursor-pointer ${addressId === a.id ? "border-marigold" : "border-ink/10"}`}>
              <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
              <span>
                <span className="font-semibold text-ink">{a.label}</span>
                <br />
                <span className="text-sm text-stone">{[a.building, a.area, a.city].filter(Boolean).join(", ")}</span>
              </span>
            </label>
          ))}
        </div>

        {!showNewAddress ? (
          <button onClick={() => setShowNewAddress(true)} className="mt-2 text-sm font-semibold text-chili hover:underline">
            + Add a new address
          </button>
        ) : (
          <div className="mt-3 p-4 border-2 border-ink/10 rounded-card space-y-3">
            <input placeholder="Label (e.g. Home, Office)" value={newAddress.label} onChange={(e) => setNewAddress((a) => ({ ...a, label: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
            <input placeholder="Building / house no." value={newAddress.building} onChange={(e) => setNewAddress((a) => ({ ...a, building: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
            <input placeholder="Area (e.g. Kilimani)" value={newAddress.area} onChange={(e) => setNewAddress((a) => ({ ...a, area: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
            <input placeholder="Landmark (optional)" value={newAddress.landmark} onChange={(e) => setNewAddress((a) => ({ ...a, landmark: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
            <button type="button" onClick={useCurrentLocation} className="text-sm font-semibold text-chili hover:underline">
              {locating ? "Locating…" : newAddress.latitude ? "✓ Location captured" : "📍 Use my current location"}
            </button>
            <div className="flex gap-2">
              <button onClick={saveNewAddress} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors">
                Save address
              </button>
              <button onClick={() => setShowNewAddress(false)} className="text-stone font-semibold px-4 py-2">Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-display font-bold text-ink mb-2">M-Pesa phone number</h2>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
      </section>

      <section className="mb-6">
        <label className="flex items-center gap-2 font-semibold text-ink cursor-pointer">
          <input type="checkbox" checked={forSomeoneElse} onChange={(e) => setForSomeoneElse(e.target.checked)} />
          Order for someone else
        </label>
        {forSomeoneElse && (
          <div className="mt-3 space-y-2">
            <input placeholder="Recipient's name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
            <input placeholder="Recipient's phone" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-display font-bold text-ink mb-2">Coupon code</h2>
        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Optional" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
      </section>

      <section className="mb-6">
        <h2 className="font-display font-bold text-ink mb-2">Special instructions</h2>
        <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={2} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
      </section>

      <div className="border-t-2 border-ink/10 pt-4 mb-4 flex items-center justify-between">
        <span className="font-display text-xl font-bold text-ink">Subtotal</span>
        <span className="font-display text-xl font-bold text-chili">KES {subtotal.toLocaleString()}</span>
      </div>
      <p className="text-xs text-stone mb-4">Delivery fee (or free-delivery status) and any coupon discount are applied when you place the order.</p>

      {error && <p className="text-chili text-sm mb-3">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={stage === "placing"}
        className="w-full bg-marigold text-ink font-bold py-4 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60"
      >
        {stage === "placing" ? "Placing order…" : "Place order & pay with M-Pesa"}
      </button>
    </div>
  );
}
