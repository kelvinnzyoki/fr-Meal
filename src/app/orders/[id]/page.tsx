"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Order } from "@/types";

const TIMELINE: { status: Order["status"]; label: string }[] = [
  { status: "PLACED", label: "Order placed" },
  { status: "ACCEPTED", label: "Kitchen accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY_FOR_PICKUP", label: "Ready for pickup" },
  { status: "ASSIGNED", label: "Rider assigned" },
  { status: "PICKED_UP", label: "On the way" },
  { status: "DELIVERED", label: "Delivered" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=/orders/${id}`);
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const o = await api.get<Order>(`/orders/${id}`);
        if (!cancelled) setOrder(o);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 8000); // light polling so status updates without a manual refresh
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, user]);

  async function retryPayment() {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/payments/mpesa/stk-push", { orderId: order.id, phone: user!.phone });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      const updated = await api.post<Order>(`/orders/${order.id}/cancel`, {});
      setOrder(updated);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/reviews", { orderId: order.id, rating, comment: comment || undefined });
      setReviewed(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || loading) return <div className="max-w-2xl mx-auto px-4 py-12 text-stone">Loading order…</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-12 text-stone">Order not found.</div>;

  const currentIndex = TIMELINE.findIndex((t) => t.status === order.status);
  const isTerminalBad = ["CANCELLED", "REJECTED", "EXPIRED"].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl font-extrabold text-ink">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-stone mb-6">{order.vendor.businessName}</p>

      {order.status === "PENDING_PAYMENT" && (
        <div className="bg-marigold/10 border-2 border-marigold rounded-card p-4 mb-6">
          <p className="font-semibold text-ink mb-3">This order is awaiting M-Pesa payment.</p>
          <button onClick={retryPayment} disabled={busy} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
            {busy ? "Sending…" : "Resend M-Pesa prompt"}
          </button>
        </div>
      )}

      {isTerminalBad ? (
        <div className="bg-chili/10 border-2 border-chili/30 rounded-card p-4 mb-6">
          <p className="font-semibold text-chili">
            {order.status === "CANCELLED" && "This order was cancelled."}
            {order.status === "REJECTED" && "The kitchen couldn't accept this order — a refund will be processed."}
            {order.status === "EXPIRED" && "This order's payment window expired."}
          </p>
        </div>
      ) : (
        <ol className="mb-8">
          {TIMELINE.map((step, idx) => {
            const done = currentIndex >= 0 && idx <= currentIndex;
            return (
              <li key={step.status} className="flex items-center gap-3 pb-4 last:pb-0">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${done ? "bg-sukuma" : "bg-stone/30"}`} />
                <span className={`text-sm font-semibold ${done ? "text-ink" : "text-stone"}`}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {order.delivery?.rider && (
        <div className="bg-white border-2 border-ink/10 rounded-card p-4 mb-6">
          <p className="text-sm font-semibold text-ink">Your rider</p>
          <p className="text-stone text-sm">{order.delivery.rider.user.fullName} · {order.delivery.rider.user.phone}</p>
        </div>
      )}

      <div className="bg-white border-2 border-ink/10 rounded-card p-4 mb-6">
        <h2 className="font-display font-bold text-ink mb-3">Order summary</h2>
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm py-1">
            <span>{i.quantity}× {i.nameSnapshot}</span>
            <span>KES {Number(i.lineTotal).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-ink/10 mt-2 pt-2 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>KES {Number(order.subtotal).toLocaleString()}</span></div>
          {Number(order.discountTotal) > 0 && <div className="flex justify-between text-sukuma"><span>Discount</span><span>−KES {Number(order.discountTotal).toLocaleString()}</span></div>}
          <div className="flex justify-between"><span>Delivery</span><span>{Number(order.deliveryFee) === 0 ? "Free" : `KES ${Number(order.deliveryFee).toLocaleString()}`}</span></div>
          <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="text-chili">KES {Number(order.total).toLocaleString()}</span></div>
        </div>
      </div>

      {order.status === "PLACED" && (
        <button onClick={cancelOrder} disabled={busy} className="text-chili font-semibold text-sm hover:underline disabled:opacity-60">
          Cancel this order
        </button>
      )}

      {order.status === "DELIVERED" && !reviewed && (
        <div className="bg-white border-2 border-ink/10 rounded-card p-4 mt-4">
          <h2 className="font-display font-bold text-ink mb-3">Rate this order</h2>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "opacity-100" : "opacity-30"}`}>★</button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring mb-3" rows={2} />
          <button onClick={submitReview} disabled={busy} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
            Submit review
          </button>
        </div>
      )}
      {reviewed && <p className="text-sukuma font-semibold mt-4">Thanks for your review!</p>}

      {error && <p className="text-chili text-sm mt-3">{error}</p>}
    </div>
  );
}
