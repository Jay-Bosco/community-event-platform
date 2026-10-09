"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, approveEvent, fetchManagerQueue, rejectEvent } from "@/lib/api";
import { flash } from "@/lib/flash";
import type { EventItem } from "@/lib/types";

function Queue() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchManagerQueue();
      setEvents(data);
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      if (action === "approve") await approveEvent(id);
      else await rejectEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      flash.success(action === "approve" ? "Event approved." : "Event rejected.");
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-shell space-y-8 py-8 sm:py-12">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold text-ink">Approval queue</h1>
        <p className="max-w-xl text-ink/60">
          Pending suggestions for your venue(s), highest upvotes first.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] bg-white/60 px-5 py-10 text-sm text-ink/50">
          No pending suggestions.
        </p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="surface-list">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-display text-xl font-semibold text-ink">{event.title}</h2>
                  <p className="text-sm leading-relaxed text-ink/65">{event.description}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              <p className="mt-3 text-sm text-ink/55">
                <span className="font-medium text-ink/80">{event.venue_name}</span>
                {" · "}
                {event.upvote_count} upvotes · suggested by {event.suggester_name} ·{" "}
                {new Date(event.proposed_at).toLocaleString()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === event.id}
                  onClick={() => void act(event.id, "approve")}
                  className="btn btn-ok"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === event.id}
                  onClick={() => void act(event.id, "reject")}
                  className="btn btn-danger"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ManagerQueuePage() {
  return (
    <RequireAuth role="venue_manager">
      <Queue />
    </RequireAuth>
  );
}
