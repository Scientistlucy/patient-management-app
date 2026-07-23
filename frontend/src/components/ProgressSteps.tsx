type StepKey = "register" | "vitals" | "assessment";

const STEPS: Array<{ key: StepKey; label: string; number: string; tip: string }> = [
  {
    key: "register",
    label: "Registration",
    number: "01",
    tip: "Register the patient: ID, name, date of birth, and gender.",
  },
  {
    key: "vitals",
    label: "Vitals",
    number: "02",
    tip: "Record height and weight. BMI is calculated automatically.",
  },
  {
    key: "assessment",
    label: "Assessment",
    number: "03",
    tip: "Complete the clinical assessment based on the patient’s BMI.",
  },
];

const ORDER: StepKey[] = ["register", "vitals", "assessment"];

const STATE_PREFIX: Record<"done" | "current" | "upcoming", string> = {
  done: "Completed",
  current: "Current step",
  upcoming: "Upcoming",
};

export function ProgressSteps({ current }: { current: StepKey }) {
  const currentIndex = ORDER.indexOf(current);

  return (
    <ol className="progress-steps" aria-label="Patient intake progress">
      {STEPS.map((step, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        const tip = `${STATE_PREFIX[state]}: ${step.tip}`;
        return (
          <li
            key={step.key}
            className={`progress-step progress-step-${state} has-tip`}
            data-tooltip={tip}
            tabIndex={0}
            aria-label={tip}
          >
            <span className="progress-index" aria-hidden="true">
              {state === "done" ? "✓" : step.number}
            </span>
            <span className="progress-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
