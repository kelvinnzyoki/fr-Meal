"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";

export default function VendorApplyPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", businessName: "", description: "", physicalAddress: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/vendors/apply", { ...form, email: form.email || undefined });
      await refreshUser();
      setDone(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Application received</h1>
        <p className="text-stone mb-6">An admin will review your kitchen and approve it shortly. You&apos;ll be able to manage your menu from your dashboard once approved.</p>
        <button onClick={() => router.push("/vendor/dashboard")} className="bg-marigold text-ink font-bold px-6 py-3 rounded-card">Go to dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-2">List your kitchen</h1>
      <p className="text-stone mb-6">Start selling on KulaGo — your kitchen goes live once an admin approves it.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Your full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required placeholder="Kitchen / business name" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <textarea placeholder="Describe your kitchen" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" rows={2} />
        <input placeholder="Physical address" value={form.physicalAddress} onChange={(e) => setForm((f) => ({ ...f, physicalAddress: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        {error && <p className="text-chili text-sm">{error}</p>}
        <button disabled={busy} className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
          {busy ? "Submitting…" : "Apply as a vendor"}
        </button>
      </form>
    </div>
  );
}
