"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, friendlyError } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({ ...form, email: form.email || undefined });
      router.push("/");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone number (07XXXXXXXX)" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email (optional)" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} type="password" placeholder="Password (min. 8 characters)" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        {error && <p className="text-chili text-sm">{error}</p>}
        <button disabled={busy} className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-stone mt-4">
        Already have an account? <Link href="/login" className="text-chili font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
