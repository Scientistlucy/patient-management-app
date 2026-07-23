import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { seedDemoPatients } from "../src/lib/seedDemo.js";

async function main() {
  const result = await seedDemoPatients(prisma);
  console.log(
    `Seed complete. Created ${result.created}, skipped ${result.skipped} (target ${result.total}).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
