// seed demo users + Lagos venues/events. needs schema + env. run: npm run seed
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
  { email: "customer4@example.com", display_name: "Kemi Olawale", role: "customer" },
  { email: "customer5@example.com", display_name: "Sola Ibrahim", role: "customer" },
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

function byTitle(events: Array<{ id: string; title: string }>, prefix: string) {
  const hit = events.find((e) => e.title.startsWith(prefix));
  if (!hit) throw new Error(`Seed event missing: ${prefix}`);
  return hit;
}

async function main() {
  console.log("Seeding Community Event Platform (Lagos)…\n");

  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.email] = await findOrCreateUser(u);
  }

  // wipe old demo rows first
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
  const c4 = ids["customer4@example.com"];
  const c5 = ids["customer5@example.com"];

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
          "Talks on mobile money APIs and side projects. Laptops welcome; mentors from Yaba.",
        proposed_at: new Date(now + 21 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c2,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Allen Avenue Food Pop-up",
        description:
          "Small-chop stalls and soft drinks after office hours. Family-friendly.",
        proposed_at: new Date(now + 12 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c4,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Saturday Morning Yoga",
        description: "Beginner session in the courtyard before the mall gets busy.",
        proposed_at: new Date(now + 9 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c5,
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
        title: "UI/UX Design Critique",
        description: "Bring a Figma file or phone prototype — friendly feedback from peers.",
        proposed_at: new Date(now + 16 * day).toISOString(),
        venue_id: yaba.id,
        suggested_by: c2,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Surulere Film Club Screening",
        description: "Nollywood short films + short discussion. Seating is limited.",
        proposed_at: new Date(now + 18 * day).toISOString(),
        venue_id: yaba.id,
        suggested_by: c3,
        status: "pending",
        upvote_count: 0,
      },
      {
        title: "Tejuosho Weekend Market Walk",
        description: "Approved — stroll Tejuosho with local makers and fabric stalls.",
        proposed_at: new Date(now + 7 * day).toISOString(),
        venue_id: yaba.id,
        suggested_by: c3,
        status: "approved",
        upvote_count: 0,
      },
      {
        title: "Lekki Art & Craft Fair",
        description: "Approved showcase of painters and beadwork — weekend afternoon.",
        proposed_at: new Date(now + 11 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c4,
        status: "approved",
        upvote_count: 0,
      },
      {
        title: "All-Night Drum Session",
        description: "Rejected — too loud for nearby Allen Avenue residents after 10pm.",
        proposed_at: new Date(now + 5 * day).toISOString(),
        venue_id: ikeja.id,
        suggested_by: c2,
        status: "rejected",
        upvote_count: 0,
      },
      {
        title: "Midnight Hackathon",
        description: "Rejected — hall booking ends at 9pm; overnight use not allowed.",
        proposed_at: new Date(now + 8 * day).toISOString(),
        venue_id: yaba.id,
        suggested_by: c5,
        status: "rejected",
        upvote_count: 0,
      },
    ])
    .select("*");

  if (eventError || !events) {
    throw new Error(`Failed to create events: ${eventError?.message}`);
  }

  const afrobeats = byTitle(events, "Afrobeats");
  const meetup = byTitle(events, "Lagos Developers");
  const food = byTitle(events, "Allen Avenue");
  const yoga = byTitle(events, "Saturday Morning");
  const mic = byTitle(events, "Yaba Open");
  const critique = byTitle(events, "UI/UX");
  const film = byTitle(events, "Surulere Film");
  const market = byTitle(events, "Tejuosho");
  const art = byTitle(events, "Lekki Art");
  const drums = byTitle(events, "All-Night");
  const hack = byTitle(events, "Midnight Hackathon");

  // vote counts for queue sorting (pending ones matter most)
  const votePairs: Array<[string, string]> = [
    [c1, afrobeats.id],
    [c2, afrobeats.id],
    [c3, afrobeats.id],
    [c4, afrobeats.id],
    [c5, afrobeats.id],
    [c1, meetup.id],
    [c2, meetup.id],
    [c1, food.id],
    [c3, food.id],
    [c4, food.id],
    [c5, food.id],
    [c2, yoga.id],
    [c2, mic.id],
    [c3, mic.id],
    [c4, mic.id],
    [c1, critique.id],
    [c2, critique.id],
    [c3, critique.id],
    [c5, critique.id],
    [c1, film.id],
    [c4, film.id],
    [c1, market.id],
    [c2, market.id],
    [c3, art.id],
    [c1, drums.id],
    [c2, hack.id],
  ];

  for (const [userId, eventId] of votePairs) {
    const { error } = await supabaseAdmin.from("votes").insert({
      user_id: userId,
      event_id: eventId,
    });
    if (error) throw new Error(`Vote insert failed: ${error.message}`);
  }

  const counts: Array<[string, number]> = [
    [afrobeats.id, 5],
    [meetup.id, 2],
    [food.id, 4],
    [yoga.id, 1],
    [mic.id, 3],
    [critique.id, 4],
    [film.id, 2],
    [market.id, 2],
    [art.id, 1],
    [drums.id, 1],
    [hack.id, 1],
  ];

  for (const [id, upvote_count] of counts) {
    const { error } = await supabaseAdmin.from("events").update({ upvote_count }).eq("id", id);
    if (error) throw new Error(`Failed to set upvote_count: ${error.message}`);
  }

  console.log(`  events: ${events.length} (mixed pending / approved / rejected)`);
  console.log("\nSeed complete.\n");
  console.log("Login accounts (password for all: Password123!):");
  console.log("  manager1@example.com  — Ikeja City Mall Courtyard");
  console.log("  manager2@example.com  — Yaba Tech Hub Hall");
  console.log("  customer1@example.com … customer5@example.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
