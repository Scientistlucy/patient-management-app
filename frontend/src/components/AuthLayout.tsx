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
              Desk chart ready
              <span> before the queue.</span>
            </h1>
            <p className="auth-brand-copy">
              Intake, vitals, and BMI-guided assessment at one desk.
            </p>

            <div className="auth-console" aria-hidden="true">
              <div className="auth-wrist">
                <div>
                  <span className="auth-wrist-label">Active patient</span>
                  <strong className="auth-wrist-id">PID-1042</strong>
                </div>
                <span className="auth-wrist-name">Amina Otieno</span>
              </div>

              <div className="auth-console-board">
                <div className="auth-readout">
                  <span>Height</span>
                  <strong>168 cm</strong>
                </div>
                <div className="auth-readout">
                  <span>Weight</span>
                  <strong>61.4 kg</strong>
                </div>
                <div className="auth-readout auth-readout-bmi">
                  <span>BMI</span>
                  <strong>21.8</strong>
                  <em>Normal</em>
                </div>
              </div>

              <div className="auth-trace">
                <svg viewBox="0 0 320 64" fill="none" className="auth-trace-svg">
                  <path
                    className="auth-trace-line"
                    d="M0 36 H42 L52 14 L64 52 L78 28 L96 36 H148 L160 10 L176 54 L190 24 L208 36 H320"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="auth-trace-caption">Live vitals trace</span>
              </div>

              <ol className="auth-rail">
                <li className="is-done">
                  <span>01</span> Register
                </li>
                <li className="is-active">
                  <span>02</span> Vitals
                </li>
                <li>
                  <span>03</span> Assess
                </li>
              </ol>
            </div>
          </div>
        </div>
      </aside>

      <section className="auth-form-pane">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}
