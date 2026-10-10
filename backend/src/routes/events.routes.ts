import { Router } from "express";
import { z } from "zod";
import {
  authenticateToken,
  loadProfile,
  requireRole,
  type AuthRequest,
} from "../middleware/auth";
import { createEvent, listEvents } from "../services/events";
import { getVenueById } from "../services/venues";
import { addVote, removeVote } from "../services/votes";
import { AppError, sendError, sendOk } from "../utils/errors";

const router = Router();

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  proposed_at: z
    .string()
    .min(1)
    .refine((s) => !Number.isNaN(Date.parse(s)), {
      message: "proposed_at must be a valid ISO datetime",
    }),
  venue_id: z.string().uuid(),
});

router.get(
  "/",
  authenticateToken,
  loadProfile,
  async (req: AuthRequest, res) => {
    try {
      const events = await listEvents(req.user!.id);
      return sendOk(res, { events });
    } catch (err) {
      return sendError(res, err);
    }
  }
);

router.post(
  "/",
  authenticateToken,
  loadProfile,
  requireRole("customer"),
  async (req: AuthRequest, res) => {
    try {
      const body = createSchema.parse(req.body);

      const proposed = new Date(body.proposed_at);
      if (Number.isNaN(proposed.getTime())) {
        throw new AppError("Invalid proposed_at datetime", 400);
      }

      const venue = await getVenueById(body.venue_id);
      if (!venue) {
        throw new AppError("Target venue not found", 404);
      }

      // status defaults to pending → shows up in the manager queue
      const event = await createEvent({
        title: body.title,
        description: body.description,
        proposed_at: proposed.toISOString(),
        venue_id: body.venue_id,
        suggested_by: req.user!.id,
      });

      return sendOk(res, { event }, 201);
    } catch (err) {
      return sendError(res, err);
    }
  }
);

router.post(
  "/:id/vote",
  authenticateToken,
  loadProfile,
  requireRole("customer"),
  async (req: AuthRequest, res) => {
    try {
      const eventId = z.string().uuid().parse(req.params.id);
      const event = await addVote(req.user!.id, eventId);
      return sendOk(res, { event });
    } catch (err) {
      return sendError(res, err);
    }
  }
);

router.delete(
  "/:id/vote",
  authenticateToken,
  loadProfile,
  requireRole("customer"),
  async (req: AuthRequest, res) => {
    try {
      const eventId = z.string().uuid().parse(req.params.id);
      const event = await removeVote(req.user!.id, eventId);
      return sendOk(res, { event });
    } catch (err) {
      return sendError(res, err);
    }
  }
);

export default router;
