import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { BrandLogo } from "../components/BrandLogo";
import { LoadingStatus } from "../components/LoadingStatus";
import { ProgressSteps } from "../components/ProgressSteps";
import { ageFromDob, todayISO } from "../utils/bmi";

type RegStep = 1 | 2;

type Draft = {
  unique: string;
  reg_date: string;
  firstname: string;
  lastname: string;
  dob: string;
  gender: string;
};

const emptyDraft: Draft = {
  unique: "",
  reg_date: todayISO(),
  firstname: "",
  lastname: "",
  dob: "",
  gender: "",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegStep>(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uniqueError, setUniqueError] = useState("");
  const [checkingUnique, setCheckingUnique] = useState(false);
  const [loading, setLoading] = useState(false);
  const calculatedAge = useMemo(() => ageFromDob(draft.dob), [draft.dob]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === "unique") setUniqueError("");
  }

  async function verifyUnique(unique: string) {
    const value = unique.trim();
    if (!value) {
      setUniqueError("Patient Id is required.");
      return false;
    }

    setCheckingUnique(true);
    setUniqueError("");
    try {
      const data = await api.checkPatientUnique(value);
      if (data.exists) {
        setUniqueError("This Patient Id already exists. Enter a different one.");
        return false;
      }
      return true;
    } catch {
      setUniqueError("Could not verify Patient Id right now. Please try again.");
      return false;
    } finally {
      setCheckingUnique(false);
    }
  }

  async function goToConfirm() {
    setError("");
    setSuccess("");

    const uniqueOk = await verifyUnique(draft.unique);
    if (!uniqueOk) return;

    if (!draft.reg_date) {
      setError("Registration date is required.");
      return;
    }
    if (!draft.firstname.trim() || !draft.lastname.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!draft.dob) {
      setError("Date of birth is required.");
      return;
    }
    if (calculatedAge == null) {
      setError("Enter a valid date of birth that is not in the future.");
      return;
    }
    if (!draft.gender) {
      setError("Gender is required.");
      return;
    }
    setStep(2);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const payload = {
      unique: draft.unique.trim(),
      firstname: draft.firstname.trim(),
      lastname: draft.lastname.trim(),
      dob: draft.dob,
      gender: draft.gender,
      reg_date: draft.reg_date,
    };

    try {
      const data = await api.registerPatient(payload);
      setSuccess(
        `Patient ${payload.firstname} ${payload.lastname} registered successfully. Continuing to vitals…`,
      );
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      navigate(`/vitals/${data.id}`, {
        state: {
          patientId: data.id,
          unique: payload.unique,
          name: `${payload.firstname} ${payload.lastname}`,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="chart-panel">
        <div className="page-brand-row">
          <BrandLogo className="page-brand-logo" />
          <div>
            <p className="panel-kicker">Intake</p>
            <h1 className="panel-title">Patient registration</h1>
          </div>
        </div>
        <ProgressSteps current="register" />

        <div className="substeps" aria-label="Registration steps">
          <button
            type="button"
            className={`substep has-tip ${step === 1 ? "active" : "done"}`}
            data-tooltip="Enter patient ID, registration date, name, date of birth, and gender."
            onClick={() => setStep(1)}
          >
            1. Patient details
          </button>
          <button
            type="button"
            className={`substep has-tip ${step === 2 ? "active" : ""}`}
            data-tooltip={
              step < 2
                ? "Finish patient details first, then review and confirm."
                : "Review the entered details before saving the patient."
            }
            onClick={() => step === 2 && setStep(2)}
            disabled={step < 2}
          >
            2. Confirm
          </button>
        </div>

        <div className="wristband">
          <div>
            <div className="wristband-label">Patient ID</div>
            <div className="wristband-id">{draft.unique.trim() || "—"}</div>
          </div>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {success ? (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="unique">Patient Id</label>
              <input
                id="unique"
                name="unique"
                required
                placeholder="e.g. PID-1001"
                value={draft.unique}
                aria-invalid={Boolean(uniqueError)}
                onChange={(e) => update("unique", e.target.value)}
                onBlur={() => {
                  if (draft.unique.trim()) void verifyUnique(draft.unique);
                }}
              />
              {uniqueError ? <span className="field-error">{uniqueError}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="reg_date">Registration date</label>
              <input
                id="reg_date"
                name="reg_date"
                type="date"
                required
                value={draft.reg_date}
                onChange={(e) => update("reg_date", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="firstname">First name</label>
              <input
                id="firstname"
                name="firstname"
                required
                placeholder="e.g. Jane"
                value={draft.firstname}
                onChange={(e) => update("firstname", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="lastname">Last name</label>
              <input
                id="lastname"
                name="lastname"
                required
                placeholder="e.g. Doe"
                value={draft.lastname}
                onChange={(e) => update("lastname", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                name="dob"
                type="date"
                required
                max={todayISO()}
                value={draft.dob}
                onChange={(e) => update("dob", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                required
                value={draft.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="" disabled>
                  Select
                </option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="actions" style={{ gridColumn: "1 / -1" }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => void goToConfirm()}
                disabled={checkingUnique || Boolean(uniqueError)}
              >
                {checkingUnique ? "Checking Patient Id…" : "Continue to confirm"}
              </button>
              {checkingUnique ? <LoadingStatus label="Checking Patient Id…" /> : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <form onSubmit={onSubmit}>
            <div className="confirm-grid">
              <div>
                <span className="confirm-label">Patient Id</span>
                <strong>{draft.unique}</strong>
              </div>
              <div>
                <span className="confirm-label">Registration date</span>
                <strong>{draft.reg_date}</strong>
              </div>
              <div>
                <span className="confirm-label">Name</span>
                <strong>
                  {draft.firstname} {draft.lastname}
                </strong>
              </div>
              <div>
                <span className="confirm-label">Date of birth</span>
                <strong>{draft.dob}</strong>
              </div>
              <div>
                <span className="confirm-label">Gender</span>
                <strong>{draft.gender}</strong>
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-ghost" type="button" onClick={() => setStep(1)} disabled={loading}>
                Back
              </button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save & continue to vitals"}
              </button>
              {loading ? <LoadingStatus label="Saving patient…" /> : null}
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}
