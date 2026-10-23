"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";

// Light client-side email check so an obvious typo gets instant feedback
// instead of a round trip. The backend (requestPasswordResetSchema) does the
// authoritative validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- Phone/SMS version — kept for when the Africa's Talking sender ID is approved ----
// Same rule as phoneSchema in auth.validation.ts.
// const KENYAN_PHONE = /^(?:\+?254|0)(7|1)\d{8}$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // ---- Phone/SMS version of the state (re-enable alongside the block above) ----
  // const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    // ---- Phone/SMS version of the check ----
    // if (!KENYAN_PHONE.test(phone.replace(/\s+/g, ""))) {
    //   setError("Enter a valid Kenyan phone number, e.g. 0712345678.");
    //   return;
    // }

    setBusy(true);
    try {
      await api.post("/auth/password-reset/request", { email: email.trim().toLowerCase() });
      // ---- Phone/SMS version of the request ----
      // await api.post("/auth/password-reset/request", { phone: phone.trim() });
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
        <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Check your email</h1>
        {/* The backend answers identically whether or not the email is
            registered, so this copy must not claim a message was definitely sent. */}
        <p className="border-2 border-ink/10 rounded-card px-4 py-3 text-sm text-ink" role="status">
          If that email is registered, we&apos;ve sent a message with instructions to reset your password. It expires in 30
          minutes. Check your spam folder if you don&apos;t see it.
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
        Enter the email address on your account and we&apos;ll send you a link to choose a new password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
        />
        {/* ---- Phone/SMS version of the input ----
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number, e.g. 0712345678"
          autoComplete="tel"
          className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
        />
        */}
        {error && (
          <p className="text-chili text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send reset email"}
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
