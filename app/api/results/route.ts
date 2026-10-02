import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, countries, votedCount, totalVoters] = await Promise.all([
    prisma.pollSettings.findUnique({ where: { id: 1 } }),
    prisma.country.findMany({ orderBy: { order: "asc" } }),
    prisma.voter.count({ where: { hasVoted: true } }),
    prisma.voter.count(),
  ]);

  const threshold = settings?.voterThreshold ?? 0;
  const isFinalized = settings?.isFinalized ?? false;
  const isRevealed = settings?.isRevealed ?? false;

  const progress = { votedCount, totalVoters, threshold };

  if (isFinalized && !isRevealed) {
    return NextResponse.json({ state: "locked", ...progress });
  }

  const sums = await prisma.voteEntry.groupBy({
    by: ["countryId"],
    _sum: { points: true },
  });
  const pointsByCountry = new Map(sums.map((s) => [s.countryId, s._sum.points ?? 0]));

  const ranked = [...countries].sort((a, b) => {
    const diff = (pointsByCountry.get(b.id) ?? 0) - (pointsByCountry.get(a.id) ?? 0);
    if (diff !== 0) return diff;
    return a.order - b.order;
  });

  if (!isFinalized) {
    // Live, anonymous: order only, never the numbers behind it.
    return NextResponse.json({
      state: "live",
      ranking: ranked.map((c) => ({ id: c.id, code: c.code, name: c.name, flag: c.flag })),
      ...progress,
    });
  }

  // Finalized and revealed: full breakdown.
  const breakdown = await prisma.voteEntry.groupBy({
    by: ["countryId", "points"],
    _count: { _all: true },
  });
  const breakdownByCountry = new Map<number, Record<string, number>>();
  for (const row of breakdown) {
    const map = breakdownByCountry.get(row.countryId) ?? {};
    map[String(row.points)] = row._count._all;
    breakdownByCountry.set(row.countryId, map);
  }

  return NextResponse.json({
    state: "revealed",
    results: ranked.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      flag: c.flag,
      points: pointsByCountry.get(c.id) ?? 0,
      breakdown: breakdownByCountry.get(c.id) ?? {},
    })),
    ...progress,
  });
}
