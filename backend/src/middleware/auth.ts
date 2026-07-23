import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { fail } from "../lib/response.js";

export type AuthPayload = { userId: number; email: string };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, "Unauthorized", 401);
  }

  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return fail(res, "Server misconfigured", 500);
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.auth = payload;
    return next();
  } catch {
    return fail(res, "Unauthorized", 401);
  }
}
