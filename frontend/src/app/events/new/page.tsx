"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { ApiError, createEvent, fetchVenues } from "@/lib/api";
import { flash } from "@/lib/flash";
import type { Venue } from "@/lib/types";

function openPicker(el: HTMLInputElement) {
  const picker = el as HTMLInputElement & { showPicker?: () => void };
  if (typeof picker.showPicker === "function") {
    try {
      picker.showPicker();
    } catch {
      // ignore
    }
  }
}

function SuggestForm() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
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
      if (!proposedDate || !proposedTime) {
        throw new ApiError("Please choose a date and time", 400);
      }
      const proposed = new Date(`${proposedDate}T${proposedTime}`);
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
    <div className="page-shell py-6 sm:py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Suggest an event</h1>
          <p className="text-sm text-ink/60 sm:text-base">
            Submitting puts it straight into the venue manager&apos;s queue as pending.
          </p>
        </div>
        <form onSubmit={onSubmit} className="panel space-y-4 p-4 sm:p-6">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="proposed-date">Proposed date</label>
              <input
                id="proposed-date"
                type="date"
                required
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                onClick={(e) => openPicker(e.currentTarget)}
                onFocus={(e) => openPicker(e.currentTarget)}
                className="datetime-input"
              />
            </div>
            <div className="field">
              <label htmlFor="proposed-time">Proposed time</label>
              <input
                id="proposed-time"
                type="time"
                required
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                onClick={(e) => openPicker(e.currentTarget)}
                onFocus={(e) => openPicker(e.currentTarget)}
                className="datetime-input"
              />
            </div>
          </div>

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
          <button type="submit" disabled={loading || !venueId} className="btn btn-dark w-full sm:w-auto">
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
