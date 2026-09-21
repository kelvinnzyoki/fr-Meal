"use client";

import { FormEvent, useState } from "react";
import { account } from "@/lib/account";
import { Button, Card, Field, Notice, errorText, type Status } from "./ui";

export function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const [revoking, setRevoking] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<Status>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      setStatus({ kind: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (next !== confirmNext) {
      setStatus({ kind: "error", text: "The new passwords don't match." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await account.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirmNext("");
      setStatus({ kind: "success", text: res.message ?? "Password updated." });
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
    } finally {
      setSaving(false);
    }
  }

  async function signOutOthers() {
    setRevoking(true);
    setSessionStatus(null);
    try {
      const res = await account.revokeOtherSessions();
      setSessionStatus({ kind: "success", text: res.message ?? "Signed out of all other devices." });
    } catch (err) {
      setSessionStatus({ kind: "error", text: errorText(err) });
    } finally {
      setRevoking(false);
    }
  }

  return (
    <Card
      title="Password and security"
      description="Changing your password signs you out everywhere else."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Current password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Field
          label="New password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          hint="At least 8 characters."
          required
        />
        <Field
          label="Confirm new password"
          type="password"
          value={confirmNext}
          onChange={(e) => setConfirmNext(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Notice status={status} />
        <Button type="submit" loading={saving} disabled={!current || !next || !confirmNext}>
          Update password
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-black/10 space-y-3">
        <p className="text-sm text-stone">
          Used your account on a shared or lost device? Sign out everywhere except here.
        </p>
        <Notice status={sessionStatus} />
        <Button variant="secondary" onClick={signOutOthers} loading={revoking}>
          Sign out of other devices
        </Button>
      </div>
    </Card>
  );
}
