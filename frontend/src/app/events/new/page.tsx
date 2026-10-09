"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { ApiError, createEvent, fetchVenues } from "@/lib/api";
import { flash } from "@/lib/flash";
import type { Venue } from "@/lib/types";

function SuggestForm() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedLocal, setProposedLocal] = useState("");
  const [venueId, setVenueId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVenues()
      .then((v) => {
        setVenues(v);
        if (v[0]) setVenueId(v[0].id);
      })
      .catch((err) => {
        flash.error(err instanceof ApiError ? err.message : "Failed to load venues");
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const proposed = new Date(proposedLocal);
      if (Number.isNaN(proposed.getTime())) {
        throw new ApiError("Invalid date/time", 400);
      }
      await createEvent({
        title,
        description,
        proposed_at: proposed.toISOString(),
        venue_id: venueId,
      });
      flash.successNext("Event suggestion submitted.");
      router.push("/events");
    } catch (err) {
      flash.error(err instanceof ApiError ? err.message : "Could not create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell py-8 sm:py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-ink">Suggest an event</h1>
          <p className="text-ink/60">
            Submitting puts it straight into the venue manager&apos;s queue as pending.
          </p>
        </div>
        <form onSubmit={onSubmit} className="panel space-y-4 p-5 sm:p-6">
          <label className="field">
            Title
            <input
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            Description
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="field">
            Proposed date &amp; time
            <input
              type="datetime-local"
              required
              value={proposedLocal}
              onChange={(e) => setProposedLocal(e.target.value)}
            />
          </label>
          <label className="field">
            Target venue
            <select
              required
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
            >
              {venues.length === 0 && <option value="">No venues available</option>}
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={loading || !venueId} className="btn btn-dark">
            {loading ? "Submitting…" : "Submit suggestion"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <RequireAuth role="customer">
      <SuggestForm />
    </RequireAuth>
  );
}
