"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";

type Tab = "overview" | "vendors" | "riders" | "zones" | "settings";

interface DashboardStats {
  customers: number;
  vendors: { approved: number; pending: number };
  riders: { approved: number; pending: number };
  ordersByStatus: Record<string, number>;
  revenue: { gross: number; platformCommission: number };
}

function OverviewTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  useEffect(() => {
    api.get<DashboardStats>("/admin/dashboard").then(setStats);
  }, []);
  if (!stats) return <p className="text-stone">Loading…</p>;

  const cards = [
    { label: "Customers", value: stats.customers },
    { label: "Approved vendors", value: stats.vendors.approved },
    { label: "Pending vendors", value: stats.vendors.pending },
    { label: "Approved riders", value: stats.riders.approved },
    { label: "Pending riders", value: stats.riders.pending },
    { label: "Gross order value", value: `KES ${stats.revenue.gross.toLocaleString()}` },
    { label: "Platform commission", value: `KES ${stats.revenue.platformCommission.toLocaleString()}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border-2 border-ink/10 rounded-card p-4">
            <p className="text-xs text-stone font-semibold uppercase">{c.label}</p>
            <p className="font-display text-xl font-bold text-ink mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border-2 border-ink/10 rounded-card p-4">
        <h3 className="font-display font-bold text-ink mb-2">Orders by status</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between border-b border-ink/5 py-1">
              <span className="text-stone">{status.replace(/_/g, " ")}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PendingEntity {
  id: string;
  status: string;
  businessName?: string;
  vehicleType?: string;
  user: { fullName: string; phone: string };
}

function VendorsTab() {
  const [vendors, setVendors] = useState<PendingEntity[]>([]);
  const [error, setError] = useState("");
  function load() {
    api.get<PendingEntity[]>("/admin/vendors").then(setVendors);
  }
  useEffect(load, []);

  async function act(id: string, action: "approve" | "suspend") {
    try {
      await api.post(`/admin/vendors/${id}/${action}`);
      load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}
      <div className="space-y-2">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white border-2 border-ink/10 rounded-card p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">{v.businessName}</p>
              <p className="text-sm text-stone">{v.user.fullName} · {v.user.phone} · {v.status}</p>
            </div>
            <div className="flex gap-2">
              {v.status !== "APPROVED" && (
                <button onClick={() => act(v.id, "approve")} className="bg-sukuma text-cream text-sm font-bold px-3 py-1.5 rounded-card">Approve</button>
              )}
              {v.status !== "SUSPENDED" && (
                <button onClick={() => act(v.id, "suspend")} className="bg-chili/10 text-chili text-sm font-bold px-3 py-1.5 rounded-card">Suspend</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RidersTab() {
  const [riders, setRiders] = useState<PendingEntity[]>([]);
  const [error, setError] = useState("");
  function load() {
    api.get<PendingEntity[]>("/admin/riders").then(setRiders);
  }
  useEffect(load, []);

  async function act(id: string, action: "approve" | "suspend") {
    try {
      await api.post(`/admin/riders/${id}/${action}`);
      load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}
      <div className="space-y-2">
        {riders.map((r) => (
          <div key={r.id} className="bg-white border-2 border-ink/10 rounded-card p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">{r.user.fullName}</p>
              <p className="text-sm text-stone">{r.user.phone} · {r.vehicleType} · {r.status}</p>
            </div>
            <div className="flex gap-2">
              {r.status !== "APPROVED" && (
                <button onClick={() => act(r.id, "approve")} className="bg-sukuma text-cream text-sm font-bold px-3 py-1.5 rounded-card">Approve</button>
              )}
              {r.status !== "SUSPENDED" && (
                <button onClick={() => act(r.id, "suspend")} className="bg-chili/10 text-chili text-sm font-bold px-3 py-1.5 rounded-card">Suspend</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Zone {
  id: string;
  name: string;
  isFreeDelivery: boolean;
  deliveryFee: number;
  minOrderValue: number;
  isActive: boolean;
}

function ZonesTab() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({ name: "", isFreeDelivery: false, deliveryFee: "100", minOrderValue: "0", centerLat: "", centerLng: "", radiusKm: "3" });
  const [error, setError] = useState("");

  function load() {
    api.get<Zone[]>("/zones").then(setZones);
  }
  useEffect(load, []);

  async function createZone() {
    if (!form.name) {
      setError("Zone name is required");
      return;
    }
    try {
      await api.post("/zones", {
        name: form.name,
        isFreeDelivery: form.isFreeDelivery,
        deliveryFee: Number(form.deliveryFee),
        minOrderValue: Number(form.minOrderValue),
        centerLat: form.centerLat ? Number(form.centerLat) : undefined,
        centerLng: form.centerLng ? Number(form.centerLng) : undefined,
        radiusKm: form.radiusKm ? Number(form.radiusKm) : undefined,
      });
      setForm((f) => ({ ...f, name: "" }));
      load();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div>
      {error && <p className="text-chili text-sm mb-3">{error}</p>}
      <div className="space-y-2 mb-6">
        {zones.map((z) => (
          <div key={z.id} className="bg-white border-2 border-ink/10 rounded-card p-3">
            <p className="font-semibold text-ink">{z.name} {!z.isActive && <span className="text-chili text-xs">(inactive)</span>}</p>
            <p className="text-sm text-stone">
              {z.isFreeDelivery ? "Free delivery" : `KES ${Number(z.deliveryFee).toLocaleString()} delivery fee`} · Min order KES {Number(z.minOrderValue).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-white border-2 border-ink/10 rounded-card p-4">
        <h3 className="font-display font-bold text-ink mb-3">Add a delivery zone</h3>
        <div className="space-y-2">
          <input placeholder="Zone name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.isFreeDelivery} onChange={(e) => setForm((f) => ({ ...f, isFreeDelivery: e.target.checked }))} />
            Free delivery in this zone
          </label>
          {!form.isFreeDelivery && (
            <input placeholder="Delivery fee (KES)" type="number" value={form.deliveryFee} onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          )}
          <input placeholder="Minimum order value (KES)" type="number" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Center lat" value={form.centerLat} onChange={(e) => setForm((f) => ({ ...f, centerLat: e.target.value }))} className="border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
            <input placeholder="Center lng" value={form.centerLng} onChange={(e) => setForm((f) => ({ ...f, centerLng: e.target.value }))} className="border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
            <input placeholder="Radius (km)" value={form.radiusKm} onChange={(e) => setForm((f) => ({ ...f, radiusKm: e.target.value }))} className="border-2 border-ink/10 rounded-card px-3 py-2 focus-ring" />
          </div>
          <button onClick={createZone} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors">Add zone</button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<{ defaultCommissionRate: number; defaultDeliveryFee: number; defaultMinOrderValue: number; paymentTimeoutMinutes: number } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<typeof settings>("/admin/settings").then((s) => setSettings(s));
  }, []);

  async function save() {
    if (!settings) return;
    await api.patch("/admin/settings", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <p className="text-stone">Loading…</p>;

  return (
    <div className="bg-white border-2 border-ink/10 rounded-card p-4 max-w-sm space-y-3">
      <label className="block text-sm font-semibold text-ink">
        Default commission rate (%)
        <input type="number" value={settings.defaultCommissionRate} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: Number(e.target.value) })} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 mt-1 focus-ring" />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Default delivery fee (KES)
        <input type="number" value={settings.defaultDeliveryFee} onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 mt-1 focus-ring" />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Default minimum order (KES)
        <input type="number" value={settings.defaultMinOrderValue} onChange={(e) => setSettings({ ...settings, defaultMinOrderValue: Number(e.target.value) })} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 mt-1 focus-ring" />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Payment timeout (minutes)
        <input type="number" value={settings.paymentTimeoutMinutes} onChange={(e) => setSettings({ ...settings, paymentTimeoutMinutes: Number(e.target.value) })} className="w-full border-2 border-ink/10 rounded-card px-3 py-2 mt-1 focus-ring" />
      </label>
      <button onClick={save} className="bg-marigold text-ink font-bold px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors">Save settings</button>
      {saved && <p className="text-sukuma text-sm font-semibold">Saved!</p>}
    </div>
  );
}

function AdminDashboardContent() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Admin dashboard</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {(["overview", "vendors", "riders", "zones", "settings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${tab === t ? "bg-ink text-cream" : "bg-white border-2 border-ink/10 text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "overview" && <OverviewTab />}
      {tab === "vendors" && <VendorsTab />}
      {tab === "riders" && <RidersTab />}
      {tab === "zones" && <ZonesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Protected role="ADMIN">
      <AdminDashboardContent />
    </Protected>
  );
}
