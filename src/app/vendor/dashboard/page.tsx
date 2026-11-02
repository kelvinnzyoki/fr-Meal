"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PRICE_TIERS, customerPrice, platformMarkup } from "@/lib/pricing";
import type { Order, FoodCategory, FoodItem } from "@/types";
import { CardListSkeleton, StatCardsSkeleton, FormSkeleton } from "@/components/Skeletons";

type Tab = "orders" | "menu" | "earnings" | "profile";

const money = (n: number | string) => `KES ${Number(n).toLocaleString()}`;

// Shared classes. `min-w-0` + `break-words` on text containers and `w-full`
// on fields is what keeps long names/addresses from ever pushing a card wider
// than the screen.
const card = "min-w-0 rounded-card border-2 border-ink/10 bg-white p-4";
const field = "w-full min-w-0 rounded-card border-2 border-ink/10 bg-white px-3 py-2 focus-ring";

// Always visible above the tabs — this is the single most important control
// on the whole page. A vendor's items are invisible on the public menu
// whenever this is off, regardless of each item's own "available" or
// "today's menu" flags, so it can't be buried inside a settings tab.
function KitchenStatusBar() {
  const [businessName, setBusinessName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api
      .get<{ businessName: string; isOpen: boolean }>("/vendors/me")
      .then((v) => {
        setBusinessName(v.businessName);
        setIsOpen(v.isOpen);
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggle() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<{ isOpen: boolean }>("/vendors/me", { isOpen: !isOpen });
      setIsOpen(updated.isOpen);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-card border-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
        isOpen ? "border-sukuma bg-sukuma/10" : "border-chili bg-chili/10"
      }`}
    >
      <div className="min-w-0">
        <p className="break-words font-display font-bold text-ink">{businessName || "Your kitchen"}</p>
        <p className={`break-words text-sm font-semibold ${isOpen ? "text-sukuma" : "text-chili"}`}>
          {isOpen ? "Open — customers can order from you" : "Closed — nothing you sell is visible to customers right now"}
        </p>
        {error && <p className="mt-1 break-words text-xs text-chili">{error}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`w-full flex-shrink-0 rounded-card px-4 py-2.5 font-bold transition-colors disabled:opacity-60 sm:w-auto ${
          isOpen ? "bg-chili/10 text-chili hover:bg-chili/20" : "bg-sukuma text-cream hover:opacity-90"
        }`}
      >
        {saving ? "Saving…" : isOpen ? "Close kitchen" : "Open kitchen"}
      </button>
    </div>
  );
}

function VendorOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  function load() {
    api
      .get<Order[]>("/orders/vendor/mine")
      .then(setOrders)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoaded(true));
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
      {error && <p className="mb-3 break-words text-sm text-chili">{error}</p>}
      {!loaded ? (
        <CardListSkeleton count={3} rows={3} />
      ) : orders.length === 0 ? (
        <p className="text-stone">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            // Vendors are shown what THEY earn, never the customer total (which
            // includes the platform's markup and delivery). The backend should
            // send `vendorPayout` (sum of the vendor's listed prices x qty).
            const payout = (o as Order & { vendorPayout?: number }).vendorPayout;
            return (
              <div key={o.id} className={card}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-all font-display font-bold text-ink">{o.orderNumber}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <ul className="mb-2 space-y-0.5 text-sm text-stone">
                  {o.items.map((i) => (
                    <li key={i.id} className="break-words">
                      {i.quantity}× {i.nameSnapshot}
                    </li>
                  ))}
                </ul>
                {typeof payout === "number" && (
                  <p className="mb-2 text-sm font-semibold text-sukuma">Your payout: {money(payout)}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(NEXT_ACTION[o.status] ?? []).map((action) => (
                    <button
                      key={action.status}
                      onClick={() => updateStatus(o.id, action.status)}
                      disabled={busyId === o.id}
                      className={`rounded-card px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        action.status === "REJECTED" ? "bg-chili/10 text-chili" : "bg-marigold text-ink hover:bg-marigoldDark"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Shown before a vendor lists any dish so they know up-front how pricing works.
function PricingGuide() {
  const rows = PRICE_TIERS.map((t, i) => {
    const from = i === 0 ? 1 : PRICE_TIERS[i - 1].max + 1;
    const range = t.max === Infinity ? `${from}+` : `${from} – ${t.max}`;
    return { range, markup: t.markup };
  });

  return (
    <div className="mb-6 min-w-0 rounded-card border-2 border-marigold/50 bg-marigold/10 p-4">
      <h3 className="font-display font-bold text-ink">How pricing works on Mpishi254</h3>
      <p className="mt-1 break-words text-sm text-ink/80">
        Enter the price <strong>you want to be paid</strong> for each dish. You always receive exactly that amount. Mpishi254 adds a
        small service charge on top, so customers see a higher price than the one you list.
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-ink">
        Example: you list a dish at KES 20 → customers see KES {customerPrice(20)}. You still get KES 20.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.range} className="flex min-w-0 items-baseline justify-between gap-2 rounded-lg bg-white/60 px-2.5 py-1.5">
            <span className="truncate text-stone">KES {r.range}</span>
            <span className="flex-shrink-0 font-semibold text-ink">+{r.markup}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorMenuTab() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newItem, setNewItem] = useState({ categoryId: "", name: "", basePrice: "", description: "" });
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  function load() {
    Promise.all([
      api.get<FoodCategory[]>("/food/categories/mine").then(setCategories),
      api.get<FoodItem[]>("/food/items/mine/all").then(setItems),
    ])
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoaded(true));
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
      setError("Pick a category, then fill in a name and your price.");
      return;
    }
    setError("");
    try {
      // basePrice is the VENDOR's price. The customer-facing price is added
      // by the platform on the server.
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

  const typedPrice = Number(newItem.basePrice);
  const showPreview = Number.isFinite(typedPrice) && typedPrice > 0;

  return (
    <div>
      <PricingGuide />

      {error && <p className="mb-3 break-words text-sm text-chili">{error}</p>}
      {!loaded && (
        <div className="mb-6">
          <CardListSkeleton count={2} rows={2} />
        </div>
      )}

      <div className={`${card} mb-6`}>
        <h3 className="mb-2 font-display font-bold text-ink">Categories</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="max-w-full break-words rounded-full border border-ink/10 bg-cream px-3 py-1 text-sm font-semibold">
              {c.name}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className={`${field} sm:flex-1`} />
          <button onClick={addCategory} className="rounded-card bg-marigold px-4 py-2 font-bold text-ink transition-colors hover:bg-marigoldDark">
            Add
          </button>
        </div>
      </div>

      <div className={`${card} mb-6`}>
        <h3 className="mb-2 font-display font-bold text-ink">Add a menu item</h3>
        <div className="space-y-2">
          <select value={newItem.categoryId} onChange={(e) => setNewItem((f) => ({ ...f, categoryId: e.target.value }))} className={field}>
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input value={newItem.name} onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))} placeholder="Item name" className={field} />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Your price — what you will be paid (KES)</span>
            <input
              value={newItem.basePrice}
              onChange={(e) => setNewItem((f) => ({ ...f, basePrice: e.target.value }))}
              placeholder="e.g. 150"
              type="number"
              inputMode="decimal"
              min={1}
              className={field}
            />
          </label>
          {showPreview && (
            <p className="break-words rounded-card bg-marigold/10 px-3 py-2 text-sm text-ink">
              You get <strong>{money(typedPrice)}</strong> · Mpishi254 adds <strong>{money(platformMarkup(typedPrice))}</strong> · Customers see{" "}
              <strong>{money(customerPrice(typedPrice))}</strong>
            </p>
          )}

          <input value={newItem.description} onChange={(e) => setNewItem((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" className={field} />
          <button onClick={addItem} className="w-full rounded-card bg-marigold px-4 py-2.5 font-bold text-ink transition-colors hover:bg-marigoldDark sm:w-auto">
            Add item
          </button>
        </div>
      </div>

      <h3 className="mb-2 font-display font-bold text-ink">Your menu ({items.length})</h3>
      <div className="space-y-2">
        {items.map((item) => {
          const price = Number(item.basePrice);
          return (
            <div key={item.id} className="flex min-w-0 flex-col gap-3 rounded-card border-2 border-ink/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-semibold text-ink">{item.name}</p>
                <p className="break-words text-sm text-stone">
                  You get {money(price)} · Customers pay {money(customerPrice(price))}
                </p>
                {item.category?.name && <p className="break-words text-xs text-stone">{item.category.name}</p>}
              </div>
              <div className="flex flex-shrink-0 flex-wrap gap-2 text-xs font-semibold">
                <button onClick={() => toggleAvailability(item)} className={`rounded-full px-2.5 py-1 ${item.isAvailable ? "bg-sukuma/15 text-sukuma" : "bg-chili/10 text-chili"}`}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
                <button onClick={() => toggleTodaysMenu(item)} className={`rounded-full px-2.5 py-1 ${item.isTodaysMenu ? "bg-marigold/30 text-marigoldDark" : "bg-stone/10 text-stone"}`}>
                  {item.isTodaysMenu ? "On today's menu" : "Add to today's menu"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EarningsSummary {
  totals: { net: number };
  recent: { id: string; createdAt: string; amount: number }[];
}

// Vendors only ever see what they are owed: exactly the prices they listed.
// Commission and the customer-side markup are admin-only.
function VendorEarningsTab() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<EarningsSummary>("/vendors/me/earnings")
      .then(setSummary)
      .catch((err) => setError(friendlyError(err)));
  }, []);

  if (error) return <p className="break-words text-sm text-chili">{error}</p>;
  if (!summary) return <StatCardsSkeleton count={1} cols="grid-cols-1" />;

  return (
    <div className="space-y-4">
      <div className={`${card} text-center sm:p-6`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone">Next payout</p>
        <p className="mt-1 break-words font-display text-3xl font-bold text-sukuma sm:text-4xl">{money(summary.totals.net)}</p>
        <p className="mx-auto mt-2 max-w-sm break-words text-sm text-stone">
          This is exactly the price you listed for each dish you sold — nothing is deducted from it.
        </p>
      </div>

      <div className={card}>
        <h3 className="mb-2 font-display font-bold text-ink">Recent earnings</h3>
        {summary.recent.length === 0 ? (
          <p className="text-sm text-stone">No earnings yet. They will show up here as orders are completed.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {summary.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-stone">
                  {new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="flex-shrink-0 font-semibold text-ink">{money(r.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface VendorZone {
  id: string;
  name: string;
  isFreeDelivery: boolean;
  deliveryFee: number;
}

function VendorProfileTab() {
  const [form, setForm] = useState({ businessName: "", description: "", physicalAddress: "", deliveryZoneId: "" });
  const [zones, setZones] = useState<VendorZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function load() {
    Promise.all([
      api.get<{ businessName: string; description?: string | null; physicalAddress?: string | null; deliveryZoneId?: string | null }>("/vendors/me"),
      api.get<VendorZone[]>("/zones"),
    ])
      .then(([vendor, zoneList]) => {
        setForm({
          businessName: vendor.businessName ?? "",
          description: vendor.description ?? "",
          physicalAddress: vendor.physicalAddress ?? "",
          deliveryZoneId: vendor.deliveryZoneId ?? "",
        });
        setZones(zoneList);
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.patch("/vendors/me", {
        businessName: form.businessName,
        description: form.description || undefined,
        physicalAddress: form.physicalAddress || undefined,
        ...(form.deliveryZoneId ? { deliveryZoneId: form.deliveryZoneId } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <FormSkeleton fields={4} />;

  return (
    <div className={`${card} w-full max-w-md space-y-3`}>
      <label className="block text-sm font-semibold text-ink">
        Kitchen name
        <input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Description
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Physical address
        <input value={form.physicalAddress} onChange={(e) => setForm((f) => ({ ...f, physicalAddress: e.target.value }))} className={`${field} mt-1`} />
      </label>

      <label className="block text-sm font-semibold text-ink">
        Delivery zone
        <select value={form.deliveryZoneId} onChange={(e) => setForm((f) => ({ ...f, deliveryZoneId: e.target.value }))} className={`${field} mt-1`}>
          <option value="">— Select the zone your kitchen is in —</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} — {z.isFreeDelivery ? "Free delivery" : `KES ${z.deliveryFee} delivery fee`}
            </option>
          ))}
        </select>
        <span className="mt-1 block break-words text-xs font-normal text-stone">
          This decides whether the &quot;Free delivery&quot; badge shows next to your kitchen. Zones themselves (fees, free-delivery radius) are set by the Mpishi254 admin — if none fit where you are, let them know.
        </span>
      </label>

      {zones.length === 0 && (
        <p className="break-words text-xs text-chili">No delivery zones have been set up yet — ask an admin to add one before you can select it here.</p>
      )}

      <button onClick={save} disabled={saving} className="w-full rounded-card bg-marigold px-4 py-2.5 font-bold text-ink transition-colors hover:bg-marigoldDark disabled:opacity-60 sm:w-auto">
        {saving ? "Saving…" : "Save profile"}
      </button>
      {saved && <p className="text-sm font-semibold text-sukuma">Saved!</p>}
      {error && <p className="break-words text-sm text-chili">{error}</p>}
    </div>
  );
}

function VendorDashboardContent() {
  const [tab, setTab] = useState<Tab>("orders");
  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 px-4 py-6 sm:py-8">
      <h1 className="mb-6 break-words font-display text-2xl font-extrabold text-ink sm:text-3xl">Vendor dashboard</h1>
      <KitchenStatusBar />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["orders", "menu", "earnings", "profile"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-ink text-cream" : "border-2 border-ink/10 bg-white text-ink hover:border-marigold"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "orders" && <VendorOrdersTab />}
      {tab === "menu" && <VendorMenuTab />}
      {tab === "earnings" && <VendorEarningsTab />}
      {tab === "profile" && <VendorProfileTab />}
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
