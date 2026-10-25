"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { CheckoutSkeleton } from "@/components/Skeletons";
import type { Address, Order } from "@/types";

type Stage = "form" | "placing" | "awaiting-payment" | "success" | "failed";

const PAYMENT_FAILURE: Record<string, string> = {
  FAILED: "The payment didn't go through. Check your M-Pesa balance and PIN, then try again.",
  CANCELLED: "The M-Pesa prompt was cancelled on your phone.",
  TIMEOUT: "The M-Pesa prompt timed out before it was confirmed.",
};

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
  const [failureReason, setFailureReason] = useState("");
  // Tracks whether an order has actually been created this session. Once
  // true, the cart being empty is EXPECTED (checkout clears it server-side)
  // and must never again be treated as "nothing to check out".
  const [order, setOrder] = useState<Order | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }
  useEffect(() => stopPolling, []);

  // Every result screen (waiting / success / failed) starts at the top so it
  // can't be left hidden below the fold of a long form.
  useEffect(() => {
    if (stage !== "form" && stage !== "placing") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/checkout");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setPhone(user.phone);
      api
        .get<Address[]>("/users/me/addresses")
        .then((list) => {
          setAddresses(list);
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) setAddressId(def.id);
          else setShowNewAddress(true);
        })
        .catch((err) => setError(friendlyError(err)));
    }
  }, [user]);

  function captureLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewAddress((a) => ({ ...a, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("We couldn't read your location. Allow location access in your browser and try again.");
      }
    );
  }

  async function saveNewAddress() {
    if (!newAddress.latitude || !newAddress.longitude) {
      setError("Tap \"Use my current location\" so we know where to deliver.");
      return;
    }
    setError("");
    try {
      const created = await api.post<Address>("/users/me/addresses", { ...newAddress, isDefault: addresses.length === 0 });
      setAddresses((a) => [created, ...a]);
      setAddressId(created.id);
      setShowNewAddress(false);
    } catch (err) {
      setError(friendlyError(err));
    }
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
      // Order was never created (bad address, kitchen closed, item no longer
      // available, etc.) — the cart still has items, so stay on the form.
      setError(friendlyError(err));
      setStage("form");
      return;
    }

    // From here the order DEFINITELY EXISTS (PENDING_PAYMENT) and the cart
    // has been cleared server-side.
    setOrder(createdOrder);
    try {
      await refreshCart();
    } catch {
      /* cart badge will catch up on its own */
    }
    await startPayment(createdOrder.id);
  }

  // Sends the M-Pesa prompt, then watches for the result. Used for the first
  // attempt and for "Try again" on the failed screen.
  async function startPayment(orderId: string) {
    setFailureReason("");
    try {
      await api.post("/payments/mpesa/stk-push", { orderId, phone });
    } catch (err) {
      // The prompt couldn't even be sent (bad number, Daraja unreachable...).
      // Order is saved and payable — say so clearly and let them retry.
      setFailureReason(friendlyError(err));
      setStage("failed");
      return;
    }
    setStage("awaiting-payment");
    pollPaymentStatus(orderId);
  }

  function pollPaymentStatus(orderId: string) {
    stopPolling();
    const start = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const s = await api.get<{ status: string; orderStatus?: string }>(`/payments/mpesa/status/${orderId}`);
        if (s.status === "SUCCESS" || s.orderStatus === "PLACED") {
          stopPolling();
          setStage("success");
          return;
        }
        if (PAYMENT_FAILURE[s.status]) {
          stopPolling();
          setFailureReason(PAYMENT_FAILURE[s.status]);
          setStage("failed");
          return;
        }
      } catch {
        // transient — keep polling until the timeout below
      }
      if (Date.now() - start > 90_000) {
        stopPolling();
        setFailureReason("We didn't hear back from M-Pesa in time. If money left your account, check your order — it will update once confirmed.");
        setStage("failed");
      }
    }, 3000);
  }

  if (authLoading || cartLoading) return <CheckoutSkeleton />;
  if (!user) return null;

  const items = cart?.items ?? [];
  // An empty cart only means "nothing to check out" BEFORE an order exists.
  if (items.length === 0 && stage === "form" && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-stone">
        Your cart is empty. <br />
        <Link href="/menu" className="text-chili font-semibold hover:underline">Browse the menu</Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => {
    const variationTotal = i.variations.reduce((s, v) => s + Number(v.foodVariation.priceDelta), 0);
    return sum + (Number(i.foodItem.basePrice) + variationTotal) * i.quantity;
  }, 0);
  const orderTotal = order ? Number(order.total).toLocaleString() : "";

  if (stage === "awaiting-payment") {
    return (
      <div role="status" className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4 animate-pulse">📱</div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Check your phone</h1>
        <p className="text-stone break-words">
          We&apos;ve sent an M-Pesa prompt to <strong>{phone}</strong>. Enter your PIN to complete payment of{" "}
          <strong>KES {orderTotal}</strong>.
        </p>
        <p className="text-xs text-stone mt-4">This page will update automatically once payment is confirmed.</p>
        {order && (
          <Link href={`/orders/${order.id}`} className="inline-block mt-6 text-sm font-semibold text-chili hover:underline">
            View my order
          </Link>
        )}
      </div>
    );
  }

  if (stage === "success" && order) {
    return (
      <div role="status" className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sukuma/15 text-4xl text-sukuma">✓</div>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-2">Payment successful!</h1>
        <p className="text-stone">
          Order <strong className="text-ink break-all">{order.orderNumber}</strong> is confirmed. The kitchen has been notified and will start
          preparing it.
        </p>
        <p className="mt-3 font-display text-xl font-bold text-chili">KES {orderTotal}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push(`/orders/${order.id}`)}
            className="bg-marigold text-ink font-bold px-6 py-3 rounded-card hover:bg-marigoldDark transition-colors"
          >
            Track my order
          </button>
          <Link href="/menu" className="border-2 border-ink/10 text-ink font-semibold px-6 py-3 rounded-card hover:border-marigold transition-colors">
            Keep browsing
          </Link>
        </div>
      </div>
    );
  }

  if (stage === "failed" && order) {
    return (
      <div role="alert" className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-chili/10 text-4xl text-chili">✕</div>
        <h1 className="font-display text-2xl font-extrabold text-ink mb-2">Payment unsuccessful</h1>
        <p className="text-chili break-words">{failureReason || "Something went wrong with the payment."}</p>
        <p className="text-stone text-sm mt-3">
          Your order <strong className="text-ink break-all">{order.orderNumber}</strong> is saved — you won&apos;t lose it. Try again below
          or pay later from your orders.
        </p>

        <div className="mt-6 text-left">
          <label htmlFor="retry-phone" className="block text-xs font-semibold text-ink mb-1">M-Pesa phone number</label>
          <input
            id="retry-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={() => startPayment(order.id)}
            className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors"
          >
            Try payment again
          </button>
          <Link href={`/orders/${order.id}`} className="w-full border-2 border-ink/10 text-ink font-semibold py-3 rounded-card hover:border-marigold transition-colors">
            View my order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      {/* Full-screen feedback while the order is being created — fixed to the
          viewport so it is always visible, however far down the form is. */}
      {stage === "placing" && (
        <div role="status" aria-live="assertive" className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-marigold/30 border-t-marigold" />
            <p className="font-display text-lg font-bold text-ink">Placing your order…</p>
            <p className="mt-1 text-sm text-stone">Please keep this page open.</p>
          </div>
        </div>
      )}

      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Checkout</h1>

      <section className="mb-6">
        <h2 className="font-display font-bold text-ink mb-2">Delivery address</h2>
        <div className="space-y-2">
          {addresses.map((a) => (
            <label key={a.id} className={`flex gap-3 p-3 border-2 rounded-card cursor-pointer ${addressId === a.id ? "border-marigold" : "border-ink/10"}`}>
              <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
              <span className="min-w-0">
                <span className="font-semibold text-ink">{a.label}</span>
                <br />
                <span className="text-sm text-stone break-words">{[a.building, a.area, a.city].filter(Boolean).join(", ")}</span>
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
            <button type="button" onClick={captureLocation} className="text-sm font-semibold text-chili hover:underline">
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

      <p className="text-xs text-stone mb-2">Delivery fee (or free-delivery status) and any coupon discount are applied when you place the order.</p>

      {/* Sticky bar: total, any error, and the button stay on screen while the
          form scrolls, so feedback can never end up hidden below the fold. */}
      <div className="sticky bottom-0 -mx-4 border-t-2 border-ink/10 bg-cream/95 px-4 pb-4 pt-3 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-ink">Subtotal</span>
          <span className="font-display text-lg font-bold text-chili">KES {subtotal.toLocaleString()}</span>
        </div>
        {error && <p role="alert" className="mb-3 rounded-card bg-chili/10 px-3 py-2 text-sm text-chili break-words">{error}</p>}
        <button
          onClick={placeOrder}
          disabled={stage === "placing"}
          className="w-full bg-marigold text-ink font-bold py-4 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60"
        >
          {stage === "placing" ? "Placing order…" : "Place order & pay with M-Pesa"}
        </button>
      </div>
    </div>
  );
}
