import { supabaseAdmin } from "../config/supabase";
import type { EventRow } from "../types";
import { AppError } from "../utils/errors";

async function loadEvent(eventId: string): Promise<EventRow> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    console.error("[votes.loadEvent]", error);
    throw new AppError("Failed to load event", 500);
  }
  if (!data) {
    throw new AppError("Event not found", 404);
  }
  return data as EventRow;
}

export async function addVote(userId: string, eventId: string) {
  const event = await loadEvent(eventId);

  const { error: insertError } = await supabaseAdmin.from("votes").insert({
    user_id: userId,
    event_id: eventId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      throw new AppError("You have already voted for this event", 409, "DUPLICATE_VOTE");
    }
    console.error("[addVote insert]", insertError);
    throw new AppError("Failed to cast vote", 500);
  }

  const { data, error: updateError } = await supabaseAdmin
    .from("events")
    .update({ upvote_count: event.upvote_count + 1 })
    .eq("id", eventId)
    .select("*")
    .single();

  if (updateError) {
    console.error("[addVote update]", updateError);
    await supabaseAdmin.from("votes").delete().eq("user_id", userId).eq("event_id", eventId);
    throw new AppError("Failed to update vote count", 500);
  }

  return data;
}

export async function removeVote(userId: string, eventId: string) {
  const event = await loadEvent(eventId);

  const { data: deleted, error: deleteError } = await supabaseAdmin
    .from("votes")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .select("user_id");

  if (deleteError) {
    console.error("[removeVote]", deleteError);
    throw new AppError("Failed to remove vote", 500);
  }

  if (!deleted || deleted.length === 0) {
    throw new AppError("You have not voted for this event", 404, "VOTE_NOT_FOUND");
  }

  const nextCount = Math.max(0, event.upvote_count - 1);
  const { data, error: updateError } = await supabaseAdmin
    .from("events")
    .update({ upvote_count: nextCount })
    .eq("id", eventId)
    .select("*")
    .single();

  if (updateError) {
    console.error("[removeVote update]", updateError);
    throw new AppError("Failed to update vote count", 500);
  }

  return data;
}

export async function getVotedEventIds(
  userId: string,
  eventIds: string[]
): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();

  const { data, error } = await supabaseAdmin
    .from("votes")
    .select("event_id")
    .eq("user_id", userId)
    .in("event_id", eventIds);

  if (error) {
    console.error("[getVotedEventIds]", error);
    throw new AppError("Failed to load votes", 500);
  }

  return new Set((data ?? []).map((v) => v.event_id as string));
}
