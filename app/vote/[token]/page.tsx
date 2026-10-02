import { getDB } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { BallotForm } from "@/components/BallotForm";

export const dynamic = "force-dynamic";

function Shell({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-slate-300">{body}</p>
    </main>
  );
}

export default async function VotePage({ params }: { params: { token: string } }) {
  const db = await getDB();
  const voter = db.voters.find((v) => v.token === params.token);

  if (!voter) {
    return (
      <Shell
        title="Link not recognized"
        body="Double check the link your host sent you — it might have a typo, or you may need a fresh one."
      />
    );
  }

  if (voter.hasVoted) {
    return (
      <Shell
        title={`Thanks, ${voter.name}!`}
        body="Your ballot is already in. Head to the results page to watch the live (anonymous) leaderboard."
      />
    );
  }

  if (db.settings.isFinalized) {
    return (
      <Shell
        title="Voting is closed"
        body="All ballots are in and the poll has been finalized. Ask your host when results drop."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-asia-accent2">Hi {voter.name}</p>
        <h1 className="mt-2 text-4xl font-black">Cast your ballot</h1>
        <p className="mt-2 text-slate-300">
          Give 12, 10 and 8 points to your top three, and -4 to your least favorite. Everyone
          else gets nothing. Choices are final once submitted.
        </p>
      </div>
      <BallotForm token={voter.token} countries={COUNTRIES} />
    </main>
  );
}
