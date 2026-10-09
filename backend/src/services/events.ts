import { supabaseAdmin } from "../config/supabase";
import type { EventRow, EventStatus } from "../types";
import { AppError } from "../utils/errors";
import { assertCanTransition } from "../utils/status";
import { assertManagerOwnsVenue, listVenueIdsForManager } from "./venues";
import { getVotedEventIds } from "./votes";

export async function getEventById(id: string): Promise<EventRow | null> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getEventById]", error);
    throw new AppError("Failed to load event", 500);
  }
  return data as EventRow | null;
}

export async function createEvent(input: {
  title: string;
  description: string;
  proposed_at: string;
  venue_id: string;
  suggested_by: string;
}): Promise<EventRow> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({
      title: input.title,
      description: input.description,
      proposed_at: input.proposed_at,
      venue_id: input.venue_id,
      suggested_by: input.suggested_by,
      status: "pending",
      upvote_count: 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createEvent]", error);
    throw new AppError("Failed to create event", 500);
  }
  return data as EventRow;
}

export type EventListItem = EventRow & {
  venue_name: string;
  suggester_name: string;
  viewerHasVoted: boolean;
};

export async function listEvents(viewerId: string): Promise<EventListItem[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(
      `
      *,
      venues ( name ),
      profiles:suggested_by ( display_name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listEvents]", error);
    throw new AppError("Failed to list events", 500);
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const voted = await getVotedEventIds(viewerId, ids);

  return rows.map((row) => {
    const venues = row.venues as { name: string } | null;
    const profiles = row.profiles as { display_name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { venues: _v, profiles: _p, ...event } = row;
    return {
      ...(event as EventRow),
      venue_name: venues?.name ?? "Unknown venue",
      suggester_name: profiles?.display_name ?? "Unknown",
      viewerHasVoted: voted.has(row.id as string),
    };
  });
}

export async function listManagerQueue(managerId: string): Promise<EventListItem[]> {
  const venueIds = await listVenueIdsForManager(managerId);
  if (venueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(
      `
      *,
      venues ( name ),
      profiles:suggested_by ( display_name )
    `
    )
    .eq("status", "pending")
    .in("venue_id", venueIds)
    .order("upvote_count", { ascending: false });

  if (error) {
    console.error("[listManagerQueue]", error);
    throw new AppError("Failed to load approval queue", 500);
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const voted = await getVotedEventIds(managerId, ids);

  return rows.map((row) => {
    const venues = row.venues as { name: string } | null;
    const profiles = row.profiles as { display_name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { venues: _v, profiles: _p, ...event } = row;
    return {
      ...(event as EventRow),
      venue_name: venues?.name ?? "Unknown venue",
      suggester_name: profiles?.display_name ?? "Unknown",
      viewerHasVoted: voted.has(row.id as string),
    };
  });
}

export async function transitionEventStatus(
  managerId: string,
  eventId: string,
  to: Extract<EventStatus, "approved" | "rejected">
): Promise<EventRow> {
  const event = await getEventById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  await assertManagerOwnsVenue(managerId, event.venue_id);
  assertCanTransition(event.status, to);

  const { data, error } = await supabaseAdmin
    .from("events")
    .update({ status: to })
    .eq("id", eventId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[transitionEventStatus]", error);
    throw new AppError("Failed to update event status", 500);
  }
  if (!data) {
    throw new AppError(
      "Event is no longer pending",
      409,
      "INVALID_STATUS_TRANSITION"
    );
  }

  return data as EventRow;
}
