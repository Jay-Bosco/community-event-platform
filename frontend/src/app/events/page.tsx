"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, fetchEvents, removeUpvote, upvote } from "@/lib/api";
import { flash } from "@/lib/flash";
import { getSession } from "@/lib/session";
import type { EventItem } from "@/lib/types";

function EventsList() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const role = getSession()?.user.role;

  const load = useCallback(async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleVote(event: EventItem) {
    if (role !== "customer") return;
    setBusyId(event.id);
    try {
      const updated = event.viewerHasVoted
        ? await removeUpvote(event.id)
        : await upvote(event.id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                upvote_count: updated.upvote_count,
                viewerHasVoted: !event.viewerHasVoted,
              }
            : e
        )
      );
      flash.success(event.viewerHasVoted ? "Upvote removed." : "Upvoted.");
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Vote failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-shell space-y-6 py-6 sm:space-y-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Suggested events</h1>
          <p className="max-w-xl text-sm text-ink/60 sm:text-base">
            Browse ideas, check status, and upvote what you want next.
          </p>
        </div>
        {role === "customer" && (
          <Link href="/events/new" className="btn btn-dark w-full sm:w-auto">
            Suggest event
          </Link>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-ink/50">No events yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="surface-list">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{event.title}</h2>
                  <p className="text-sm leading-relaxed text-ink/65 wrap-break-word">{event.description}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              <dl className="mt-4 grid gap-2 text-sm text-ink/65 sm:grid-cols-2 wrap-break-word">
                <div>
                  <dt className="inline text-ink/40">Venue </dt>
                  <dd className="inline font-medium text-ink/80">{event.venue_name}</dd>
                </div>
                <div>
                  <dt className="inline text-ink/40">Proposed </dt>
                  <dd className="inline font-medium text-ink/80">
                    {new Date(event.proposed_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-ink/40">Suggested by </dt>
                  <dd className="inline font-medium text-ink/80">{event.suggester_name}</dd>
                </div>
                <div>
                  <dt className="inline text-ink/40">Upvotes </dt>
                  <dd className="inline font-semibold text-ink">{event.upvote_count}</dd>
                </div>
              </dl>
              {role === "customer" && (
                <button
                  type="button"
                  disabled={busyId === event.id}
                  onClick={() => void toggleVote(event)}
                  className={`btn mt-4 w-full sm:w-auto ${
                    event.viewerHasVoted ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {event.viewerHasVoted ? "Remove upvote" : "Upvote"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <RequireAuth role="customer">
      <EventsList />
    </RequireAuth>
  );
}
