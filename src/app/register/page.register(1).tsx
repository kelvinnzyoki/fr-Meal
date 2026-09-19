"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, friendlyError } from "@/lib/auth";
import { PasswordField, getPasswordStrength } from "@/components/PasswordField";

type Step = "details" | "code";

export default function RegisterPage() {
  const { startRegistration, verifyRegistration, resendRegistrationCode } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function tickCooldown() {
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side pre-checks — keep these generic and never phrase them the
    // way a server validation error would, so on-screen copy can't be used
    // to guess which layer rejected the input.
    if (form.password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (getPasswordStrength(form.password).score === 1) {
      setError("That password is quite weak — try adding a number, a symbol, or making it longer.");
      return;
    }

    setBusy(true);
    try {
      await startRegistration(form);
      setStep("code");
      setResendCooldown(60);
      tickCooldown();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verifyRegistration(form.email, code);
      router.push("/");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await resendRegistrationCode(form.email);
      setResendCooldown(60);
      tickCooldown();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  if (step === "code") {
    return (
      <div className="max-w-sm mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold text-ink mb-2">Check your email</h1>
        <p className="text-stone mb-6">
          We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to finish creating your account.
        </p>
        <form onSubmit={handleCodeSubmit} className="space-y-4" noValidate>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full border-2 border-ink/10 rounded-card px-4 py-3 text-center text-2xl tracking-[0.3em] font-bold focus-ring"
          />
          {error && (
            <p className="text-chili text-sm" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy || code.length !== 6} className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
            {busy ? "Verifying…" : "Confirm & create account"}
          </button>
        </form>
        <div className="flex items-center justify-between mt-4 text-sm">
          <button onClick={() => setStep("details")} className="text-stone font-semibold hover:underline">
            ← Edit details
          </button>
          <button onClick={handleResend} disabled={resendCooldown > 0} className="text-chili font-semibold hover:underline disabled:opacity-50 disabled:no-underline">
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Create your account</h1>
      <form onSubmit={handleDetailsSubmit} className="space-y-4" noValidate>
        <input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Full name" autoComplete="name" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone number (07XXXXXXXX)" autoComplete="tel" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email address" autoComplete="email" className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring" />
        <PasswordField
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholder="Password (min. 8 characters)"
          autoComplete="new-password"
          showStrength
          required
        />
        {error && (
          <p className="text-chili text-sm" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className="w-full bg-marigold text-ink font-bold py-3 rounded-card hover:bg-marigoldDark transition-colors disabled:opacity-60">
          {busy ? "Sending code…" : "Continue"}
        </button>
      </form>
      <p className="text-sm text-stone mt-4">
        Already have an account? <Link href="/login" className="text-chili font-semibold hover:underline">Sign in</Link>
      </p>
      <p className="text-xs text-stone mt-2">
        You can sign in later with either this phone number or this email address.
      </p>
    </div>
  );
}
