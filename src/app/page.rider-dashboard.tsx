"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";
import type { Order } from "@/types";

type Tab = "available" | "history" | "earnings";

interface AvailableOrder extends Order {
  suggestedBatchOrderIds: string[];
}

function AvailableTab() {
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  function load() {
    api.get<AvailableOrder[]>("/delivery/available").then(setOrders);
    api.get<{ isAvailable: boolean }>("/riders/me").then((r) => setIsAvailable(r.isAvailable));
  }
  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function toggleAvailable() {
    const next = !isAvailable;
    await api.patch("/riders/me", { isAvailable: next });
    setIsAvailable(next);
  }

  async function accept(orderId: string, includeBatch: boolean) {
    setBusyId(orderId);
    setError("");
    try {
      await api.post(`/delivery/${orderId}/accept`, { includeBatch });
      load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <div className="bg-white border-2 border-ink/10 rounded-card p-4 mb-4 flex items-center justify-between">
        <span className="font-semibold text-ink">You're currently {isAvailable ? "online" : "offline"}</span>
        <button onClick={toggleAvailable} className={`px-4 py-2 rounded-card text-sm font-bold ${isAvailable ? "bg-sukuma/15 text-sukuma" : "bg-chili/10 text-chili"}`}>
          {isAvailable ? "Go offline" : "Go online"}
        </button>
      </div>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}
      {orders.length === 0 ? (
        <p className="text-stone">No deliveries ready for pickup right now.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border-2 border-ink/10 rounded-card p-4">
              <p className="font-display font-bold text-ink">{o.orderNumber} — {o.vendor.businessName}</p>
              <p className="text-sm text-stone mb-2">
                {o.address ? [o.address.building, o.address.area].filter(Boolean).join(", ") : "Address on file"}
              </p>
              <p className="text-sm font-semibold text-chili mb-3">Delivery fee: KES {Number(o.deliveryFee).toLocaleString()}</p>
              <div className="flex gap-2">
                <button onClick={() => accept(o.id, false)} disabled={busyId === o.id} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60 text-sm">
                  Accept
                </button>
                {o.suggestedBatchOrderIds?.length > 0 && (
                  <button onClick={() => accept(o.id, true)} disabled={busyId === o.id} className="border-2 border-ink/10 font-semibold px-4 py-2 rounded-card text-sm hover:border-marigold transition-colors">
                    Accept with {o.suggestedBatchOrderIds.length} nearby order{o.suggestedBatchOrderIds.length > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTab() {
  interface DeliveryRecord {
    id: string;
    orderId: string;
    status: string;
    riderEarnings: number;
    order: { orderNumber: string; vendor: { businessName: string }; address: { building: string | null; area: string | null } | null };
  }
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [busyId, setBusyId] = useState("");

  function load() {
    api.get<DeliveryRecord[]>("/riders/me/deliveries").then(setDeliveries);
  }
  useEffect(load, []);

  async function advance(orderId: string, deliveryRowId: string, action: "picked-up" | "delivered") {
    setBusyId(deliveryRowId);
    try {
      await api.patch(`/delivery/${orderId}/${action}`, {});
      load();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-3">
      {deliveries.length === 0 ? (
        <p className="text-stone">No deliveries yet.</p>
      ) : (
        deliveries.map((d) => (
          <div key={d.id} className="bg-white border-2 border-ink/10 rounded-card p-4">
            <p className="font-display font-bold text-ink">{d.order.orderNumber} — {d.order.vendor.businessName}</p>
            <p className="text-sm text-stone">{d.status.replace(/_/g, " ")}</p>
            <p className="text-sm font-semibold text-chili">Earnings: KES {Number(d.riderEarnings).toLocaleString()}</p>
            {d.status === "ASSIGNED" && (
              <button onClick={() => advance(d.orderId, d.id, "picked-up")} disabled={busyId === d.id} className="mt-2 bg-marigold text-ink font-bold px-4 py-1.5 rounded-card text-sm">
                Mark picked up
              </button>
            )}
            {d.status === "PICKED_UP" && (
              <button onClick={() => advance(d.orderId, d.id, "delivered")} disabled={busyId === d.id} className="mt-2 bg-sukuma text-cream font-bold px-4 py-1.5 rounded-card text-sm">
                Mark delivered
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function EarningsTab() {
  const [summary, setSummary] = useState<{ totalEarnings: number; completedDeliveries: number } | null>(null);
  useEffect(() => {
    api.get<{ totalEarnings: number; completedDeliveries: number }>("/riders/me/earnings").then(setSummary);
  }, []);
  if (!summary) return <p className="text-stone">Loading…</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border-2 border-ink/10 rounded-card p-4 text-center">
        <p className="text-xs text-stone font-semibold uppercase">Total earnings</p>
        <p className="font-display text-xl font-bold text-sukuma mt-1">KES {summary.totalEarnings.toLocaleString()}</p>
      </div>
      <div className="bg-white border-2 border-ink/10 rounded-card p-4 text-center">
        <p className="text-xs text-stone font-semibold uppercase">Completed deliveries</p>
        <p className="font-display text-xl font-bold text-ink mt-1">{summary.completedDeliveries}</p>
      </div>
    </div>
  );
}

function RiderDashboardContent() {
  const [tab, setTab] = useState<Tab>("available");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Rider dashboard</h1>
      <div className="flex gap-2 mb-6">
        {(["available", "history", "earnings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${tab === t ? "bg-ink text-cream" : "bg-white border-2 border-ink/10 text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "available" && <AvailableTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "earnings" && <EarningsTab />}
    </div>
  );
}

export default function RiderDashboardPage() {
  return (
    <Protected role="RIDER">
      <RiderDashboardContent />
    </Protected>
  );
}
