import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSession,
  saveSession,
  updateTokens,
} from "./session";
import type { EventItem, Profile, Session, Venue } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4210";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  const session = getSession();
  if (!refreshToken || !session) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiResponse<{
      user: Profile;
      tokens: Session["tokens"];
    }>;
    if (!payload.data?.tokens?.access_token) return null;
    updateTokens(payload.data.tokens, payload.data.user);
    return payload.data.tokens.access_token;
  } catch {
    return null;
  }
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    _retried?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, _retried = false } = options;
  const token = options.token === undefined ? getAccessToken() : options.token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach API. Is the backend running?", 0);
  }

  if (response.status === 401 && !_retried && token) {
    const next = await refreshAccessToken();
    if (next) {
      return apiRequest<T>(path, { ...options, token: next, _retried: true });
    }
    clearSession();
  }

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok) {
    const detail =
      payload.errors?.map((e) => e.message).join("; ") ||
      payload.message ||
      "Request failed";
    throw new ApiError(detail, response.status, payload.code);
  }

  return payload.data as T;
}

export async function register(input: {
  email: string;
  password: string;
  display_name: string;
  role: "customer" | "venue_manager";
}): Promise<Session> {
  const data = await apiRequest<{ user: Profile; tokens: Session["tokens"] | null }>(
    "/api/auth/register",
    { method: "POST", body: input, token: null }
  );

  if (data.tokens?.access_token && data.tokens.refresh_token) {
    const session = { user: data.user, tokens: data.tokens };
    saveSession(session);
    return session;
  }

  // Always finish signup logged in — fall back to password login if tokens missing
  return login(input.email, input.password);
}

export async function login(email: string, password: string): Promise<Session> {
  const data = await apiRequest<{ user: Profile; tokens: Session["tokens"] }>(
    "/api/auth/login",
    { method: "POST", body: { email, password }, token: null }
  );
  const session = { user: data.user, tokens: data.tokens };
  saveSession(session);
  return session;
}

export async function fetchMe(): Promise<Profile> {
  const data = await apiRequest<{ user: Profile }>("/api/auth/me");
  return data.user;
}

export async function fetchVenues(): Promise<Venue[]> {
  const data = await apiRequest<{ venues: Venue[] }>("/api/venues");
  return data.venues;
}

export async function fetchEvents(): Promise<EventItem[]> {
  const data = await apiRequest<{ events: EventItem[] }>("/api/events");
  return data.events;
}

export async function createEvent(input: {
  title: string;
  description: string;
  proposed_at: string;
  venue_id: string;
}): Promise<EventItem> {
  const data = await apiRequest<{ event: EventItem }>("/api/events", {
    method: "POST",
    body: input,
  });
  return data.event;
}

export async function upvote(eventId: string): Promise<EventItem> {
  const data = await apiRequest<{ event: EventItem }>(`/api/events/${eventId}/vote`, {
    method: "POST",
  });
  return data.event;
}

export async function removeUpvote(eventId: string): Promise<EventItem> {
  const data = await apiRequest<{ event: EventItem }>(`/api/events/${eventId}/vote`, {
    method: "DELETE",
  });
  return data.event;
}

export async function fetchManagerQueue(): Promise<EventItem[]> {
  const data = await apiRequest<{ events: EventItem[] }>("/api/manager/queue");
  return data.events;
}

export async function approveEvent(eventId: string): Promise<EventItem> {
  const data = await apiRequest<{ event: EventItem }>(
    `/api/manager/events/${eventId}/approve`,
    { method: "POST" }
  );
  return data.event;
}

export async function rejectEvent(eventId: string): Promise<EventItem> {
  const data = await apiRequest<{ event: EventItem }>(
    `/api/manager/events/${eventId}/reject`,
    { method: "POST" }
  );
  return data.event;
}
