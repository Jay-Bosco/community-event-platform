import { supabaseAdmin } from "../config/supabase";
import type { Venue } from "../types";
import { AppError } from "../utils/errors";

export async function listVenues(): Promise<Venue[]> {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[listVenues]", error);
    throw new AppError("Failed to list venues", 500);
  }
  return (data ?? []) as Venue[];
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getVenueById]", error);
    throw new AppError("Failed to load venue", 500);
  }
  return data as Venue | null;
}

export async function listVenueIdsForManager(managerId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("id")
    .eq("manager_id", managerId);

  if (error) {
    console.error("[listVenueIdsForManager]", error);
    throw new AppError("Failed to load manager venues", 500);
  }
  return (data ?? []).map((v) => v.id as string);
}

export async function assertManagerOwnsVenue(
  managerId: string,
  venueId: string
): Promise<Venue> {
  const venue = await getVenueById(venueId);
  if (!venue) {
    throw new AppError("Venue not found", 404);
  }
  if (venue.manager_id !== managerId) {
    throw new AppError("You do not manage this venue", 403, "VENUE_FORBIDDEN");
  }
  return venue;
}
