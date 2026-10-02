import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { COUNTRY_IDS } from "@/lib/countries";
import { validateBallot } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;

  if (!token) {
    return NextResponse.json({ error: "Missing voter token." }, { status: 400 });
  }

  const result = validateBallot(body?.entries, COUNTRY_IDS);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const entries = result.entries;

  const outcome = await mutate((db) => {
    const voter = db.voters.find((v) => v.token === token);
    if (!voter) {
      return { error: "Voting link not recognized.", status: 404 } as const;
    }
    if (voter.hasVoted) {
      return { error: "You've already voted — thanks!", status: 409 } as const;
    }
    if (db.settings.isFinalized) {
      return { error: "Voting has closed.", status: 403 } as const;
    }

    voter.hasVoted = true;
    db.votes.push({ voterId: voter.id, entries, createdAt: new Date().toISOString() });

    const votedCount = db.voters.filter((v) => v.hasVoted).length;
    if (db.settings.voterThreshold > 0 && votedCount >= db.settings.voterThreshold) {
      db.settings.isFinalized = true;
    }

    return { ok: true } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }
  return NextResponse.json({ ok: true });
}
