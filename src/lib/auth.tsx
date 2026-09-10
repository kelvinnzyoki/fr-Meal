"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "./apiClient";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (input: { fullName: string; phone: string; email?: string; password: string }) => Promise<User>;
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

  const register = useCallback(
    async (input: { fullName: string; phone: string; email?: string; password: string }) => {
      const res = await api.post<{ user: User }>("/auth/register", input);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
