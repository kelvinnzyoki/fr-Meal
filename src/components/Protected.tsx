"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { User } from "@/types";

// Wraps a page that requires a signed-in user of a specific role. Renders
// nothing (or a spinner) until the /auth/me check resolves, then redirects
// rather than flashing protected content to the wrong audience.
export function Protected({ role, children }: { role: User["role"]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== role)) {
      router.replace("/login");
    }
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-stone">Loading…</div>
    );
  }

  return <>{children}</>;
}
