"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Country = { id: number; code: string; name: string; flag: string };

const POINT_VALUES = [12, 10, 8, -4] as const;

const POINT_LABELS: Record<number, string> = {
  12: "12 pts — favorite",
  10: "10 pts",
  8: "8 pts",
  "-4": "-4 pts — least favorite",
};

export function BallotForm({ token, countries }: { token: string; countries: Country[] }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [activePoint, setActivePoint] = useState<number | null>(12);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const usedPoints = useMemo(() => new Set(Object.values(assignments)), [assignments]);
  const pointByCountry = assignments;
  const allAssigned = usedPoints.size === POINT_VALUES.length;

  function nextFreePoint(exclude: number): number | null {
    return POINT_VALUES.find((p) => p !== exclude && !usedPoints.has(p)) ?? null;
  }

  function handleCountryClick(countryId: number) {
    setError(null);
    const current = assignments[countryId];

    if (current !== undefined) {
      // Un-assign this country; hand that point value back to the user.
      const { [countryId]: _removed, ...rest } = assignments;
      setAssignments(rest);
      setActivePoint(current);
      return;
    }

    if (activePoint === null) return;

    const updated = { ...assignments, [countryId]: activePoint };
    setAssignments(updated);
    const used = new Set(Object.values(updated));
    setActivePoint(POINT_VALUES.find((p) => !used.has(p)) ?? null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const entries = Object.entries(assignments).map(([countryId, points]) => ({
        countryId: Number(countryId),
        points,
      }));
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, entries }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-asia-accent2/40 bg-asia-panel p-8 text-center">
        <h2 className="text-2xl font-bold text-asia-accent2">Ballot submitted!</h2>
        <p className="mt-2 text-slate-300">Thanks for voting. Watch the live board on the results page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-700 bg-asia-panel p-4">
        <p className="mb-3 text-sm text-slate-300">
          {activePoint === null
            ? "All four points assigned — review below and submit."
            : "Pick a point value, then tap a country to give it that score."}
        </p>
        <div className="flex flex-wrap gap-2">
          {POINT_VALUES.map((p) => {
            const isUsed = usedPoints.has(p);
            const isActive = activePoint === p;
            return (
              <button
                key={p}
                type="button"
                disabled={isUsed}
                onClick={() => setActivePoint(p)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isUsed
                    ? "cursor-not-allowed border border-slate-700 text-slate-500"
                    : isActive
                      ? "bg-asia-accent text-white shadow-md shadow-asia-accent/40"
                      : "border border-slate-500 text-slate-200 hover:border-asia-accent2",
                ].join(" ")}
              >
                {POINT_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {countries.map((c) => {
          const points = pointByCountry[c.id];
          const assigned = points !== undefined;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCountryClick(c.id)}
              disabled={!assigned && activePoint === null}
              className={[
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                assigned
                  ? points > 0
                    ? "border-asia-gold bg-asia-gold/10"
                    : "border-asia-accent bg-asia-accent/10"
                  : "border-slate-700 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <span className="flex items-center gap-3 text-lg">
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </span>
              {assigned && (
                <span className={points > 0 ? "font-bold text-asia-gold" : "font-bold text-asia-accent"}>
                  {points > 0 ? `+${points}` : points}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-asia-accent">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAssigned || submitting}
        className="rounded-full bg-asia-accent2 px-6 py-3 font-bold text-asia-bg transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit my ballot"}
      </button>
    </div>
  );
}
