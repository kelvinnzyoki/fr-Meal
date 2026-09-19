"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "./apiClient";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
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

  const login = useCallback(async (phone: string, password: string) => {
    const res = await api.post<{ user: User }>("/auth/login", { phone, password });
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

export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
