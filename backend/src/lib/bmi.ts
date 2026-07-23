export function calculateAge(dob: Date, onDate = new Date()): number {
  const year = dob.getUTCFullYear();
  const month = dob.getUTCMonth();
  const day = dob.getUTCDate();

  let age = onDate.getFullYear() - year;
  const m = onDate.getMonth() - month;
  if (m < 0 || (m === 0 && onDate.getDate() < day)) age -= 1;
  return Math.max(0, age);
}

export function bmiStatus(bmi: number): "Underweight" | "Normal" | "Overweight" {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  return "Overweight";
}

/** Plausible BMI range for averages and reporting */
export function isPlausibleBmi(bmi: number): boolean {
  return Number.isFinite(bmi) && bmi >= 10 && bmi <= 80;
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
