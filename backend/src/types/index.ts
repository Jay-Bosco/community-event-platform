export type UserRole = "customer" | "venue_manager";
export type EventStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  manager_id: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  description: string;
  proposed_at: string;
  venue_id: string;
  suggested_by: string;
  status: EventStatus;
  upvote_count: number;
  created_at: string;
}

export interface Vote {
  user_id: string;
  event_id: string;
  created_at: string;
}
