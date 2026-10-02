import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PLACEHOLDER lineup — replace with the real Asiavision 2026 participants
// before you start collecting real votes. Order here sets the default
// display order on the ballot.
const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "JPN", name: "Japan", flag: "🇯🇵" },
  { code: "KOR", name: "South Korea", flag: "🇰🇷" },
  { code: "PHL", name: "Philippines", flag: "🇵🇭" },
  { code: "THA", name: "Thailand", flag: "🇹🇭" },
  { code: "VNM", name: "Vietnam", flag: "🇻🇳" },
  { code: "IDN", name: "Indonesia", flag: "🇮🇩" },
  { code: "TWN", name: "Taiwan", flag: "🇹🇼" },
  { code: "CHN", name: "China", flag: "🇨🇳" },
  { code: "MYS", name: "Malaysia", flag: "🇲🇾" },
  { code: "IND", name: "India", flag: "🇮🇳" },
  { code: "MNG", name: "Mongolia", flag: "🇲🇳" },
];

async function main() {
  for (let i = 0; i < COUNTRIES.length; i++) {
    const c = COUNTRIES[i];
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, flag: c.flag, order: i },
      create: { code: c.code, name: c.name, flag: c.flag, order: i },
    });
  }

  await prisma.pollSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, voterThreshold: 0, isFinalized: false, isRevealed: false },
  });

  console.log(`Seeded ${COUNTRIES.length} countries and default poll settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
