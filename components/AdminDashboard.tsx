"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Voter = { id: number; name: string; token: string; hasVoted: boolean; createdAt: string };
type Settings = {
  voterThreshold: number;
  isFinalized: boolean;
  isRevealed: boolean;
  actualRanking: number[] | null;
};
type Country = { id: number; code: string; name: string; flag: string };

type State = { settings: Settings; voters: Voter[]; countries: Country[] };

const POLL_MS = 5000;

export function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [names, setNames] = useState("");
  const [threshold, setThreshold] = useState("");
  const [ranking, setRanking] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const rankingInitialized = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/state", { cache: "no-store" });
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json();
    setState(data);
    setThreshold((prev) => (prev === "" ? String(data.settings.voterThreshold || "") : prev));
    if (!rankingInitialized.current) {
      rankingInitialized.current = true;
      setRanking(data.settings.actualRanking ?? data.countries.map((c: Country) => c.id));
    }
  }, [router]);

  useEffect(() => {
    // load()'s setState calls all happen after an await (same pattern as
    // ResultsBoard's poll()); the rule can't see that through useCallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function addVoters() {
    const list = names.split("\n").map((n) => n.trim()).filter(Boolean);
    if (list.length === 0) return;
    await withBusy(async () => {
      const res = await fetch("/api/admin/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNames("");
      await load();
    });
  }

  async function removeVoter(id: number) {
    await withBusy(async () => {
      await fetch(`/api/admin/voters/${id}`, { method: "DELETE" });
      await load();
    });
  }

  async function saveThreshold() {
    await withBusy(async () => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterThreshold: Number(threshold) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    });
  }

  async function setRevealed(revealed: boolean) {
    await withBusy(async () => {
      const res = await fetch("/api/admin/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revealed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    });
  }

  async function resetPoll() {
    if (!confirm("This wipes every ballot and reopens voting. Are you sure?")) return;
    await withBusy(async () => {
      await fetch("/api/admin/reset", { method: "POST" });
      await load();
    });
  }

  function moveRanked(index: number, direction: -1 | 1) {
    setRanking((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function saveActualResult() {
    await withBusy(async () => {
      const res = await fetch("/api/admin/actual-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranking }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Actual result saved!");
      await load();
    });
  }

  async function clearActualResult() {
    await withBusy(async () => {
      const res = await fetch("/api/admin/actual-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranking: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    });
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function copyLink(token: string) {
    const url = `${origin}/vote/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied!");
    } catch {
      setMessage(url);
    }
  }

  if (!state) return <p className="text-center text-slate-400">Loading…</p>;

  const { settings, voters, countries } = state;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const countryById = new Map(countries.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <button onClick={logout} className="text-sm text-slate-400 underline hover:text-slate-200">
          Log out
        </button>
      </div>

      {message && <p className="rounded-lg bg-asia-panel px-4 py-2 text-sm text-asia-accent2">{message}</p>}

      <section className="rounded-2xl border border-slate-700 bg-asia-panel p-5">
        <h2 className="mb-3 text-lg font-bold">Poll status</h2>
        <div className="flex flex-wrap items-center gap-4">
          <span>
            {votedCount} / {voters.length} voted
          </span>
          <span className={settings.isFinalized ? "text-asia-gold" : "text-slate-400"}>
            {settings.isFinalized ? "Finalized" : "Open"}
          </span>
          <span className={settings.isRevealed ? "text-asia-gold" : "text-slate-400"}>
            {settings.isRevealed ? "Revealed" : "Hidden"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-slate-300">
            Voters needed to finalize
            <input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="mt-1 w-40 rounded-lg border border-slate-600 bg-asia-bg px-3 py-2 text-slate-100"
              placeholder="e.g. 10"
            />
          </label>
          <button
            onClick={saveThreshold}
            disabled={busy}
            className="rounded-full bg-asia-accent2 px-4 py-2 text-sm font-bold text-asia-bg disabled:opacity-40"
          >
            Save
          </button>
          <p className="text-xs text-slate-500">0 means the poll never auto-finalizes.</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setRevealed(!settings.isRevealed)}
            disabled={busy || (!settings.isFinalized && !settings.isRevealed)}
            className="rounded-full border border-asia-gold px-4 py-2 text-sm font-bold text-asia-gold disabled:cursor-not-allowed disabled:opacity-30"
          >
            {settings.isRevealed ? "Hide results again" : "Reveal final results"}
          </button>
          <button
            onClick={resetPoll}
            disabled={busy}
            className="rounded-full border border-red-500 px-4 py-2 text-sm font-bold text-red-400 disabled:opacity-40"
          >
            Reset poll (wipe votes)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-asia-panel p-5">
        <h2 className="mb-3 text-lg font-bold">Actual result</h2>
        <p className="mb-3 text-sm text-slate-400">
          Once the real contest airs, order the countries from 1st to last. The results page will then show who
          predicted it best.{" "}
          <span className={settings.actualRanking ? "text-asia-gold" : "text-slate-500"}>
            {settings.actualRanking ? "Saved." : "Not entered yet."}
          </span>
        </p>
        <ol className="flex flex-col gap-2">
          {ranking.map((id, i) => {
            const country = countryById.get(id);
            if (!country) return null;
            return (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 px-3 py-2"
              >
                <span className="flex items-center gap-3">
                  <span className="w-6 text-right font-bold text-slate-500">{i + 1}</span>
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
                <span className="flex gap-1">
                  <button
                    onClick={() => moveRanked(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${country.name} up`}
                    className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-asia-accent2 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveRanked(i, 1)}
                    disabled={i === ranking.length - 1}
                    aria-label={`Move ${country.name} down`}
                    className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-asia-accent2 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={saveActualResult}
            disabled={busy}
            className="rounded-full bg-asia-accent2 px-4 py-2 text-sm font-bold text-asia-bg disabled:opacity-40"
          >
            Save actual result
          </button>
          {settings.actualRanking && (
            <button
              onClick={clearActualResult}
              disabled={busy}
              className="rounded-full border border-red-500 px-4 py-2 text-sm font-bold text-red-400 disabled:opacity-40"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-asia-panel p-5">
        <h2 className="mb-3 text-lg font-bold">Add voters</h2>
        <textarea
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder={"One name per line\nAlice\nBob\nCharlie"}
          rows={4}
          className="w-full rounded-lg border border-slate-600 bg-asia-bg px-3 py-2 text-slate-100"
        />
        <button
          onClick={addVoters}
          disabled={busy || !names.trim()}
          className="mt-3 rounded-full bg-asia-accent2 px-4 py-2 text-sm font-bold text-asia-bg disabled:opacity-40"
        >
          Add
        </button>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-asia-panel p-5">
        <h2 className="mb-3 text-lg font-bold">Voters ({voters.length})</h2>
        <ul className="flex flex-col gap-2">
          {voters.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span>{v.hasVoted ? "✅" : "⏳"}</span>
                <span>{v.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  onClick={() => copyLink(v.token)}
                  className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:border-asia-accent2"
                >
                  Copy link
                </button>
                <button
                  onClick={() => removeVoter(v.id)}
                  disabled={busy}
                  className="rounded-full border border-red-500/60 px-3 py-1 text-xs text-red-400"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
          {voters.length === 0 && <p className="text-sm text-slate-500">No voters yet — add some above.</p>}
        </ul>
      </section>
    </div>
  );
}
