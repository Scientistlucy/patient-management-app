type Props = {
  label?: string;
  className?: string;
};

export function LoadingStatus({
  label = "Loading…",
  className = "",
}: Props) {
  return (
    <div className={`loading-status ${className}`.trim()} role="status" aria-live="polite">
      <span className="loading-status-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
