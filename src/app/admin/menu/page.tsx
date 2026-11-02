"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Protected } from "@/components/Protected";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";

// Same slugs as the home-page category chips.
const CATEGORY_OPTIONS = [
  { slug: "kenyan-delicacies", label: "Kenyan Delicacies" },
  { slug: "breakfast", label: "Breakfast" },
  { slug: "lunch", label: "Lunch" },
  { slug: "dinner", label: "Dinner" },
  { slug: "drinks", label: "Drinks" },
  { slug: "snacks", label: "Snacks" },
];

interface MenuItem {
  id: string;
  name: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isTodaysMenu: boolean;
  vendor: { id: string; businessName: string };
  category: { id: string; name: string };
  isHouse: boolean;
  vendorPrice: number; // what the kitchen is paid (or your cost, for your own items)
  autoPrice: number; // automatic tier price
  customerPriceOverride: number | null;
  finalPrice: number; // what customers pay right now
}

const money = (n: number) => `KES ${Number(n).toLocaleString()}`;
const card = "min-w-0 rounded-card border-2 border-ink/10 bg-white p-4";
const field = "w-full min-w-0 rounded-card border-2 border-ink/10 bg-white px-3 py-2 focus-ring";

// ---------------------------------------------------------------- kitchen --
function HouseKitchenBar() {
  const [kitchen, setKitchen] = useState<{ businessName: string; isOpen: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ businessName: string; isOpen: boolean }>("/admin/menu/kitchen")
      .then(setKitchen)
      .catch((err) => setError(friendlyError(err)));
  }, []);

  async function toggle() {
    if (!kitchen) return;
    setSaving(true);
    setError("");
    try {
      setKitchen(await api.patch<{ businessName: string; isOpen: boolean }>("/admin/menu/kitchen", { isOpen: !kitchen.isOpen }));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!kitchen) return error ? <p className="mb-4 break-words text-sm text-chili">{error}</p> : null;

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-card border-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
        kitchen.isOpen ? "border-sukuma bg-sukuma/10" : "border-chili bg-chili/10"
      }`}
    >
      <div className="min-w-0">
        <p className="break-words font-display font-bold text-ink">{kitchen.businessName}</p>
        <p className={`break-words text-sm font-semibold ${kitchen.isOpen ? "text-sukuma" : "text-chili"}`}>
          {kitchen.isOpen ? "Open — your own items are visible to customers" : "Closed — your own items are hidden from customers"}
        </p>
        {error && <p className="mt-1 break-words text-xs text-chili">{error}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`w-full flex-shrink-0 rounded-card px-4 py-2.5 font-bold transition-colors disabled:opacity-60 sm:w-auto ${
          kitchen.isOpen ? "bg-chili/10 text-chili hover:bg-chili/20" : "bg-sukuma text-cream hover:opacity-90"
        }`}
      >
        {saving ? "Saving…" : kitchen.isOpen ? "Close" : "Open"}
      </button>
    </div>
  );
}

// --------------------------------------------------------------- add item --
function AddItemForm({ onCreated }: { onCreated: (item: MenuItem) => void }) {
  const empty = { name: "", categorySlug: "", customerPrice: "", cost: "", description: "", prepTimeMins: "", isTodaysMenu: false };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const price = Number(form.customerPrice);
  const cost = Number(form.cost || 0);
  const showMargin = Number.isFinite(price) && price > 0 && Number.isFinite(cost) && cost >= 0;

  async function submit() {
    setError("");
    setOk("");
    if (!form.name.trim() || !form.categorySlug || !(price > 0)) {
      setError("Fill in a name, pick a category and enter the customer price.");
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<MenuItem>("/admin/menu/items", {
        name: form.name.trim(),
        categorySlug: form.categorySlug,
        customerPrice: price,
        cost: form.cost ? cost : undefined,
        description: form.description.trim() || undefined,
        prepTimeMins: form.prepTimeMins ? Number(form.prepTimeMins) : undefined,
        isTodaysMenu: form.isTodaysMenu,
      });
      onCreated(created);
      setOk(`“${created.name}” added at ${money(created.finalPrice)}. Add a photo from the Food images page.`);
      setForm({ ...empty, categorySlug: form.categorySlug });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`${card} mb-8`}>
      <h2 className="font-display text-lg font-bold text-ink">Add your own food item</h2>
      <p className="mt-1 break-words text-sm text-stone">
        These are sold by Mpishi254 itself — no kitchen needed. Enter the <strong>final price the customer pays</strong>; your add-on is
        already included.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0 sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-ink">Item name</span>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Pilau with kachumbari" maxLength={120} className={field} />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-sm font-semibold text-ink">Category</span>
          <select value={form.categorySlug} onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))} className={field}>
            <option value="">Select category…</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-sm font-semibold text-ink">Prep time (minutes, optional)</span>
          <input value={form.prepTimeMins} onChange={(e) => setForm((f) => ({ ...f, prepTimeMins: e.target.value }))} type="number" inputMode="numeric" min={1} placeholder="20" className={field} />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-sm font-semibold text-ink">Customer price (KES)</span>
          <input value={form.customerPrice} onChange={(e) => setForm((f) => ({ ...f, customerPrice: e.target.value }))} type="number" inputMode="decimal" min={1} placeholder="e.g. 250" className={field} />
        </label>

        <label className="block min-w-0">
          <span className="mb-1 block text-sm font-semibold text-ink">Your cost (KES, optional)</span>
          <input value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} type="number" inputMode="decimal" min={0} placeholder="0" className={field} />
        </label>

        {showMargin && (
          <p className="break-words rounded-card bg-marigold/10 px-3 py-2 text-sm text-ink sm:col-span-2">
            Customers pay <strong>{money(price)}</strong>
            {cost > 0 && (
              <>
                {" "}
                · your cost <strong>{money(cost)}</strong> · you keep <strong>{money(price - cost)}</strong>
              </>
            )}
          </p>
        )}

        <label className="block min-w-0 sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-ink">Description (optional)</span>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className={field} />
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold text-ink sm:col-span-2">
          <input type="checkbox" checked={form.isTodaysMenu} onChange={(e) => setForm((f) => ({ ...f, isTodaysMenu: e.target.checked }))} className="h-4 w-4 accent-marigold" />
          Show on today&apos;s menu
        </label>
      </div>

      {error && <p className="mt-3 break-words text-sm text-chili">{error}</p>}
      {ok && <p className="mt-3 break-words text-sm font-semibold text-sukuma">{ok}</p>}

      <button onClick={submit} disabled={saving} className="mt-4 w-full rounded-card bg-marigold px-5 py-2.5 font-bold text-ink transition-colors hover:bg-marigoldDark disabled:opacity-60 sm:w-auto">
        {saving ? "Adding…" : "Add item"}
      </button>
    </div>
  );
}

// -------------------------------------------------------------- item card --
function ItemCard({ item, onChanged, onDeleted }: { item: MenuItem; onChanged: (i: MenuItem) => void; onDeleted: (id: string) => void }) {
  const [draft, setDraft] = useState(String(item.finalPrice));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Keep the input in step when the saved price changes.
  useEffect(() => setDraft(String(item.finalPrice)), [item.finalPrice]);

  const draftNum = Number(draft);
  const valid = Number.isFinite(draftNum) && draftNum > 0 && draftNum >= item.vendorPrice;
  const dirty = valid && draftNum !== item.finalPrice;
  const addOn = (valid ? draftNum : item.finalPrice) - item.vendorPrice;

  async function run(fn: () => Promise<MenuItem | void>) {
    setBusy(true);
    setError("");
    try {
      const result = await fn();
      if (result) onChanged(result);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const savePrice = () => run(() => api.patch<MenuItem>(`/admin/menu/items/${item.id}/price`, { customerPrice: draftNum }));
  const resetPrice = () => run(() => api.patch<MenuItem>(`/admin/menu/items/${item.id}/price`, { customerPrice: null }));
  const toggle = (data: { isAvailable?: boolean; isTodaysMenu?: boolean }) => run(() => api.patch<MenuItem>(`/admin/menu/items/${item.id}`, data));
  const remove = () => {
    if (!window.confirm(`Delete “${item.name}”? This can't be undone.`)) return;
    return run(async () => {
      await api.post(`/admin/menu/items/${item.id}/delete`, {});
      onDeleted(item.id);
    });
  };

  return (
    <div className={`${card} flex flex-col gap-3`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-card bg-stone/10">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">🍽️</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold leading-snug text-ink">{item.name}</p>
          <p className="break-words text-xs text-stone">
            {item.vendor.businessName} · {item.category.name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            {item.isHouse && <span className="rounded-full bg-marigold/25 px-2 py-0.5 text-marigoldDark">Your item</span>}
            {item.customerPriceOverride != null && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-ink">Custom price</span>}
            {!item.isAvailable && <span className="rounded-full bg-chili/10 px-2 py-0.5 text-chili">Unavailable</span>}
          </div>
        </div>
      </div>

      <div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone">Final customer price (KES)</span>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              type="number"
              inputMode="decimal"
              min={item.vendorPrice}
              className={`${field} ${draft !== "" && !valid ? "border-chili" : ""}`}
              aria-invalid={draft !== "" && !valid}
            />
            <button onClick={savePrice} disabled={!dirty || busy} className="flex-shrink-0 rounded-card bg-marigold px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-marigoldDark disabled:opacity-50">
              {busy ? "…" : "Save"}
            </button>
          </div>
        </label>
        <p className="mt-1.5 break-words text-xs text-stone">
          {item.isHouse ? "Your cost" : "Kitchen gets"} {money(item.vendorPrice)} · your add-on <strong className="text-ink">{money(addOn)}</strong>
          {draft !== "" && !valid && <span className="text-chili"> · can&apos;t be below {money(item.vendorPrice)}</span>}
        </p>
        {item.customerPriceOverride != null && (
          <button onClick={resetPrice} disabled={busy} className="mt-1 text-xs font-semibold text-accent underline-offset-2 hover:underline disabled:opacity-60">
            Use automatic price ({money(item.autoPrice)})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button onClick={() => toggle({ isAvailable: !item.isAvailable })} disabled={busy} className={`rounded-full px-2.5 py-1 ${item.isAvailable ? "bg-sukuma/15 text-sukuma" : "bg-chili/10 text-chili"}`}>
          {item.isAvailable ? "Available" : "Unavailable"}
        </button>
        <button onClick={() => toggle({ isTodaysMenu: !item.isTodaysMenu })} disabled={busy} className={`rounded-full px-2.5 py-1 ${item.isTodaysMenu ? "bg-marigold/30 text-marigoldDark" : "bg-stone/10 text-stone"}`}>
          {item.isTodaysMenu ? "On today's menu" : "Add to today's menu"}
        </button>
        {item.isHouse && (
          <button onClick={remove} disabled={busy} className="rounded-full bg-chili/10 px-2.5 py-1 text-chili">
            Delete
          </button>
        )}
      </div>

      {error && <p className="break-words text-xs text-chili">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------------- page --
type Filter = "all" | "mine" | "kitchens";

function AdminMenuContent() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");

  async function load(query = "") {
    setLoading(true);
    setError("");
    try {
      setItems(await api.get<MenuItem[]>(`/admin/menu/items${query ? `?search=${encodeURIComponent(query)}` : ""}`));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => items.filter((i) => (filter === "all" ? true : filter === "mine" ? i.isHouse : !i.isHouse)),
    [items, filter]
  );

  const replace = (updated: MenuItem) => setItems((list) => list.map((i) => (i.id === updated.id ? updated : i)));

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:py-8">
      <Link href="/admin/dashboard" className="text-sm font-semibold text-accent hover:underline">
        ← Admin dashboard
      </Link>
      <h1 className="mb-2 mt-3 break-words font-display text-2xl font-extrabold text-ink sm:text-3xl">Menu &amp; prices</h1>
      <p className="mb-6 max-w-prose break-words text-sm text-stone">
        Add your own dishes and set the final customer price of any item, including kitchens&apos;. Kitchens are always paid the price they
        listed — whatever you charge above it is yours. Need photos?{" "}
        <Link href="/admin/food-images" className="font-semibold text-accent hover:underline">
          Food images
        </Link>
      </p>

      <HouseKitchenBar />
      <AddItemForm onCreated={(i) => setItems((list) => [i, ...list])} />

      <h2 className="mb-3 font-display text-lg font-bold text-ink">All food items ({visible.length})</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="mb-3 flex flex-col gap-2 sm:flex-row"
      >
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by food item name…" className={`${field} sm:flex-1`} />
        <button className="rounded-card bg-marigold px-5 py-2.5 font-bold text-ink transition-colors hover:bg-marigoldDark">Search</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["mine", "My items"],
          ["kitchens", "Kitchens"],
        ] as [Filter, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            aria-pressed={filter === v}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === v ? "bg-ink text-cream" : "border-2 border-ink/10 bg-white text-ink hover:border-marigold"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 break-words text-sm text-chili">{error}</p>}

      {loading ? (
        <p className="text-stone">Loading food items…</p>
      ) : visible.length === 0 ? (
        <p className="text-stone">No food items match.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} onChanged={replace} onDeleted={(id) => setItems((list) => list.filter((i) => i.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMenuPage() {
  return (
    <Protected role="ADMIN">
      <AdminMenuContent />
    </Protected>
  );
}
