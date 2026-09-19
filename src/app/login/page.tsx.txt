"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, friendlyError } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(phone, password);
      router.push(next);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        {error && <p className="text-chili text-sm">{error}</p>}
        <button disabled={busy} className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-stone mt-4">
        No account? <Link href="/register" className="text-chili font-semibold hover:underline">Create one</Link>
      </p>
      <p className="text-xs text-stone mt-6">
        Own a kitchen? <Link href="/vendor/apply" className="hover:underline">Apply as a vendor</Link> · Want to deliver?{" "}
        <Link href="/rider/apply" className="hover:underline">Apply as a rider</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
