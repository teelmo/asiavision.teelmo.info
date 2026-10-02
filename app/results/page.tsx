import { ResultsBoard } from "@/components/ResultsBoard";

export default function ResultsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-asia-accent2">Live scoreboard</p>
        <h1 className="mt-2 text-4xl font-black">Asiavision 2026</h1>
      </div>
      <ResultsBoard />
    </main>
  );
}
