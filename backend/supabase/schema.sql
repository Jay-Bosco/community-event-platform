-- Community Event Platform schema
-- Run in Supabase SQL Editor after creating a project.
-- Disable Auth > Providers > Email > "Confirm email" for local/challenge signup without mailbox.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('customer', 'venue_manager')),
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Venues owned by a venue manager
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  manager_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists venues_manager_id_idx on public.venues (manager_id);

-- Event suggestions
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  proposed_at timestamptz not null,
  venue_id uuid not null references public.venues (id) on delete restrict,
  suggested_by uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  upvote_count integer not null default 0 check (upvote_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists events_venue_id_idx on public.events (venue_id);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_upvote_count_idx on public.events (upvote_count desc);

-- One vote per user per event
create table if not exists public.votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists votes_event_id_idx on public.votes (event_id);

-- API is the only data boundary: block direct table access for anon/authenticated.
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.votes enable row level security;

-- No policies for anon/authenticated → only service_role can read/write.
-- (service_role bypasses RLS)
