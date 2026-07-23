import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";
import { seedDemoPatients } from "./lib/seedDemo.js";
import { authRouter } from "./routes/auth.js";
import { patientsRouter } from "./routes/patients.js";
import { vitalsRouter } from "./routes/vitals.js";
import { visitsRouter } from "./routes/visits.js";

const app = express();
const port = Number(process.env.PORT || 4000);

const corsOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/user", authRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/vital", vitalsRouter);
app.use("/api/visits", visitsRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`Patient Chart API listening on port ${port}`);

  // Idempotent demo census so listing pagination has enough rows in fresh deploys.
  if (process.env.SEED_DEMO === "false") return;
  void seedDemoPatients(prisma)
    .then((result) => {
      console.log(
        `Demo patients ready (created ${result.created}, skipped ${result.skipped}).`,
      );
    })
    .catch((err) => {
      console.error("Demo patient seed failed:", err);
    });
});
