import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "../../features/auth/auth-context";
import { api, getToken, setToken } from "../../shared/api/client";
import type { Session, User } from "../../shared/api/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const [error, setError] = useState<unknown>();
  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(undefined);
    setLoading(false);
  }, []);
  const refresh = useCallback(async () => {
    const sessionToken = getToken();
    if (!sessionToken) {
      setLoading(false);
      return;
    }
    try {
      const current = await api<User>("/auth/me");
      if (getToken() === sessionToken) {
        setUser(current);
        setError(undefined);
      }
    } catch (e) {
      if (getToken() === sessionToken) setError(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener("kino:unauthorized", clear);
    const timer = setInterval(() => {
      void refresh();
    }, 60_000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("kino:unauthorized", clear);
    };
  }, [clear, refresh]);
  async function signIn(email: string, password: string) {
    const session = await api<Session>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(session.access_token);
    setUser(session.user);
    setError(undefined);
  }
  async function signOut() {
    await api<void>("/auth/logout", { method: "POST" });
    clear();
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, refresh, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
