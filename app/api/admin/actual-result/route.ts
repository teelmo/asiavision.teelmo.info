import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { isAdminRequest } from "@/lib/admin-auth";
import { validateActualRanking } from "@/lib/scoring";
import { COUNTRY_IDS } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (body?.ranking === null) {
    await mutate((db) => {
      db.settings.actualRanking = null;
    });
    return NextResponse.json({ ok: true });
  }

  const result = validateActualRanking(body?.ranking, COUNTRY_IDS);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await mutate((db) => {
    db.settings.actualRanking = result.ranking;
  });

  return NextResponse.json({ ok: true });
}
