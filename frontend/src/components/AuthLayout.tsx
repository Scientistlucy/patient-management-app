import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

type Props = {
  children: ReactNode;
  kicker?: string;
  headline?: string;
  support?: string;
};

export function AuthLayout({
  children,
  kicker = "Clinical Instrument",
  headline = "Patient Chart",
  support = "Clinical intake, vitals, and BMI-guided assessment in one calm workflow.",
}: Props) {
  return (
    <div className="auth-split">
      <aside className="auth-brand" aria-label="Product introduction">
        <div className="auth-brand-glow" aria-hidden="true" />
        <div className="auth-brand-grid" aria-hidden="true" />
        <div className="auth-brand-inner">
          <div className="auth-logo-wrap">
            <BrandLogo className="auth-logo-img" />
            <div>
              <p className="auth-brand-kicker">{kicker}</p>
              <p className="auth-logo-wordmark">Patient Chart</p>
            </div>
          </div>
          <h1 className="auth-brand-title">{headline}</h1>
          <p className="auth-brand-copy">{support}</p>
          <ul className="auth-brand-points">
            <li>Register patients with a clear intake path</li>
            <li>Capture vitals and auto-calculate BMI</li>
            <li>Route assessments by clinical status</li>
          </ul>
        </div>
      </aside>
      <section className="auth-form-pane">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}
