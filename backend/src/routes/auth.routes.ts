import { Router } from "express";
import { z } from "zod";
import { supabase, supabaseAdmin } from "../config/supabase";
import {
  authenticateToken,
  loadProfile,
  type AuthRequest,
} from "../middleware/auth";
import { createProfile, getProfileById } from "../services/profiles";
import { AppError, sendError, sendOk } from "../utils/errors";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a symbol")
    .regex(/[A-Z]/, "Password must include an uppercase letter"),
  display_name: z.string().trim().min(1).max(100),
  role: z.enum(["customer", "venue_manager"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

function tokensFromSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
} | null) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();

    // createUser so we don't hit signup email limits
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      });

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        throw new AppError("An account with this email already exists", 409);
      }
      throw new AppError(createError.message, 400);
    }
    if (!created.user) {
      throw new AppError("Registration failed", 500);
    }

    let profile;
    try {
      profile = await createProfile({
        id: created.user.id,
        email,
        role: body.role,
        display_name: body.display_name,
      });
    } catch (profileErr) {
      // don't leave a user without a profile
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw profileErr;
    }

    // sign in right away so signup returns tokens
    let session = (
      await supabase.auth.signInWithPassword({
        email,
        password: body.password,
      })
    ).data.session;

    if (!session) {
      // sometimes auth needs a beat after createUser
      await new Promise((r) => setTimeout(r, 250));
      const retry = await supabase.auth.signInWithPassword({
        email,
        password: body.password,
      });
      session = retry.data.session;
    }

    if (!session) {
      throw new AppError(
        "Account created but automatic login failed. Please log in.",
        500
      );
    }

    return sendOk(
      res,
      {
        user: profile,
        tokens: tokensFromSession(session),
      },
      201
    );
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email.toLowerCase(),
      password: body.password,
    });

    if (error || !data.user) {
      throw new AppError("Invalid email or password", 401);
    }

    const profile = await getProfileById(data.user.id);
    if (!profile) {
      throw new AppError("Profile not found for this account", 404);
    }

    return sendOk(res, {
      user: profile,
      tokens: tokensFromSession(data.session),
    });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const body = refreshSchema.parse(req.body);
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: body.refresh_token,
    });

    if (error || !data.session || !data.user) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const profile = await getProfileById(data.user.id);
    if (!profile) {
      throw new AppError("Profile not found", 404);
    }

    return sendOk(res, {
      user: profile,
      tokens: tokensFromSession(data.session),
    });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/me", authenticateToken, loadProfile, (req: AuthRequest, res) => {
  return sendOk(res, { user: req.profile });
});

export default router;
