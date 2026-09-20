"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: User }>("/auth/me");
      setUser(result.user);
    } catch (error) {
      if (!(error instanceof ApiError) || ![401, 403].includes(error.status))
        console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(result.user);
  }, []);
  const signup = useCallback(async (email: string, password: string) => {
    await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }, []);
  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);
  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refresh }),
    [user, loading, login, signup, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
