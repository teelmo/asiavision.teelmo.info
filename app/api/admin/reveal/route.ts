import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const revealed = Boolean(body?.revealed);

  const outcome = await mutate((db) => {
    if (revealed && !db.settings.isFinalized) {
      return { error: "Voting isn't finalized yet." } as const;
    }
    db.settings.isRevealed = revealed;
    return { ok: true } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
