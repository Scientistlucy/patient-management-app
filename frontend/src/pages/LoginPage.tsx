import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError, api, getRememberedEmail, setRememberedEmail } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";

export function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState(() => getRememberedEmail());
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  if (token) return <Navigate to="/register" replace />;

  function validate(nextEmail: string, password: string) {
    const next: { email?: string; password?: string } = {};
    if (!nextEmail.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (mode === "signup" && password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(e.currentTarget);
    const nextEmail = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const keepSignedIn = mode === "signup" ? true : remember;

    if (!validate(nextEmail, password)) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        await api.signup({
          email: nextEmail,
          password,
          firstname: String(fd.get("firstname") || "").trim(),
          lastname: String(fd.get("lastname") || "").trim(),
        });
        setSuccess("Account created successfully. Signing you in…");
      }

      const data = await api.signin({ email: nextEmail, password });

      if (mode === "signin") {
        setSuccess(`Signed in successfully. Welcome back${data.name ? `, ${data.name}` : ""}.`);
      }

      if (keepSignedIn) setRememberedEmail(nextEmail);
      else setRememberedEmail(null);

      await new Promise((resolve) => window.setTimeout(resolve, 900));
      login(data.access_token, data.name, keepSignedIn);
      navigate("/register", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to reach the server. Check that the API is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="panel-title">{mode === "signin" ? "Sign in" : "Create account"}</h2>
      <p className="panel-copy">
        {mode === "signin"
          ? "Sign in to continue registering the patient."
          : "Create an account to start registering patients."}
      </p>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <form onSubmit={onSubmit} className="form-grid" noValidate>
        {mode === "signup" ? (
          <>
            <div className="field">
              <label htmlFor="firstname">First name</label>
              <input
                id="firstname"
                name="firstname"
                required
                placeholder="e.g. Jane"
                autoComplete="given-name"
              />
            </div>
            <div className="field">
              <label htmlFor="lastname">Last name</label>
              <input
                id="lastname"
                name="lastname"
                required
                placeholder="e.g. Doe"
                autoComplete="family-name"
              />
            </div>
          </>
        ) : null}
        <div className="field full">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
            autoComplete="username"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Password"
          required
          minLength={6}
          placeholder={mode === "signin" ? "Enter your password" : "At least 6 characters"}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          error={fieldErrors.password}
        />

        {mode === "signin" ? (
          <div className="auth-row" style={{ gridColumn: "1 / -1" }}>
            <label className="remember-me">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>
        ) : null}

        <div className="actions full" style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setSuccess("");
              setFieldErrors({});
            }}
          >
            {mode === "signin" ? "Create an account" : "Have an account?"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
