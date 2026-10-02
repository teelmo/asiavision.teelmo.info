import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Wipes all votes and reopens the poll. Voters themselves are kept.
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await mutate((db) => {
    db.votes = [];
    db.voters.forEach((v) => (v.hasVoted = false));
    db.settings.isFinalized = false;
    db.settings.isRevealed = false;
  });

  return NextResponse.json({ ok: true });
}
