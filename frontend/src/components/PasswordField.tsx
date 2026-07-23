import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5C7 5 2.7 8.1 1 12c1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2.1 3.5 3.5 2.1 21.9 20.5 20.5 21.9l-3.1-3.1C15.9 19.5 14 20 12 20 7 20 2.7 16.9 1 13c.7-1.6 1.9-3.1 3.4-4.3L2.1 3.5zM12 7c.7 0 1.4.2 2 .5l-1.5 1.5A3 3 0 0 0 9.9 12l-1.5 1.5C8.2 12.9 8 12.5 8 12a4 4 0 0 1 4-5zm0 13c2.1 0 4-.5 5.7-1.4L15.5 16.4A5 5 0 0 1 8.9 9.8L6.3 7.2C4.4 8.5 2.9 10.2 2 12c1.7 3.9 6 7 10 7zm10-8c-.4.9-1 1.8-1.7 2.6l-1.5-1.5c.4-.5.7-1.1.9-1.6C17.9 8.5 15.2 6 12 6c-.5 0-1 .1-1.5.2L8.9 4.6C9.9 4.2 10.9 4 12 4c5 0 9.3 3.1 11 7z"
      />
    </svg>
  );
}

export function PasswordField({ label, error, id, className, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id || props.name || "password";

  return (
    <div className={`field full ${className || ""}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <div className="password-field">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeOpenIcon />}
        </button>
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
