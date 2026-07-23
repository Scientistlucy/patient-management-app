import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { bmiStatus, calculateAge, isPlausibleBmi, parseDateOnly } from "../lib/bmi.js";
import { seedDemoPatients } from "../lib/seedDemo.js";
import { fail, ok } from "../lib/response.js";
import { requireAuth } from "../middleware/auth.js";

const visitSchema = z.object({
  general_health: z.enum(["Good", "Poor"]),
  on_diet: z.enum(["Yes", "No"]).optional().nullable(),
  on_drugs: z.enum(["Yes", "No"]).optional().nullable(),
  comments: z.string().min(1),
  visit_date: z.string().min(1),
  patient_id: z.union([z.string(), z.number()]),
  vital_id: z.union([z.string(), z.number()]),
});

const listSchema = z.object({
  visit_date: z.string().optional().nullable(),
});

export const visitsRouter = Router();

visitsRouter.use(requireAuth);

visitsRouter.post("/add", async (req, res) => {
  const parsed = visitSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Validation failed", 422, parsed.error.flatten());
  }

  const patientId = Number(parsed.data.patient_id);
  const vitalId = Number(parsed.data.vital_id);
  const visitDate = parseDateOnly(parsed.data.visit_date);

  if (!parsed.data.on_diet && !parsed.data.on_drugs) {
    return fail(res, "Either on_diet or on_drugs is required", 422);
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return fail(res, "Patient not found", 404);

  const vital = await prisma.vital.findFirst({
    where: { id: vitalId, patientId },
  });
  if (!vital) return fail(res, "Vital record not found for patient", 404);

  const duplicate = await prisma.visit.findUnique({
    where: { patientId_visitDate: { patientId, visitDate } },
  });
  if (duplicate) {
    return fail(res, "Visit form already submitted for this date", 400);
  }

  await prisma.visit.create({
    data: {
      patientId,
      vitalId,
      visitDate,
      generalHealth: parsed.data.general_health,
      onDiet: parsed.data.on_diet ?? null,
      onDrugs: parsed.data.on_drugs ?? null,
      comments: parsed.data.comments,
    },
  });

  return ok(res, { slug: 0, message: "Visit Added Successfully" });
});

visitsRouter.post("/view", async (req, res) => {
  const parsed = listSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return fail(res, "Validation failed", 422, parsed.error.flatten());
  }

  const visitDateFilter = parsed.data.visit_date
    ? parseDateOnly(parsed.data.visit_date)
    : null;

  // Always reconcile demo census (removes legacy SEED* ids, ensures 1001+ rows).
  await seedDemoPatients(prisma);

  const patients = await prisma.patient.findMany({
    include: {
      vitals: {
        where: visitDateFilter ? { visitDate: visitDateFilter } : undefined,
        orderBy: { visitDate: "desc" },
        take: 1,
      },
    },
    orderBy: { id: "desc" },
  });

  const rows = patients
    .map((p) => {
      const lastVital = p.vitals[0];
      if (!lastVital && visitDateFilter) return null;
      if (!lastVital) {
        return {
          patient_id: p.id,
          unique: p.unique,
          name: `${p.firstname} ${p.lastname}`,
          gender: p.gender,
          age: calculateAge(p.dob),
          bmi: null as string | null,
          status: "No vitals" as string,
          visit_date: null as string | null,
          height: null as number | null,
          weight: null as number | null,
        };
      }
      return {
        patient_id: p.id,
        unique: p.unique,
        name: `${p.firstname} ${p.lastname}`,
        gender: p.gender,
        age: calculateAge(p.dob),
        bmi: String(lastVital.bmi),
        status: bmiStatus(lastVital.bmi),
        visit_date: lastVital.visitDate.toISOString().slice(0, 10),
        height: lastVital.height,
        weight: lastVital.weight,
      };
    })
    .filter(Boolean);

  const withBmi = rows.filter(
    (r) => r && r.bmi != null && isPlausibleBmi(Number(r.bmi)),
  ) as Array<{
    bmi: string;
    status: string;
  }>;

  const stats = {
    total: rows.length,
    underweight: rows.filter((r) => r?.status === "Underweight").length,
    normal: rows.filter((r) => r?.status === "Normal").length,
    overweight: rows.filter((r) => r?.status === "Overweight").length,
    no_vitals: rows.filter((r) => r?.status === "No vitals").length,
    average_bmi:
      withBmi.length === 0
        ? null
        : Number(
            (
              withBmi.reduce((sum, r) => sum + Number(r.bmi), 0) / withBmi.length
            ).toFixed(1),
          ),
  };

  return ok(res, { rows, stats });
});
