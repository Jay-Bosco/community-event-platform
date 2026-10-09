"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearSession as clearSessionStore,
  getSession,
  subscribeSession,
  touchSessionActivity,
} from "@/lib/session";
import type { Session } from "@/lib/types";

type SessionContextValue = {
  session: Session | null;
  ready: boolean;
  refresh: () => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    refresh();
    if (getSession()) touchSessionActivity();
    setReady(true);
    return subscribeSession(refresh);
  }, [refresh]);

  const logout = useCallback(() => {
    clearSessionStore();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, refresh, logout }),
    [session, ready, refresh, logout]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
