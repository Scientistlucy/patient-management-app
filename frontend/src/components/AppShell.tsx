import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function getInitials(name: string | null) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppShell() {
  const { name, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);

  useEffect(() => {
    if (!confirmSignOut) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmSignOut(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmSignOut]);

  function handleConfirmSignOut() {
    logout();
    setConfirmSignOut(false);
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Clinical Instrument</span>
          <span className="brand-title">Patient Chart</span>
        </div>
        <nav className="nav">
          <NavLink to="/register">Registration</NavLink>
          <NavLink to="/listing">Patient Listing</NavLink>

          <span className="nav-sep" aria-hidden="true" />

          <div className="nav-user">
            <span
              className="user-avatar"
              title={name || "Signed in"}
              aria-label={name ? `Signed in as ${name}` : "Signed in"}
            >
              {initials}
            </span>
            <button
              type="button"
              className="btn-signout"
              onClick={() => setConfirmSignOut(true)}
            >
              Sign out
            </button>
          </div>
        </nav>
      </header>
      <Outlet />

      {confirmSignOut ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setConfirmSignOut(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="panel-kicker">Session</p>
            <h2 id="signout-title" className="modal-title">
              Sign out?
            </h2>
            <p className="modal-copy">Are you sure you want to sign out?</p>
            <div className="actions">
              <button className="btn btn-primary" type="button" onClick={handleConfirmSignOut}>
                Yes, sign out
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirmSignOut(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
