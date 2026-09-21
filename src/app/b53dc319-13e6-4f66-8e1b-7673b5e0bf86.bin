"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";
import { PasswordField } from "@/components/PasswordField";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  // If the SMS contains a link, the token arrives in the URL and the person
  // never has to see or paste it. Without one, we show a field for the code.
  const urlToken = params.get("token") ?? "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const token = (urlToken || code).trim();
    if (token.length < 10) {
      setError("Enter the reset code from your SMS.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/password-reset/confirm", { token, newPassword: password });
      router.push("/login?reset=1");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold text-ink mb-6">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!urlToken && (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Reset code from your SMS"
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full border-2 border-ink/10 rounded-card px-4 py-3 focus-ring"
          />
        )}
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="New password (8+ characters)"
          autoComplete="new-password"
        />
        <PasswordField
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirm new password"
          autoComplete="new-password"
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
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="text-sm text-stone mt-4">
        Link or code expired?{" "}
        <Link href="/forgot-password" className="text-chili font-semibold hover:underline">
          Request a new one
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
