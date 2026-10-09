import { supabaseAdmin } from "../config/supabase";
import type { Profile, UserRole } from "../types";
import { AppError } from "../utils/errors";

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getProfileById]", error);
    throw new AppError("Failed to load profile", 500);
  }
  return data as Profile | null;
}

export async function createProfile(input: {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
}): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: input.id,
      email: input.email.toLowerCase(),
      role: input.role,
      display_name: input.display_name,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createProfile]", error);
    throw new AppError("Failed to create profile", 500);
  }
  return data as Profile;
}
