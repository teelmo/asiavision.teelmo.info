import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-asia-accent2">Friends-only edition</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">
          Asia<span className="text-asia-accent">vision</span> 2026
        </h1>
      </div>

      <p className="max-w-md text-slate-300">
        Got a voting link from the host? Open it to cast your 12 / 10 / 8 / -4 points.
        Otherwise, check the live scoreboard below.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/results"
          className="rounded-full bg-asia-accent px-6 py-3 font-semibold text-white shadow-lg shadow-asia-accent/30 transition hover:brightness-110"
        >
          View live results
        </Link>
        <Link
          href="/admin"
          className="rounded-full border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-400"
        >
          Host admin
        </Link>
      </div>
    </main>
  );
}
