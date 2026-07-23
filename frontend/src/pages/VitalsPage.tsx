import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { ProgressSteps } from "../components/ProgressSteps";
import { calcBmi, todayISO } from "../utils/bmi";

type LocState = {
  patientId?: number;
  unique?: string;
  name?: string;
};

export function VitalsPage() {
  const { patientId: patientIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocState;
  const patientId = Number(state.patientId ?? patientIdParam);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [tick, setTick] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const next = calcBmi(Number(height), Number(weight));
    setBmi(next);
    if (next != null) {
      setTick(true);
      const t = window.setTimeout(() => setTick(false), 180);
      return () => window.clearTimeout(t);
    }
  }, [height, weight]);

  if (!Number.isFinite(patientId)) {
    return (
      <main className="page">
        <section className="chart-panel">
          <p className="panel-kicker">Vitals</p>
          <h1 className="panel-title">Missing patient context</h1>
          <p className="panel-copy">Register a patient first, then capture vitals.</p>
          <button className="btn btn-primary" type="button" onClick={() => navigate("/register")}>
            Go to registration
          </button>
        </section>
      </main>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (bmi == null) {
      setError("Enter valid height and weight to calculate BMI");
      return;
    }
    const heightNum = Number(height);
    const weightNum = Number(weight);
    if (heightNum < 50 || heightNum > 250) {
      setError("Height must be between 50 and 250 cm.");
      return;
    }
    if (weightNum < 2 || weightNum > 400) {
      setError("Weight must be between 2 and 400 kg.");
      return;
    }
    if (bmi < 10 || bmi > 80) {
      setError("Calculated BMI looks invalid. Check height (cm) and weight (kg).");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const visit_date = String(fd.get("visit_date") || "");

    try {
      const data = await api.addVital({
        visit_date,
        height,
        weight,
        bmi: String(bmi),
        patient_id: String(patientId),
      });

      const nextState = {
        patientId,
        vitalId: data.id,
        unique: state.unique,
        name: state.name,
        bmi,
        visitDate: visit_date,
      };

      if (bmi > 25) navigate("/assessment/overweight", { state: nextState });
      else navigate("/assessment/general", { state: nextState });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save vitals");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="chart-panel">
        <ProgressSteps current="vitals" />
        <p className="panel-kicker">02 — Vitals</p>
        <h1 className="panel-title">Patient vitals</h1>
        <p className="panel-copy">
          Height in cm, weight in kg. BMI is auto-calculated. BMI of 25 or lower routes to
          General Assessment; BMI above 25 to Overweight Assessment.
        </p>

        <div className="wristband">
          <div>
            <div className="wristband-label">Patient ID</div>
            <div className="wristband-id">{state.unique || `#${patientId}`}</div>
          </div>
          <div className="muted">{state.name}</div>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form onSubmit={onSubmit} className="form-grid">
          <div className="field full">
            <label htmlFor="visit_date">Visit date</label>
            <input id="visit_date" name="visit_date" type="date" required defaultValue={todayISO()} />
          </div>
          <div className="field">
            <label htmlFor="height">Height (cm)</label>
            <input
              id="height"
              name="height"
              type="number"
              min="1"
              step="0.1"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="1"
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="field full">
            <div className="bmi-readout">
              <span>Computed BMI</span>
              <strong className={tick ? "tick" : undefined}>
                {bmi != null ? bmi.toFixed(1) : "—"}
              </strong>
            </div>
          </div>
          <div className="actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save vitals"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
