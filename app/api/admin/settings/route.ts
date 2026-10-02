import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const settings = await prisma.pollSettings.upsert({
    where: { id: 1 },
    update: { voterThreshold },
    create: { id: 1, voterThreshold },
  });

  // Threshold lowered below an already-reached count should still finalize.
  if (!settings.isFinalized && voterThreshold > 0) {
    const votedCount = await prisma.voter.count({ where: { hasVoted: true } });
    if (votedCount >= voterThreshold) {
      await prisma.pollSettings.update({ where: { id: 1 }, data: { isFinalized: true } });
    }
  }

  return NextResponse.json({ ok: true });
}
