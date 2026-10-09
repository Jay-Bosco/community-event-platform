import { describe, expect, it } from "vitest";
import { assertCanTransition, canResubmit } from "../utils/status";
import { AppError } from "../utils/errors";

describe("status transitions", () => {
  it("allows pending → approved", () => {
    expect(() => assertCanTransition("pending", "approved")).not.toThrow();
  });

  it("allows pending → rejected", () => {
    expect(() => assertCanTransition("pending", "rejected")).not.toThrow();
  });

  it("rejects approved → rejected", () => {
    expect(() => assertCanTransition("approved", "rejected")).toThrow(AppError);
  });

  it("rejects rejected → approved", () => {
    expect(() => assertCanTransition("rejected", "approved")).toThrow(AppError);
  });

  it("rejects pending → pending", () => {
    expect(() => assertCanTransition("pending", "pending")).toThrow(AppError);
  });

  it("does not allow resubmit of rejected events", () => {
    expect(canResubmit("rejected")).toBe(false);
    expect(canResubmit("approved")).toBe(false);
    expect(canResubmit("pending")).toBe(false);
  });
});
