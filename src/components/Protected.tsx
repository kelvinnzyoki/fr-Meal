"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { User } from "@/types";

type Role = User["role"];

// Wraps a page that requires a signed-in user. `role` can be a single role,
// a list of roles, or omitted entirely (any signed-in user — used by
// /settings). Renders nothing (or a spinner) until the /auth/me check
// resolves, then redirects rather than flashing protected content to the
// wrong audience.
export function Protected({ role, children }: { role?: Role | Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed =
    !!user && (role === undefined || (Array.isArray(role) ? role.includes(user.role) : user.role === role));

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/login");
    }
  }, [loading, allowed, router]);

  if (loading || !allowed) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-stone">Loading…</div>
    );
  }

  return <>{children}</>;
}
