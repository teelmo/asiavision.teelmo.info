"use client";

import { useEffect, useState } from "react";

type Progress = { votedCount: number; totalVoters: number; threshold: number };

type LiveCountry = { id: number; code: string; name: string; flag: string };
type RevealedCountry = LiveCountry & { points: number; breakdown: Record<string, number> };

type ResultsResponse =
  | ({ state: "live"; ranking: LiveCountry[] } & Progress)
  | ({ state: "locked" } & Progress)
  | ({ state: "revealed"; results: RevealedCountry[] } & Progress);

const POLL_MS = 4000;

function ProgressBar({ votedCount, totalVoters, threshold }: Progress) {
  const target = threshold > 0 ? threshold : totalVoters;
  const pct = target > 0 ? Math.min(100, Math.round((votedCount / target) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-slate-400">
        <span>Votes in</span>
        <span>
          {votedCount} / {target > 0 ? target : "?"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-asia-accent2 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ResultsBoard() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/results", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load results.");
        const json = (await res.json()) as ResultsResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't reach the server — retrying…");
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return <p className="text-center text-slate-400">{error ?? "Loading…"}</p>;
  }

  if (data.state === "locked") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-asia-gold/40 bg-asia-panel p-10 text-center">
        <h2 className="text-2xl font-bold text-asia-gold">Voting is complete 🔒</h2>
        <p className="max-w-sm text-slate-300">
          All ballots are in and the results are locked until the host reveals them. Stay tuned!
        </p>
        <ProgressBar votedCount={data.votedCount} totalVoters={data.totalVoters} threshold={data.threshold} />
      </div>
    );
  }

  if (data.state === "revealed") {
    const max = Math.max(...data.results.map((r) => r.points), 1);
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-asia-gold/40 bg-asia-gold/10 p-3 text-center text-sm font-semibold text-asia-gold">
          Final results revealed
        </div>
        <ol className="flex flex-col gap-3">
          {data.results.map((c, i) => (
            <li key={c.id} className="rounded-xl border border-slate-700 bg-asia-panel p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-lg">
                  <span className="w-6 text-right font-bold text-slate-500">{i + 1}</span>
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </span>
                <span className="font-bold text-asia-gold">{c.points} pts</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-asia-gold"
                  style={{ width: `${Math.max(0, (c.points / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar votedCount={data.votedCount} totalVoters={data.totalVoters} threshold={data.threshold} />
      <p className="text-center text-xs text-slate-500">
        Live ranking only — point totals stay hidden until the reveal.
      </p>
      <ol className="flex flex-col gap-2">
        {data.ranking.map((c, i) => (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-xl border border-slate-700 bg-asia-panel px-4 py-3"
          >
            <span className="w-6 text-right font-bold text-slate-500">{i + 1}</span>
            <span className="text-lg">{c.flag}</span>
            <span>{c.name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
