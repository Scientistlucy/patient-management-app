export function calculateAge(dob: Date, onDate = new Date()): number {
  // Always use calendar date parts in UTC to avoid timezone off-by-one (e.g. UTC+3).
  const year = dob.getUTCFullYear();
  const month = dob.getUTCMonth();
  const day = dob.getUTCDate();

  const nowY = onDate.getUTCFullYear();
  const nowM = onDate.getUTCMonth();
  const nowD = onDate.getUTCDate();

  let age = nowY - year;
  if (nowM < month || (nowM === month && nowD < day)) age -= 1;
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
