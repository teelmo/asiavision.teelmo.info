import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { computeAccuracy } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDB();
  const { settings, voters, votes } = db;

  const votedCount = voters.filter((v) => v.hasVoted).length;
  const progress = { votedCount, totalVoters: voters.length, threshold: settings.voterThreshold };

  if (settings.isFinalized && !settings.isRevealed) {
    return NextResponse.json({ state: "locked", ...progress });
  }

  const pointsByCountry = new Map<number, number>();
  const breakdownByCountry = new Map<number, Record<string, number>>();
  for (const vote of votes) {
    for (const entry of vote.entries) {
      pointsByCountry.set(entry.countryId, (pointsByCountry.get(entry.countryId) ?? 0) + entry.points);
      const breakdown = breakdownByCountry.get(entry.countryId) ?? {};
      breakdown[String(entry.points)] = (breakdown[String(entry.points)] ?? 0) + 1;
      breakdownByCountry.set(entry.countryId, breakdown);
    }
  }

  const ranked = [...COUNTRIES].sort((a, b) => {
    const diff = (pointsByCountry.get(b.id) ?? 0) - (pointsByCountry.get(a.id) ?? 0);
    if (diff !== 0) return diff;
    return a.id - b.id;
  });

  if (!settings.isFinalized) {
    // Live: just the headcount, nothing about who's ahead.
    return NextResponse.json({ state: "live", ...progress });
  }

  const actualRanking = settings.actualRanking;
  const actualResult = actualRanking
    ? actualRanking
        .map((id) => COUNTRIES.find((c) => c.id === id))
        .filter((c): c is (typeof COUNTRIES)[number] => Boolean(c))
        .map((c) => ({ id: c.id, code: c.code, name: c.name, flag: c.flag }))
    : null;

  const votersById = new Map(voters.map((v) => [v.id, v]));
  const accuracy = actualRanking
    ? votes
        .map((vote) => ({
          voterName: votersById.get(vote.voterId)?.name ?? "Unknown",
          distance: computeAccuracy(vote.entries, actualRanking),
        }))
        .sort((a, b) => a.distance - b.distance)
    : null;

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
    actualResult,
    accuracy,
    ...progress,
  });
}
