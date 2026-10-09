import { Router } from "express";
import { z } from "zod";
import {
  authenticateToken,
  loadProfile,
  requireRole,
  type AuthRequest,
} from "../middleware/auth";
import { listManagerQueue, transitionEventStatus } from "../services/events";
import { sendError, sendOk } from "../utils/errors";

const router = Router();

router.get(
  "/queue",
  authenticateToken,
  loadProfile,
  requireRole("venue_manager"),
  async (req: AuthRequest, res) => {
    try {
      const events = await listManagerQueue(req.user!.id);
      return sendOk(res, { events });
    } catch (err) {
      return sendError(res, err);
    }
  }
);

router.post(
  "/events/:id/approve",
  authenticateToken,
  loadProfile,
  requireRole("venue_manager"),
  async (req: AuthRequest, res) => {
    try {
      const eventId = z.string().uuid().parse(req.params.id);
      const event = await transitionEventStatus(req.user!.id, eventId, "approved");
      return sendOk(res, { event });
    } catch (err) {
      return sendError(res, err);
    }
  }
);

router.post(
  "/events/:id/reject",
  authenticateToken,
  loadProfile,
  requireRole("venue_manager"),
  async (req: AuthRequest, res) => {
    try {
      const eventId = z.string().uuid().parse(req.params.id);
      const event = await transitionEventStatus(req.user!.id, eventId, "rejected");
      return sendOk(res, { event });
    } catch (err) {
      return sendError(res, err);
    }
  }
);

export default router;
