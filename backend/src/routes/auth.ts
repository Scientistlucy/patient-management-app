import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { fail, ok } from "../lib/response.js";

const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signinSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Validation failed";
    return fail(res, first, 422, parsed.error.flatten());
  }

  const { email, firstname, lastname, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail(res, "This email is already registered. Try signing in instead.", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, firstname, lastname, passwordHash },
  });

  return ok(res, { proceed: 0, message: "Account creation Successfull" });
});

authRouter.post("/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Validation failed";
    return fail(res, first, 422, parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return fail(res, "No account found for this email. Check the email or create an account.", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return fail(res, "Incorrect password. Try again.", 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return fail(res, "Server misconfigured", 500);

  const access_token = jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: "7d" },
  );

  return ok(res, {
    id: user.id,
    name: `${user.firstname} ${user.lastname}`,
    email: user.email,
    updated_at: user.updatedAt,
    created_at: user.createdAt,
    access_token,
  });
});
