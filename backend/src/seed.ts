/**
 * Seed script — creates 2 managers, 2 venues, 3 customers, mixed events + votes.
 * Lagos / Nigeria flavoured demo data.
 * Requires schema.sql applied and SUPABASE_* env vars set.
 *
 * Usage: npm run seed
 */
import dotenv from "dotenv";
import { supabaseAdmin } from "./config/supabase";

dotenv.config();

const PASSWORD = "Password123!";

type SeedUser = {
  email: string;
  display_name: string;
  role: "customer" | "venue_manager";
};

const USERS: SeedUser[] = [
  { email: "manager1@example.com", display_name: "Tunde Adebayo", role: "venue_manager" },
  { email: "manager2@example.com", display_name: "Chioma Okeke", role: "venue_manager" },
  { email: "customer1@example.com", display_name: "Aisha Bello", role: "customer" },
  { email: "customer2@example.com", display_name: "Emeka Nwosu", role: "customer" },
  { email: "customer3@example.com", display_name: "Funke Adeyemi", role: "customer" },
];

async function findOrCreateUser(u: SeedUser): Promise<string> {
  const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existing = listed?.users?.find(
    (x) => x.email?.toLowerCase() === u.email.toLowerCase()
  );

  let userId: string;
  if (existing) {
    userId = existing.id;
    console.log(`  auth user exists: ${u.email}`);
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create auth user ${u.email}: ${error?.message}`);
    }
    userId = data.user.id;
    console.log(`  created auth user: ${u.email}`);
  }

  const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      email: u.email.toLowerCase(),
      role: u.role,
      display_name: u.display_name,
    },
    { onConflict: "id" }
  );
  if (upsertError) {
    throw new Error(`Failed to upsert profile ${u.email}: ${upsertError.message}`);
  }

  return userId;
}

async function main() {
  console.log("Seeding Community Event Platform (Lagos)…\n");

  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.email] = await findOrCreateUser(u);
  }

  // Clear dependent data for a clean demo (order matters)
  await supabaseAdmin.from("votes").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("venues").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: venues, error: venueError } = await supabaseAdmin
    .from("venues")
    .insert([
      {
        name: "Ikeja City Mall Courtyard",
        description:
          "Open courtyard by Allen Avenue — great for evening hangouts, pop-ups, and live sets.",
        manager_id: ids["manager1@example.com"],
      },
      {
        name: "Yaba Tech Hub Hall",
        description:
          "Community hall near Tejuosho — workshops, open mics, and campus-adjacent meetups.",
        manager_id: ids["manager2@example.com"],
      },
    ])
    .select("*");

  if (venueError || !venues || venues.length < 2) {
    throw new Error(`Failed to create venues: ${venueError?.message}`);
  }

  const [ikeja, yaba] = venues;
  console.log(`  venues: ${ikeja.name}, ${yaba.name}`);

  const c1 = ids["customer1@example.com"];
  const c2 = ids["customer2@example.com"];
  const c3 = ids["customer3@example.com"];

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const { data: events, error: eventError } = await supabaseAdmin
    .from("events")
    .insert([
      {
        title: "Afrobeats Friday at Ikeja",
        description:
          "Local DJs and dancers — come through after work. Soft drinks and suya vendors nearby.",
        proposed_at: new Date(now + 14 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c1,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Lagos Developers Meetup",
        description:
          "Talks on mobile money APIs and side projects. Laptops welcome; Mentors from Yaba.",
        proposed_at: new Date(now + 21 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c2,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Yaba Open Mic Night",
        description:
          "Poetry, acoustic sets, and comedy — 5-minute slots. Sign up at the door.",
        proposed_at: new Date(now + 10 * day).toISOString(),
        venue_id: yaba.id,
        suggested_by: c1,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Tejuosho Weekend Market Walk",
        description:
          "Already approved — stroll Tejuosho with local makers and fabric stalls.",
        proposed_at: new Date(now + 7 * day).toISOString(),
        venue_id: yaba.id,
        suggested_by: c3,
        status: "approved",
        upvote_count: 0,
      },
      {
        title: "All-Night Drum Session",
        description:
          "Rejected seed example — too loud for nearby Allen Avenue residents after 10pm.",
        proposed_at: new Date(now + 5 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c2,
        status: "rejected",
        upvote_count: 0,
      },
    ])
    .select("*");

  if (eventError || !events) {
    throw new Error(`Failed to create events: ${eventError?.message}`);
  }

  // Afrobeats: 3 votes (sorts first in Ikeja queue)
  // Developers Meetup: 1 vote
  // Open Mic: 2 votes
  const afrobeats = events.find((e) => e.title.startsWith("Afrobeats"));
  const meetup = events.find((e) => e.title.startsWith("Lagos Developers"));
  const mic = events.find((e) => e.title.startsWith("Yaba Open"));

  const votePairs: Array<[string, string]> = [
    [c1, afrobeats!.id],
    [c2, afrobeats!.id],
    [c3, afrobeats!.id],
    [c1, meetup!.id],
    [c2, mic!.id],
    [c3, mic!.id],
  ];

  for (const [userId, eventId] of votePairs) {
    const { error } = await supabaseAdmin.from("votes").insert({
      user_id: userId,
      event_id: eventId,
    });
    if (error) throw new Error(`Vote insert failed: ${error.message}`);
  }

  await supabaseAdmin.from("events").update({ upvote_count: 3 }).eq("id", afrobeats!.id);
  await supabaseAdmin.from("events").update({ upvote_count: 1 }).eq("id", meetup!.id);
  await supabaseAdmin.from("events").update({ upvote_count: 2 }).eq("id", mic!.id);

  console.log("\nSeed complete.\n");
  console.log("Login accounts (password for all: Password123!):");
  console.log("  manager1@example.com  — Ikeja City Mall Courtyard");
  console.log("  manager2@example.com  — Yaba Tech Hub Hall");
  console.log("  customer1@example.com");
  console.log("  customer2@example.com");
  console.log("  customer3@example.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
