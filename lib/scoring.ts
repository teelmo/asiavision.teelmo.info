// Voting rule: every voter gives exactly these four scores, each to a
// different country. Nothing else is accepted.
export const POINT_VALUES = [12, 10, 8, -4] as const;
export type PointValue = (typeof POINT_VALUES)[number];

export type BallotEntry = { countryId: number; points: number };

export function validateBallot(
  entries: unknown,
  validCountryIds: Set<number>
): { ok: true; entries: BallotEntry[] } | { ok: false; error: string } {
  if (!Array.isArray(entries) || entries.length !== POINT_VALUES.length) {
    return { ok: false, error: `You must submit exactly ${POINT_VALUES.length} picks.` };
  }

  const parsed: BallotEntry[] = [];
  const seenCountries = new Set<number>();
  const seenPoints = new Set<number>();

  for (const raw of entries) {
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as any).countryId !== "number" ||
      typeof (raw as any).points !== "number"
    ) {
      return { ok: false, error: "Malformed ballot entry." };
    }
    const countryId = (raw as any).countryId as number;
    const points = (raw as any).points as number;

    if (!validCountryIds.has(countryId)) {
      return { ok: false, error: "Unknown country in ballot." };
    }
    if (!POINT_VALUES.includes(points as PointValue)) {
      return { ok: false, error: "Invalid point value in ballot." };
    }
    if (seenCountries.has(countryId)) {
      return { ok: false, error: "Each country can only receive one score." };
    }
    if (seenPoints.has(points)) {
      return { ok: false, error: "Each point value can only be used once." };
    }

    seenCountries.add(countryId);
    seenPoints.add(points);
    parsed.push({ countryId, points });
  }

  return { ok: true, entries: parsed };
}

export function validateActualRanking(
  ranking: unknown,
  validCountryIds: Set<number>
): { ok: true; ranking: number[] } | { ok: false; error: string } {
  if (!Array.isArray(ranking) || ranking.length !== validCountryIds.size) {
    return { ok: false, error: `Ranking must include all ${validCountryIds.size} countries.` };
  }
  const seen = new Set<number>();
  for (const id of ranking) {
    if (typeof id !== "number" || !validCountryIds.has(id) || seen.has(id)) {
      return { ok: false, error: "Ranking must list every country exactly once." };
    }
    seen.add(id);
  }
  return { ok: true, ranking: ranking as number[] };
}

// How far a ballot's 4 picks landed from where they'd need to finish to be
// a perfect prediction: 12pts implies actual 1st, 10pts implies 2nd, 8pts
// implies 3rd, -4pts implies last place. Lower total = more accurate.
export function computeAccuracy(entries: BallotEntry[], actualRanking: number[]): number {
  const idealPosition: Record<number, number> = {
    12: 1,
    10: 2,
    8: 3,
    "-4": actualRanking.length,
  };
  let distance = 0;
  for (const entry of entries) {
    const actualPos = actualRanking.indexOf(entry.countryId) + 1;
    distance += Math.abs(actualPos - idealPosition[entry.points]);
  }
  return distance;
}
