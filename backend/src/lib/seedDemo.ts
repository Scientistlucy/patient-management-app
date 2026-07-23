import { PrismaClient } from "@prisma/client";

type Profile = "under" | "normal" | "over" | "none";

const firstNames = [
  "Amina", "Brian", "Charity", "Daniel", "Esther", "Felix", "Grace", "Hassan",
  "Irene", "James", "Karen", "Leo", "Mary", "Nathan", "Olivia", "Peter",
  "Queen", "Robert", "Sarah", "Timothy", "Ursula", "Victor", "Winnie", "Xavier",
  "Yvonne", "Zawadi", "Alice", "Benson", "Catherine", "David", "Emily", "Francis",
  "Gladys", "Henry", "Ivy", "Joseph", "Laura", "Michael", "Nancy", "Oscar",
  "Pauline", "Quincy", "Rose", "Samuel", "Teresa", "Umar", "Vera", "William",
  "Xena", "Abigail", "Zachary", "Ann", "Ben", "Claire", "Derek", "Eva",
];

const lastNames = [
  "Otieno", "Wanjiku", "Kamau", "Ochieng", "Njeri", "Mwangi", "Achieng", "Kiptoo",
  "Mutiso", "Wekesa", "Okello", "Cheruiyot", "Njoroge", "Barasa", "Muthoni", "Koech",
  "Adhiambo", "Kariuki", "Wambua", "Saitoti", "Nyambura", "Omollo", "Chebet", "Kimani",
];

const profiles: Profile[] = [
  "under", "normal", "over", "normal", "over", "under", "normal", "none",
  "normal", "over", "normal", "under", "over", "normal", "normal", "over",
  "under", "normal", "over", "none", "normal", "over", "under", "normal",
  "over", "normal", "under", "normal", "over", "normal", "none", "under",
  "normal", "over", "normal", "under", "over", "normal", "normal", "over",
  "under", "normal", "over", "none", "normal", "over", "under", "normal",
  "over", "normal", "under", "normal", "over", "normal", "normal", "over",
];

function heightWeight(kind: Profile) {
  if (kind === "none") return null;
  if (kind === "under") return { height: 170, weight: 48 };
  if (kind === "over") return { height: 165, weight: 82 };
  return { height: 170, weight: 65 };
}

function bmiFrom(heightCm: number, weightKg: number) {
  const m = heightCm / 100;
  return Number((weightKg / (m * m)).toFixed(1));
}

export async function seedDemoPatients(prisma: PrismaClient) {
  let created = 0;
  let skipped = 0;

  for (let index = 0; index < firstNames.length; index += 1) {
    const unique = `SEED${String(index + 1).padStart(3, "0")}`;
    const existing = await prisma.patient.findUnique({ where: { unique } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const firstname = firstNames[index];
    const lastname = lastNames[index % lastNames.length];
    const gender = index % 3 === 0 ? "Female" : index % 3 === 1 ? "Male" : "Other";
    const year = 1965 + (index % 40);
    const month = String((index % 12) + 1).padStart(2, "0");
    const day = String((index % 27) + 1).padStart(2, "0");
    const kind = profiles[index % profiles.length];
    const visitDay = String((index % 20) + 1).padStart(2, "0");
    const visitDate = new Date(`2026-07-${visitDay}T00:00:00.000Z`);

    const patient = await prisma.patient.create({
      data: {
        unique,
        firstname,
        lastname,
        dob: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
        gender,
        regDate: new Date("2026-07-01T00:00:00.000Z"),
      },
    });

    const vitals = heightWeight(kind);
    if (vitals) {
      const bmi = bmiFrom(vitals.height, vitals.weight);
      const vital = await prisma.vital.create({
        data: {
          patientId: patient.id,
          visitDate,
          height: vitals.height,
          weight: vitals.weight,
          bmi,
        },
      });

      await prisma.visit.create({
        data: {
          patientId: patient.id,
          vitalId: vital.id,
          visitDate,
          generalHealth: index % 4 === 0 ? "Poor" : "Good",
          onDiet: bmi > 25 ? (index % 2 === 0 ? "Yes" : "No") : null,
          onDrugs: bmi <= 25 ? (index % 2 === 0 ? "Yes" : "No") : null,
          comments: `Demo chart for ${firstname} ${lastname}`,
        },
      });
    }

    created += 1;
  }

  return { created, skipped, total: firstNames.length };
}
