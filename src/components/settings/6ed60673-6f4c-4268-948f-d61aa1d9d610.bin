"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { account } from "@/lib/account";
import { Button, Card, Field, Notice, errorText, type Status } from "./ui";

export function EmailSection() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<"form" | "code">("form");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!user) return null;

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await account.startEmailChange(newEmail.trim(), password);
      setStep("code");
      setCode("");
      setStatus({ kind: "success", text: `We sent a 6-digit code to ${newEmail.trim()}.` });
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await account.verifyEmailChange(code.trim());
      await refreshUser();
      setStep("form");
      setNewEmail("");
      setPassword("");
      setCode("");
      setStatus({ kind: "success", text: "Email updated." });
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  function backToForm() {
    setStep("form");
    setCode("");
    setStatus(null);
  }

  return (
    <Card
      title="Email address"
      description={
        user.email
          ? `Currently ${user.email}. We'll email a code to the new address to confirm it's yours.`
          : "No email on your account yet. Add one and we'll email a code to confirm it."
      }
    >
      {step === "form" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <Field
            label="New email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Field
            label="Current password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Notice status={status} />
          <Button type="submit" loading={busy} disabled={!newEmail.trim() || !password}>
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={confirm} className="space-y-4">
          <Field
            label="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
          />
          <Notice status={status} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={busy} disabled={code.length !== 6}>
              Confirm email
            </Button>
            <Button variant="secondary" onClick={() => sendCode()} disabled={busy}>
              Resend code
            </Button>
            <Button variant="secondary" onClick={backToForm} disabled={busy}>
              Use a different email
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
