import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";

export function ResetPasswordPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailFromLink = useMemo(
    () => searchParams.get("email")?.trim() || "",
    [searchParams],
  );
  const tokenFromLink = useMemo(
    () => searchParams.get("token")?.trim() || "",
    [searchParams],
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/register" replace />;

  const linkValid = Boolean(emailFromLink && tokenFromLink);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!linkValid) {
      setError("This reset link is incomplete. Request a new one from Forgot password.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.resetPassword({
        email: emailFromLink,
        token: tokenFromLink,
        password,
      });
      setSuccess(data.message);
      window.setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to reset password. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout support="Choose a new password, then sign in to continue clinical work.">
      <p className="panel-kicker">Account recovery</p>
      <h2 className="panel-title">Create new password</h2>
      <p className="panel-copy">
        {linkValid
          ? `Resetting password for ${emailFromLink}.`
          : "Open the reset link from your email to continue. If the link is missing, request a new one."}
      </p>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      {!linkValid ? (
        <div className="actions">
          <Link className="btn btn-primary" to="/forgot-password">
            Request reset link
          </Link>
          <Link className="btn btn-ghost" to="/login">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="form-grid">
          <PasswordField
            id="password"
            name="password"
            label="New password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm"
            name="confirm"
            label="Confirm password"
            required
            minLength={6}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
          <div className="actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Updating…" : "Save new password"}
            </button>
            <Link className="btn btn-ghost" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
