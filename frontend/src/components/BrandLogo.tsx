import logoUrl from "../assets/patient-chart-logo.svg";

type Props = {
  className?: string;
  title?: string;
};

export function BrandLogo({ className = "", title = "Patient Chart" }: Props) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src={logoUrl}
      alt={title}
      width={40}
      height={40}
      decoding="async"
    />
  );
}
