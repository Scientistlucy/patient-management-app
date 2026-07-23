import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

type Props = {
  children: ReactNode;
};

export function AuthLayout({ children }: Props) {
  return (
    <div className="auth-split">
      <aside className="auth-brand" aria-label="Patient Chart">
        <div className="auth-brand-atmosphere" aria-hidden="true" />
        <div className="auth-brand-frame">
          <header className="auth-brand-top">
            <BrandLogo className="auth-logo-img" />
            <div>
              <p className="auth-brand-kicker">Clinical Instrument</p>
              <p className="auth-logo-wordmark">Patient Chart</p>
            </div>
          </header>

          <div className="auth-brand-main">
            <h1 className="auth-brand-title">
              Keep the visit chart
              <span> within reach.</span>
            </h1>
            <p className="auth-brand-copy">
              Register the patient, capture vitals, and route the assessment from
              one calm clinical desk.
            </p>

            <div className="auth-instrument" aria-hidden="true">
              <div className="auth-instrument-head">
                <span>Visit strip</span>
                <span className="auth-instrument-mono">BMI auto</span>
              </div>
              <div className="auth-instrument-body">
                <svg className="auth-instrument-wave" viewBox="0 0 280 72" fill="none">
                  <path
                    d="M4 48H38L48 18L62 58L76 36L92 42H128L140 12L156 60L172 28L188 40H276"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="auth-instrument-meta">
                  <div>
                    <span className="auth-instrument-label">Path</span>
                    <strong>Register → Vitals → Assess</strong>
                  </div>
                  <div>
                    <span className="auth-instrument-label">Routing</span>
                    <strong>BMI ≤ 25 / BMI &gt; 25</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="auth-brand-foot">
            <span>Intake desk</span>
            <span className="auth-brand-foot-dot" />
            <span>Secure clinician access</span>
          </footer>
        </div>
      </aside>

      <section className="auth-form-pane">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}
