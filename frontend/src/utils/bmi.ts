export function calcBmi(heightCm: number, weightKg: number): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function bmiStatus(bmi: number): "Underweight" | "Normal" | "Overweight" {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  return "Overweight";
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Age in full years from an HTML date input value (YYYY-MM-DD). */
export function ageFromDob(dob: string, onDate = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [year, month, day] = dob.split("-").map(Number);
  if (!year || !month || !day) return null;

  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return null;
  }

  // Reject future dates
  const today = new Date(
    Date.UTC(onDate.getFullYear(), onDate.getMonth(), onDate.getDate()),
  );
  if (birth > today) return null;

  let age = today.getUTCFullYear() - year;
  const monthDiff = today.getUTCMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < day)) age -= 1;
  return Math.max(0, age);
}
