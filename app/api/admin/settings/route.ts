import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const voterThreshold = Number(body?.voterThreshold);
  if (!Number.isInteger(voterThreshold) || voterThreshold < 0) {
    return NextResponse.json({ error: "voterThreshold must be a non-negative integer." }, { status: 400 });
  }

  await mutate((db) => {
    db.settings.voterThreshold = voterThreshold;
    // Threshold lowered below an already-reached count should still finalize.
    if (!db.settings.isFinalized && voterThreshold > 0) {
      const votedCount = db.voters.filter((v) => v.hasVoted).length;
      if (votedCount >= voterThreshold) {
        db.settings.isFinalized = true;
      }
    }
  });

  return NextResponse.json({ ok: true });
}
