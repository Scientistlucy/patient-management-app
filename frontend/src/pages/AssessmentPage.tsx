import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { ProgressSteps } from "../components/ProgressSteps";
import { todayISO } from "../utils/bmi";

type AssessmentState = {
  patientId: number;
  vitalId: number;
  unique?: string;
  name?: string;
  bmi: number;
  visitDate?: string;
};

type Props = {
  kind: "general" | "overweight";
};

export function AssessmentPage({ kind }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as AssessmentState | null;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!state?.patientId || !state?.vitalId || state.bmi == null) {
    return <Navigate to="/register" replace />;
  }

  if (kind === "overweight" && !(state.bmi > 25)) {
    return <Navigate to="/assessment/general" replace state={state} />;
  }
  if (kind === "general" && state.bmi > 25) {
    return <Navigate to="/assessment/overweight" replace state={state} />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      await api.addVisit({
        general_health: String(fd.get("general_health")) as "Good" | "Poor",
        comments: String(fd.get("comments") || ""),
        visit_date: String(fd.get("visit_date") || ""),
        patient_id: String(state!.patientId),
        vital_id: String(state!.vitalId),
        ...(kind === "overweight"
          ? { on_diet: String(fd.get("on_diet")) as "Yes" | "No" }
          : { on_drugs: String(fd.get("on_drugs")) as "Yes" | "No" }),
      });
      navigate("/listing");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="chart-panel">
        <ProgressSteps current="assessment" />
        <p className="panel-kicker">
          03 — {kind === "overweight" ? "Overweight assessment" : "General assessment"}
        </p>
        <h1 className="panel-title">
          {kind === "overweight" ? "Overweight assessment form" : "General assessment form"}
        </h1>
        <p className="panel-copy">
          {kind === "overweight"
            ? "Shown when BMI is greater than 25."
            : "Shown when BMI is less than or equal to 25."}
        </p>

        <div className="wristband">
          <div>
            <div className="wristband-label">Patient / BMI</div>
            <div className="wristband-id">
              {state.unique || `#${state.patientId}`} · {state.bmi.toFixed(1)}
            </div>
          </div>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form onSubmit={onSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="visit_date">Visit date</label>
            <input
              id="visit_date"
              name="visit_date"
              type="date"
              required
              defaultValue={state.visitDate || todayISO()}
            />
          </div>
          <div className="field">
            <label htmlFor="general_health">General health</label>
            <select id="general_health" name="general_health" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option>Good</option>
              <option>Poor</option>
            </select>
          </div>
          {kind === "overweight" ? (
            <div className="field full">
              <label htmlFor="on_diet">Have you ever been on a diet to lose weight?</label>
              <select id="on_diet" name="on_diet" required defaultValue="">
                <option value="" disabled>
                  Select
                </option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          ) : (
            <div className="field full">
              <label htmlFor="on_drugs">Are you currently using any drugs?</label>
              <select id="on_drugs" name="on_drugs" required defaultValue="">
                <option value="" disabled>
                  Select
                </option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          )}
          <div className="field full">
            <label htmlFor="comments">Comments</label>
            <textarea id="comments" name="comments" required />
          </div>
          <div className="actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save & view listing"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
