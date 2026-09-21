"use client";

import { Protected } from "@/components/Protected";
import { useAuth } from "@/lib/auth";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { EmailSection } from "@/components/settings/EmailSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { AddressesSection } from "@/components/settings/AddressesSection";
import { DangerZone } from "@/components/settings/DangerZone";

export default function SettingsPage() {
  // No `role` prop: any signed-in user (customer, vendor, rider, admin) can
  // manage their own account here.
  return (
    <Protected>
      <SettingsContent />
    </Protected>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-ink">Account settings</h1>
        <p className="text-stone mt-1">{user.fullName}</p>
      </header>

      <ProfileSection />
      <EmailSection />
      <PasswordSection />
      {user.role === "CUSTOMER" && <AddressesSection />}
      <DangerZone />
    </div>
  );
}
