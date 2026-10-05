"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";

// Same rule as phoneSchema in auth.validation.ts, checked up front so a typo
// gets instant feedback instead of a round trip.
const KENYAN_PHONE = /^(?:\+?254|0)(7|1)\d{8}$/;

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!KENYAN_PHONE.test(phone.replace(/\s+/g, ""))) {
      setError("Enter a valid Kenyan phone number, e.g. 0712345678.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/password-reset/request", { phone: phone.trim() });
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Check your phone</h1>
        {/* The backend answers identically whether or not the number is
            registered, so this copy must not claim a message was definitely sent. */}
        <p className="border-2 border-ink/10 rounded-card px-4 py-3 text-sm text-ink" role="status">
          If that number is registered, we&apos;ve sent an SMS with instructions to reset your password. It expires in 30 minutes.
        </p>
        <div className="mt-6 space-y-3 text-sm">
          <p className="text-stone">
            Got a reset code instead of a link?{" "}
            <Link href="/reset-password" className="text-chili font-semibold hover:underline">
              Enter it here
            </Link>
          </p>
          <p className="text-stone">
            Nothing arrived?{" "}
            <button type="button" onClick={() => setSent(false)} className="text-chili font-semibold hover:underline">
              Try again
            </button>
          </p>
          <p>
            <Link href="/login" className="text-stone hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-2">Reset your password</h1>
      <p className="text-sm text-stone mb-6">
        Enter the phone number on your account and we&apos;ll text you a link to choose a new password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number, e.g. 0712345678"
          autoComplete="tel"
          className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
        />
        {error && (
          <p className="text-chili text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send reset SMS"}
        </button>
      </form>
      <p className="text-sm text-stone mt-4">
        Remembered it?{" "}
        <Link href="/login" className="text-chili font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
