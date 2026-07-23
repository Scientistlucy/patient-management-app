import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parseDateOnly } from "../lib/bmi.js";
import { fail, ok } from "../lib/response.js";
import { requireAuth } from "../middleware/auth.js";

const registerSchema = z.object({
  unique: z.string().min(1),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  dob: z.string().min(1),
  gender: z.string().min(1),
  reg_date: z.string().min(1),
});

export const patientsRouter = Router();

patientsRouter.use(requireAuth);

patientsRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", 422, parsed.error.flatten());
  }

  const data = parsed.data;
  const existing = await prisma.patient.findUnique({ where: { unique: data.unique } });
  if (existing) {
    return fail(res, "Patient Id already registered", 400);
  }

  const patient = await prisma.patient.create({
    data: {
      unique: data.unique,
      firstname: data.firstname,
      lastname: data.lastname,
      dob: parseDateOnly(data.dob),
      gender: data.gender,
      regDate: parseDateOnly(data.reg_date),
    },
  });

  return ok(res, {
    proceed: 0,
    message: "Patient Added successfully",
    id: patient.id,
    unique: patient.unique,
  });
});

patientsRouter.get("/view", async (_req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: { id: "desc" },
  });

  return ok(
    res,
    patients.map((p) => ({
      id: p.id,
      unique: p.unique,
      firstname: p.firstname,
      lastname: p.lastname,
      dob: p.dob.toISOString().slice(0, 10),
      gender: p.gender,
      reg_date: p.regDate.toISOString().slice(0, 10),
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    })),
  );
});

patientsRouter.get("/show/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return fail(res, "Invalid patient id", 400);

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) return fail(res, "Patient not found", 404);

  return ok(res, [
    {
      id: patient.id,
      unique: patient.unique,
      firstname: patient.firstname,
      lastname: patient.lastname,
      dob: patient.dob.toISOString().slice(0, 10),
      gender: patient.gender,
      reg_date: patient.regDate.toISOString().slice(0, 10),
      created_at: patient.createdAt,
      updated_at: patient.updatedAt,
    },
  ]);
});
