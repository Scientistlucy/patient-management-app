import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parseDateOnly } from "../lib/bmi.js";
import { fail, ok } from "../lib/response.js";
import { requireAuth } from "../middleware/auth.js";

const vitalSchema = z.object({
  visit_date: z.string().min(1),
  height: z.union([z.string(), z.number()]),
  weight: z.union([z.string(), z.number()]),
  bmi: z.union([z.string(), z.number()]),
  patient_id: z.union([z.string(), z.number()]),
});

export const vitalsRouter = Router();

vitalsRouter.use(requireAuth);

vitalsRouter.post("/add", async (req, res) => {
  const parsed = vitalSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", 422, parsed.error.flatten());
  }

  const patientId = Number(parsed.data.patient_id);
  const height = Number(parsed.data.height);
  const weight = Number(parsed.data.weight);
  const bmi = Number(parsed.data.bmi);
  const visitDate = parseDateOnly(parsed.data.visit_date);

  if (![patientId, height, weight, bmi].every(Number.isFinite)) {
    return fail(res, "Invalid numeric fields", 422);
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return fail(res, "Patient not found", 404);

  const duplicate = await prisma.vital.findUnique({
    where: { patientId_visitDate: { patientId, visitDate } },
  });
  if (duplicate) {
    return fail(res, "Vitals already recorded for this visit date", 400);
  }

  const vital = await prisma.vital.create({
    data: { patientId, visitDate, height, weight, bmi },
  });

  return ok(res, {
    id: vital.id,
    patient_id: String(vital.patientId),
    slug: 1,
    message: "Vital Added Successfully",
  });
});
