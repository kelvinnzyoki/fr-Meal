"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "./apiClient";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  startRegistration: (input: { fullName: string; phone: string; email: string; password: string }) => Promise<void>;
  verifyRegistration: (email: string, code: string) => Promise<User>;
  resendRegistrationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // `identifier` can be either a phone number or an email address — the
  // backend figures out which by checking for "@". Renamed from `phone` so
  // both login paths share one field end-to-end.
  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.post<{ user: User }>("/auth/login", { identifier, password });
    setUser(res.user);
    return res.user;
  }, []);

  // Step 1: emails a code, doesn't sign anyone in yet (no account exists
  // until the code is verified).
  const startRegistration = useCallback(
    async (input: { fullName: string; phone: string; email: string; password: string }) => {
      await api.post("/auth/register/start", input);
    },
    []
  );

  // Step 2: confirms the code, which is what actually creates the account.
  const verifyRegistration = useCallback(async (email: string, code: string) => {
    const res = await api.post<{ user: User }>("/auth/register/verify", { email, code });
    setUser(res.user);
    return res.user;
  }, []);

  const resendRegistrationCode = useCallback(async (email: string) => {
    await api.post("/auth/register/resend", { email });
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, startRegistration, verifyRegistration, resendRegistrationCode, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Turns any thrown error into text that's safe to show on screen.
//
// - ApiError: its `.message` is whatever the backend explicitly chose to
//   send back (e.g. "Invalid phone/email or password", a zod validation
//   message). The backend never puts raw DB/Prisma detail in that field, so
//   it's safe to surface directly.
// - Everything else (network failure, JSON parsing blowing up, an
//   unexpected JS exception) is NOT shown verbatim — those can contain
//   internal URLs, stack traces, or other details that have no business on
//   a login/signup screen. They get a generic fallback instead.
export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "message" in err && typeof (err as any).message === "string") {
    const msg = (err as any).message as string;
    if (/fetch|network|failed to fetch/i.test(msg)) {
      return "Can't reach the server right now. Check your connection and try again.";
    }
  }
  return "Something went wrong. Please try again.";
}
