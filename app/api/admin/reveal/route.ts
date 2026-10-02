import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const revealed = Boolean(body?.revealed);

  const settings = await prisma.pollSettings.findUnique({ where: { id: 1 } });
  if (revealed && !settings?.isFinalized) {
    return NextResponse.json({ error: "Voting isn't finalized yet." }, { status: 400 });
  }

  await prisma.pollSettings.update({ where: { id: 1 }, data: { isRevealed: revealed } });
  return NextResponse.json({ ok: true });
}
