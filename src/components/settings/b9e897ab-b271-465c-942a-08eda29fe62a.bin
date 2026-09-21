"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { account } from "@/lib/account";
import { Button, Card, Field, Notice, errorText, type Status } from "./ui";

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!user) return null;
  const changed = fullName.trim() !== user.fullName;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setStatus({ kind: "error", text: "Enter your full name." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await account.updateProfile(fullName.trim());
      await refreshUser();
      setStatus({ kind: "success", text: "Profile updated." });
    } catch (err) {
      setStatus({ kind: "error", text: errorText(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Profile" description="How your name appears on orders and deliveries.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          maxLength={80}
        />
        <Field
          label="Phone number"
          value={`+${user.phone}`}
          disabled
          readOnly
          hint="This is what you sign in with, so it can't be edited here. Contact support to change it."
        />
        <Notice status={status} />
        <Button type="submit" loading={saving} disabled={!changed}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
