import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Wipes all votes and reopens the poll. Voters themselves are kept.
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.voteEntry.deleteMany({}),
    prisma.vote.deleteMany({}),
    prisma.voter.updateMany({ data: { hasVoted: false } }),
    prisma.pollSettings.update({ where: { id: 1 }, data: { isFinalized: false, isRevealed: false } }),
  ]);

  return NextResponse.json({ ok: true });
}
