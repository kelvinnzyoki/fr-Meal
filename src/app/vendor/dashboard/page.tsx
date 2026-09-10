"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Order, FoodCategory, FoodItem } from "@/types";

type Tab = "orders" | "menu" | "earnings";

function VendorOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.get<Order[]>("/orders/vendor/mine").then(setOrders);
  }
  useEffect(load, []);

  async function updateStatus(orderId: string, status: string) {
    setBusyId(orderId);
    setError("");
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId("");
    }
  }

  const NEXT_ACTION: Record<string, { label: string; status: string }[]> = {
    PLACED: [{ label: "Accept", status: "ACCEPTED" }, { label: "Reject", status: "REJECTED" }],
    ACCEPTED: [{ label: "Start preparing", status: "PREPARING" }],
    PREPARING: [{ label: "Mark ready for pickup", status: "READY_FOR_PICKUP" }],
  };

  return (
    <div>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}
      {orders.length === 0 ? (
        <p className="text-stone">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border-2 border-ink/10 rounded-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-bold text-ink">{o.orderNumber}</span>
                <OrderStatusBadge status={o.status} />
              </div>
              <ul className="text-sm text-stone mb-2">
                {o.items.map((i) => (
                  <li key={i.id}>{i.quantity}× {i.nameSnapshot}</li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-chili mb-2">KES {Number(o.total).toLocaleString()}</p>
              <div className="flex gap-2">
                {(NEXT_ACTION[o.status] ?? []).map((action) => (
                  <button
                    key={action.status}
                    onClick={() => updateStatus(o.id, action.status)}
                    disabled={busyId === o.id}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-card transition-colors disabled:opacity-60 ${
                      action.status === "REJECTED" ? "bg-chili/10 text-chili" : "bg-marigold text-ink hover:bg-marigoldDark"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VendorMenuTab() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newItem, setNewItem] = useState({ categoryId: "", name: "", basePrice: "", description: "" });
  const [error, setError] = useState("");

  function load() {
    api.get<FoodCategory[]>("/food/categories/mine").then(setCategories);
    api.get<FoodItem[]>("/food/items/mine/all").then(setItems);
  }
  useEffect(load, []);

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      await api.post("/food/categories", { name: newCategory });
      setNewCategory("");
      load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function addItem() {
    if (!newItem.categoryId || !newItem.name || !newItem.basePrice) {
      setError("Pick a category, then fill in a name and price.");
      return;
    }
    try {
      await api.post("/food/items", { ...newItem, basePrice: Number(newItem.basePrice) });
      setNewItem({ categoryId: newItem.categoryId, name: "", basePrice: "", description: "" });
      load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function toggleAvailability(item: FoodItem) {
    await api.patch(`/food/items/${item.id}`, { isAvailable: !item.isAvailable });
    load();
  }

  async function toggleTodaysMenu(item: FoodItem) {
    await api.patch(`/food/items/${item.id}`, { isTodaysMenu: !item.isTodaysMenu });
    load();
  }

  return (
    <div>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}

      <div className="bg-white border-2 border-ink/10 rounded-card p-4 mb-6">
        <h3 className="font-display font-bold text-ink mb-2">Categories</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((c) => (
            <span key={c.id} className="px-3 py-1 bg-cream border border-ink/10 rounded-full text-sm font-semibold">{c.name}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className="flex-1 border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          <button onClick={addCategory} className="bg-marigold text-ink font-bold px-4 rounded-card hover:bg-marigoldDark transition-colors">Add</button>
        </div>
      </div>

      <div className="bg-white border-2 border-ink/10 rounded-card p-4 mb-6">
        <h3 className="font-display font-bold text-ink mb-2">Add a menu item</h3>
        <div className="space-y-2">
          <select value={newItem.categoryId} onChange={(e) => setNewItem((f) => ({ ...f, categoryId: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring">
            <option value="">Select category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={newItem.name} onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))} placeholder="Item name" className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          <input value={newItem.basePrice} onChange={(e) => setNewItem((f) => ({ ...f, basePrice: e.target.value }))} placeholder="Price (KES)" type="number" className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          <input value={newItem.description} onChange={(e) => setNewItem((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          <button onClick={addItem} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors">Add item</button>
        </div>
      </div>

      <h3 className="font-display font-bold text-ink mb-2">Your menu ({items.length})</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white border-2 border-ink/10 rounded-card p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="text-sm text-stone">KES {Number(item.basePrice).toLocaleString()} · {item.category?.name}</p>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <button onClick={() => toggleAvailability(item)} className={`px-2 py-1 rounded-full ${item.isAvailable ? "bg-sukuma/15 text-sukuma" : "bg-chili/10 text-chili"}`}>
                {item.isAvailable ? "Available" : "Unavailable"}
              </button>
              <button onClick={() => toggleTodaysMenu(item)} className={`px-2 py-1 rounded-full ${item.isTodaysMenu ? "bg-marigold/30 text-marigoldDark" : "bg-stone/10 text-stone"}`}>
                {item.isTodaysMenu ? "On today's menu" : "Add to today's menu"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorEarningsTab() {
  const [summary, setSummary] = useState<{ totals: { gross: number; commission: number; net: number } } | null>(null);
  useEffect(() => {
    api.get<{ totals: { gross: number; commission: number; net: number } }>("/vendors/me/earnings").then(setSummary);
  }, []);
  if (!summary) return <p className="text-stone">Loading…</p>;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white border-2 border-ink/10 rounded-card p-4 text-center">
        <p className="text-xs text-stone font-semibold uppercase">Gross sales</p>
        <p className="font-display text-xl font-bold text-ink mt-1">KES {summary.totals.gross.toLocaleString()}</p>
      </div>
      <div className="bg-white border-2 border-ink/10 rounded-card p-4 text-center">
        <p className="text-xs text-stone font-semibold uppercase">Commission</p>
        <p className="font-display text-xl font-bold text-chili mt-1">KES {summary.totals.commission.toLocaleString()}</p>
      </div>
      <div className="bg-white border-2 border-ink/10 rounded-card p-4 text-center">
        <p className="text-xs text-stone font-semibold uppercase">Net payout</p>
        <p className="font-display text-xl font-bold text-sukuma mt-1">KES {summary.totals.net.toLocaleString()}</p>
      </div>
    </div>
  );
}

function VendorDashboardContent() {
  const [tab, setTab] = useState<Tab>("orders");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Vendor dashboard</h1>
      <div className="flex gap-2 mb-6">
        {(["orders", "menu", "earnings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${tab === t ? "bg-ink text-cream" : "bg-white border-2 border-ink/10 text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "orders" && <VendorOrdersTab />}
      {tab === "menu" && <VendorMenuTab />}
      {tab === "earnings" && <VendorEarningsTab />}
    </div>
  );
}

export default function VendorDashboardPage() {
  return (
    <Protected role="VENDOR">
      <VendorDashboardContent />
    </Protected>
  );
}
