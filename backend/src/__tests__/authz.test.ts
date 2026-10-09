import { describe, expect, it, vi } from "vitest";
import type { Response, NextFunction } from "express";
import { requireRole, type AuthRequest } from "../middleware/auth";
import type { Profile } from "../types";

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("requireRole middleware", () => {
  it("allows matching role", () => {
    const req = {
      profile: {
        id: "1",
        email: "c@example.com",
        role: "customer",
        display_name: "C",
        created_at: new Date().toISOString(),
      } satisfies Profile,
    } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole("customer")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it("blocks customer from venue_manager routes", () => {
    const req = {
      profile: {
        id: "1",
        email: "c@example.com",
        role: "customer",
        display_name: "C",
        created_at: new Date().toISOString(),
      } satisfies Profile,
    } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole("venue_manager")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect((res.body as { code?: string }).code).toBe("FORBIDDEN_ROLE");
  });

  it("blocks venue_manager from customer-only routes", () => {
    const req = {
      profile: {
        id: "2",
        email: "m@example.com",
        role: "venue_manager",
        display_name: "M",
        created_at: new Date().toISOString(),
      } satisfies Profile,
    } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole("customer")(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
