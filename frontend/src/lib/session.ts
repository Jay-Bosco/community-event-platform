import type { Profile, Session, Tokens } from "./types";

// sessionStorage = same tab only (refresh ok, new tab = logged out)
const TAB_KEY = "cep_session_tab";
const LEGACY_LOCAL_KEY = "cep_session";

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const SESSION_EVENT = "cep-session";
const IDLE_EVENT = "cep-idle-logout";

let memorySession: Session | null | undefined;
let lastActivityAt = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

function emitSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function clearIdleTimer() {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function scheduleIdleTimer() {
  if (typeof window === "undefined") return;
  clearIdleTimer();
  if (!getSession()) return;

  idleTimer = setTimeout(() => {
    if (!getSession()) return;
    memorySession = null;
    try {
      sessionStorage.removeItem(TAB_KEY);
    } catch {
      // ignore
    }
    clearIdleTimer();
    emitSessionChange();
    window.dispatchEvent(new Event(IDLE_EVENT));
  }, IDLE_TIMEOUT_MS);
}

function purgeLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_LOCAL_KEY);
  } catch {
    // ignore
  }
}

function readTabSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TAB_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeTabSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) sessionStorage.removeItem(TAB_KEY);
    else sessionStorage.setItem(TAB_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

purgeLegacyLocalStorage();

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const stored = readTabSession();
  if (stored) {
    memorySession = stored;
    return stored;
  }
  memorySession = null;
  return null;
}

export function saveSession(session: Session) {
  purgeLegacyLocalStorage();
  memorySession = session;
  writeTabSession(session);
  touchSessionActivity();
  emitSessionChange();
}

export function clearSession() {
  memorySession = null;
  writeTabSession(null);
  clearIdleTimer();
  purgeLegacyLocalStorage();
  emitSessionChange();
}

export function getAccessToken(): string | null {
  return getSession()?.tokens.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return getSession()?.tokens.refresh_token ?? null;
}

export function updateTokens(tokens: Tokens, user?: Profile) {
  const current = getSession();
  if (!current) return;
  const next = {
    user: user ?? current.user,
    tokens,
  };
  memorySession = next;
  writeTabSession(next);
  touchSessionActivity();
  emitSessionChange();
}

export function touchSessionActivity() {
  if (!getSession()) return;
  lastActivityAt = Date.now();
  scheduleIdleTimer();
}

export function getLastActivityAt() {
  return lastActivityAt;
}

export function subscribeSession(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_EVENT, handler);
  return () => window.removeEventListener(SESSION_EVENT, handler);
}

export function subscribeIdleLogout(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(IDLE_EVENT, handler);
  return () => window.removeEventListener(IDLE_EVENT, handler);
}
