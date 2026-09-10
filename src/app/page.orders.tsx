"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reorderingId, setReorderingId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/orders");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      api.get<Order[]>("/orders/mine").then(setOrders).finally(() => setLoading(false));
    }
  }, [user]);

  async function handleReorder(orderId: string) {
    setReorderingId(orderId);
    setError("");
    try {
      await api.post(`/orders/${orderId}/reorder`);
      router.push("/cart");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setReorderingId("");
    }
  }

  if (authLoading || loading) return <div className="max-w-3xl mx-auto px-4 py-12 text-stone">Loading your orders…</div>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Your orders</h1>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone mb-4">No orders yet.</p>
          <Link href="/menu" className="bg-marigold text-ink font-bold px-6 py-3 rounded-card hover:bg-marigoldDark transition-colors">
            Order something good
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border-2 border-ink/10 rounded-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Link href={`/orders/${o.id}`} className="font-display font-bold text-ink hover:text-chili">
                  {o.orderNumber}
                </Link>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="text-sm text-stone">{o.vendor.businessName} · {new Date(o.createdAt).toLocaleString()}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-chili">KES {Number(o.total).toLocaleString()}</span>
                <div className="flex gap-3">
                  <Link href={`/orders/${o.id}`} className="text-sm font-semibold text-ink hover:underline">Track</Link>
                  {["DELIVERED", "CANCELLED", "REJECTED", "EXPIRED"].includes(o.status) && (
                    <button onClick={() => handleReorder(o.id)} disabled={reorderingId === o.id} className="text-sm font-semibold text-chili hover:underline disabled:opacity-60">
                      {reorderingId === o.id ? "Adding…" : "Reorder"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
