import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";

export function ForgotPasswordPage() {
  const { token } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/register" replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResetUrl("");
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();

    try {
      const data = await api.forgotPassword({ email });
      setSuccess(data.message);
      if (data.reset_url) setResetUrl(data.reset_url);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to start password reset. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout support="Reset access securely, then return to patient registration and charting.">
      <p className="panel-kicker">Account recovery</p>
      <h2 className="panel-title">Forgot password</h2>
      <p className="panel-copy">
        Enter your account email. We try to email a reset link. If sending fails, a
        clickable link will appear here.
      </p>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      ) : null}

      {resetUrl ? (
        <div className="alert alert-success" role="status">
          <p style={{ margin: "0 0 0.75rem" }}>Open this link to create your new password:</p>
          <a href={resetUrl} style={{ wordBreak: "break-all", fontWeight: 600 }}>
            {resetUrl}
          </a>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="form-grid">
        <div className="field full">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@clinic.com"
            autoComplete="username"
          />
        </div>
        <div className="actions" style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
          <Link className="btn btn-ghost" to="/login">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
