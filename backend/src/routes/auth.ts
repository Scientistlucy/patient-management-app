import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { isEmailConfigured, sendPasswordResetEmail } from "../lib/mail.js";
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

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
    return fail(res, "Incorrect password. Try again or use Forgot password.", 401);
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

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Validation failed";
    return fail(res, first, 422, parsed.error.flatten());
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return fail(res, "No account found for this email.", 404);
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires },
  });

  const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`;

  // Try real email first. If Gmail rejects credentials, still return the link
  // so the reset flow works for local/demo use.
  if (isEmailConfigured()) {
    try {
      await sendPasswordResetEmail({
        to: email,
        name: user.firstname,
        resetUrl,
      });
      return ok(res, {
        message: "Password reset link sent. Check your email inbox (and spam folder).",
        email,
        emailed: true,
      });
    } catch (err) {
      console.error("Failed to send reset email:", err);
    }
  }

  return ok(res, {
    message:
      "Gmail could not send the email (SMTP login rejected). Use the reset link below to create a new password.",
    email,
    emailed: false,
    reset_url: resetUrl,
  });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Validation failed";
    return fail(res, first, 422, parsed.error.flatten());
  }

  const { email, token, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetToken || !user.resetTokenExpires) {
    return fail(res, "Invalid or expired reset link. Request a new one.", 400);
  }

  if (user.resetToken !== token) {
    return fail(res, "Invalid reset token. Request a new forgot-password link.", 400);
  }

  if (user.resetTokenExpires.getTime() < Date.now()) {
    return fail(res, "Reset token has expired. Request a new one.", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return ok(res, { message: "Password updated successfully. You can sign in now." });
});
