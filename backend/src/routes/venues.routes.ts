import { Router } from "express";
import { authenticateToken, loadProfile, type AuthRequest } from "../middleware/auth";
import { listVenues } from "../services/venues";
import { sendError, sendOk } from "../utils/errors";

const router = Router();

router.get("/", authenticateToken, loadProfile, async (_req: AuthRequest, res) => {
  try {
    const venues = await listVenues();
    return sendOk(res, { venues });
  } catch (err) {
    return sendError(res, err);
  }
});

export default router;
