import type { EventStatus } from "../types";
import { AppError } from "./errors";

// only pending → approved | rejected
export function assertCanTransition(from: EventStatus, to: EventStatus): void {
  if (from !== "pending") {
    throw new AppError(
      `Cannot change status from '${from}' to '${to}'. Only pending events can be approved or rejected.`,
      409,
      "INVALID_STATUS_TRANSITION"
    );
  }
  if (to !== "approved" && to !== "rejected") {
    throw new AppError(`Invalid target status '${to}'`, 400, "INVALID_STATUS");
  }
}

export function canResubmit(_status: EventStatus): boolean {
  return false; // no resubmit — make a new suggestion
}
