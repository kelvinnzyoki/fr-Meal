"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderDetailSkeleton } from "@/components/Skeletons";
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

const PAYMENT_FAILURE: Record<string, string> = {
  FAILED: "The payment didn't go through. Check your M-Pesa balance and PIN, then try again.",
  CANCELLED: "The M-Pesa prompt was cancelled on your phone. You can send a new one below.",
  TIMEOUT: "The M-Pesa prompt timed out before it was confirmed. You can send a new one below.",
};

type PayStage = "idle" | "sending" | "waiting";
type Notice = { kind: "error" | "info"; text: string } | null;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentError = searchParams.get("paymentError");
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  // Payment retry — all feedback lives INSIDE the payment box (not at the
  // bottom of the page where it used to get lost below the fold).
  const [payPhone, setPayPhone] = useState("");
  const [payStage, setPayStage] = useState<PayStage>("idle");
  const [payNotice, setPayNotice] = useState<Notice>(paymentError ? { kind: "error", text: paymentError } : null);
  const [justPaid, setJustPaid] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const payPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPayPolling() {
    if (payPollRef.current) {
      clearInterval(payPollRef.current);
      payPollRef.current = null;
    }
  }
  useEffect(() => stopPayPolling, []);

  // Pre-fill the phone box once the user is known (they can change it).
  useEffect(() => {
    if (user) setPayPhone((p) => p || user.phone || "");
  }, [user]);

  // Ticks the resend cooldown down once a second.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

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
      } catch {
        // transient — the next poll will try again
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

  // After a prompt is sent, watch the payment so the person sees the result
  // straight away (paid / cancelled / timed out) instead of guessing.
  function pollPayment(orderId: string) {
    stopPayPolling();
    const start = Date.now();
    payPollRef.current = setInterval(async () => {
      try {
        const s = await api.get<{ status: string; orderStatus?: string }>(`/payments/mpesa/status/${orderId}`);
        if (s.status === "SUCCESS" || (s.orderStatus && s.orderStatus !== "PENDING_PAYMENT")) {
          stopPayPolling();
          setPayStage("idle");
          setPayNotice(null);
          setJustPaid(true);
          try {
            setOrder(await api.get<Order>(`/orders/${orderId}`));
          } catch {
            /* the regular poll will refresh it */
          }
          return;
        }
        if (PAYMENT_FAILURE[s.status]) {
          stopPayPolling();
          setPayStage("idle");
          setPayNotice({ kind: "error", text: PAYMENT_FAILURE[s.status] });
          return;
        }
      } catch {
        // transient — keep polling until the timeout below
      }
      if (Date.now() - start > 90_000) {
        stopPayPolling();
        setPayStage("idle");
        setPayNotice({
          kind: "error",
          text: "We didn't hear back from M-Pesa in time. If money left your account it will show here shortly; otherwise send a new prompt.",
        });
      }
    }, 3000);
  }

  async function retryPayment() {
    if (!order) return;
    const phone = payPhone.trim();
    if (!phone) {
      setPayNotice({ kind: "error", text: "Enter the M-Pesa phone number to send the prompt to." });
      return;
    }
    stopPayPolling();
    setPayStage("sending");
    setPayNotice(null);
    setJustPaid(false);
    try {
      await api.post("/payments/mpesa/stk-push", { orderId: order.id, phone });
    } catch (err) {
      setPayStage("idle");
      setPayNotice({ kind: "error", text: friendlyError(err) });
      return;
    }
    setPayStage("waiting");
    setResendCooldown(30);
    setPayNotice({ kind: "info", text: `M-Pesa prompt sent to ${phone}. Enter your PIN on your phone to complete payment.` });
    pollPayment(order.id);
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

  if (authLoading || loading) return <OrderDetailSkeleton />;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-12 text-stone">Order not found.</div>;

  const currentIndex = TIMELINE.findIndex((t) => t.status === order.status);
  const isTerminalBad = ["CANCELLED", "REJECTED", "EXPIRED"].includes(order.status);
  const payBusy = payStage !== "idle";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="font-display text-2xl font-extrabold text-ink break-words min-w-0">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-stone mb-6">{order.vendor.businessName}</p>

      {justPaid && order.status !== "PENDING_PAYMENT" && (
        <div role="status" className="bg-sukuma/10 border-2 border-sukuma/40 rounded-card p-4 mb-6 flex items-start gap-3">
          <span className="text-xl leading-none">✅</span>
          <div>
            <p className="font-semibold text-ink">Payment received</p>
            <p className="text-sm text-stone">Your order has been placed and the kitchen has been notified.</p>
          </div>
        </div>
      )}

      {order.status === "PENDING_PAYMENT" && (
        <div className="bg-marigold/10 border-2 border-marigold rounded-card p-4 mb-6">
          <p className="font-semibold text-ink mb-3">This order is awaiting M-Pesa payment.</p>

          {payNotice && (
            <p
              role={payNotice.kind === "error" ? "alert" : "status"}
              className={`text-sm mb-3 break-words rounded-card px-3 py-2 ${
                payNotice.kind === "error" ? "bg-chili/10 text-chili" : "bg-sukuma/10 text-sukuma"
              }`}
            >
              {payNotice.text}
            </p>
          )}

          <label htmlFor="pay-phone" className="block text-xs font-semibold text-ink mb-1">
            M-Pesa phone number
          </label>
          <input
            id="pay-phone"
            type="tel"
            inputMode="tel"
            value={payPhone}
            onChange={(e) => setPayPhone(e.target.value)}
            disabled={payBusy}
            placeholder="07XXXXXXXX"
            className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring bg-white disabled:opacity-60"
          />

          <button
            onClick={retryPayment}
            disabled={payBusy || resendCooldown > 0}
            className="w-full sm:w-auto bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60 mt-3"
          >
            {payStage === "sending"
              ? "Sending…"
              : payStage === "waiting"
                ? "Waiting for payment…"
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend M-Pesa prompt"}
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
          <div key={i.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm py-1">
            <span className="min-w-0 break-words">{i.quantity}× {i.nameSnapshot}</span>
            <span className="flex-shrink-0">KES {Number(i.lineTotal).toLocaleString()}</span>
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
          <button onClick={submitReview} disabled={busy} className="w-full sm:w-auto bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
            Submit review
          </button>
        </div>
      )}
      {reviewed && <p className="text-sukuma font-semibold mt-4">Thanks for your review!</p>}

      {error && <p role="alert" className="text-chili text-sm mt-3 break-words">{error}</p>}
    </div>
  );
}
