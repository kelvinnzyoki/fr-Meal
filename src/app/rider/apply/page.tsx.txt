"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, friendlyError } from "@/lib/auth";

export default function RiderApplyPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", vehicleType: "motorbike", numberPlate: "", nationalIdNo: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/riders/apply", { ...form, email: form.email || undefined });
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
        <div className="text-5xl mb-4">🏍️</div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Application received</h1>
        <p className="text-stone mb-6">An admin will review your details. You can start accepting deliveries once approved.</p>
        <button onClick={() => router.push("/rider/dashboard")} className="bg-marigold text-ink font-bold px-6 py-3 rounded-card">Go to dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-2">Become a rider</h1>
      <p className="text-stone mb-6">Deliver orders near you and earn on your own schedule.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <select value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring">
          <option value="motorbike">Motorbike</option>
          <option value="bike">Bicycle</option>
          <option value="car">Car</option>
          <option value="on-foot">On foot</option>
        </select>
        <input placeholder="Number plate (if applicable)" value={form.numberPlate} onChange={(e) => setForm((f) => ({ ...f, numberPlate: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input placeholder="National ID number" value={form.nationalIdNo} onChange={(e) => setForm((f) => ({ ...f, nationalIdNo: e.target.value }))} className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        {error && <p className="text-chili text-sm">{error}</p>}
        <button disabled={busy} className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
          {busy ? "Submitting…" : "Apply as a rider"}
        </button>
      </form>
    </div>
  );
}
