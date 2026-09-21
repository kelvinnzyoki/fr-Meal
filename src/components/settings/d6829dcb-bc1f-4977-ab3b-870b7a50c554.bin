"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { account } from "@/lib/account";
import { Button, Card, Field, Notice, errorText, type Status } from "./ui";

export function DangerZone() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!user) return null;

  if (user.role !== "CUSTOMER") {
    return (
      <Card
        tone="danger"
        title="Delete account"
        description="Vendor, rider and admin accounts can't be deleted here. Contact support and we'll help."
      />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await account.deleteAccount(password);
      await logout(); // clears client state; the server already cleared the cookies
      router.push("/");
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
      setBusy(false);
    }
  }

  return (
    <Card
      tone="danger"
      title="Delete account"
      description="This signs you out everywhere and erases your profile, saved addresses, cart and meal plans. Past orders and payment records are kept for accounting. This can't be undone."
    >
      {open ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Confirm with your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Notice status={status} />
          <div className="flex gap-3">
            <Button type="submit" variant="danger" loading={busy} disabled={!password}>
              Delete my account
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setStatus(null);
              }}
              disabled={busy}
            >
              Keep my account
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete account…
        </Button>
      )}
    </Card>
  );
}
