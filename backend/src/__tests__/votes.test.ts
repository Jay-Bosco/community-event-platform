import { describe, expect, it } from "vitest";

// one vote per user per event (same idea as the DB unique constraint)
describe("vote integrity contract", () => {
  it("defines one vote per user per event", () => {
    const votes = new Set<string>();
    const key = (userId: string, eventId: string) => `${userId}:${eventId}`;

    const cast = (userId: string, eventId: string) => {
      const k = key(userId, eventId);
      if (votes.has(k)) {
        return { ok: false as const, code: "DUPLICATE_VOTE" };
      }
      votes.add(k);
      return { ok: true as const };
    };

    expect(cast("u1", "e1").ok).toBe(true);
    expect(cast("u1", "e1").ok).toBe(false);
    expect(cast("u1", "e1").code).toBe("DUPLICATE_VOTE");
    expect(cast("u2", "e1").ok).toBe(true);
    expect(cast("u1", "e2").ok).toBe(true);
  });

  it("allows remove then re-vote", () => {
    const votes = new Set<string>();
    const key = (userId: string, eventId: string) => `${userId}:${eventId}`;

    votes.add(key("u1", "e1"));
    votes.delete(key("u1", "e1"));
    expect(votes.has(key("u1", "e1"))).toBe(false);
    votes.add(key("u1", "e1"));
    expect(votes.has(key("u1", "e1"))).toBe(true);
  });
});
