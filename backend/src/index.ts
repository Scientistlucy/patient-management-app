import "dotenv/config";
import cors from "cors";
import express from "express";
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

app.listen(port, () => {
  console.log(`Patient Chart API listening on http://localhost:${port}`);
});
