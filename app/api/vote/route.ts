import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBallot } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;

  if (!token) {
    return NextResponse.json({ error: "Missing voter token." }, { status: 400 });
  }

  const voter = await prisma.voter.findUnique({ where: { token } });
  if (!voter) {
    return NextResponse.json({ error: "Voting link not recognized." }, { status: 404 });
  }
  if (voter.hasVoted) {
    return NextResponse.json({ error: "You've already voted — thanks!" }, { status: 409 });
  }

  const settings = await prisma.pollSettings.findUnique({ where: { id: 1 } });
  if (settings?.isFinalized) {
    return NextResponse.json({ error: "Voting has closed." }, { status: 403 });
  }

  const countries = await prisma.country.findMany({ select: { id: true } });
  const validIds = new Set(countries.map((c) => c.id));

  const result = validateBallot(body?.entries, validIds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.vote.create({
      data: {
        voterId: voter.id,
        entries: {
          create: result.entries.map((e) => ({ countryId: e.countryId, points: e.points })),
        },
      },
    });
    await tx.voter.update({ where: { id: voter.id }, data: { hasVoted: true } });

    const votedCount = await tx.voter.count({ where: { hasVoted: true } });
    const current = await tx.pollSettings.findUnique({ where: { id: 1 } });
    if (current && current.voterThreshold > 0 && votedCount >= current.voterThreshold && !current.isFinalized) {
      await tx.pollSettings.update({ where: { id: 1 }, data: { isFinalized: true } });
    }
  });

  return NextResponse.json({ ok: true });
}
