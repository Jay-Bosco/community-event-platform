import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import type { Profile, UserRole } from "../types";
import { supabaseAdmin } from "../config/supabase";
import { AppError, sendError } from "../utils/errors";

export interface AuthRequest extends Request {
  user?: User;
  accessToken?: string;
  profile?: Profile;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError("Access token required", 401);
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new AppError("Invalid or expired token", 401);
    }

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (err) {
    sendError(res, err);
  }
}

export async function loadProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("[loadProfile]", error);
      throw new AppError("Failed to load profile", 500);
    }
    if (!data) {
      throw new AppError("Profile not found", 404);
    }

    req.profile = data as Profile;
    next();
  } catch (err) {
    sendError(res, err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.profile) {
        throw new AppError("Profile required", 401);
      }
      if (!roles.includes(req.profile.role)) {
        throw new AppError(
          `Forbidden: requires role ${roles.join(" or ")}`,
          403,
          "FORBIDDEN_ROLE"
        );
      }
      next();
    } catch (err) {
      sendError(res, err);
    }
  };
}
