import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const [settings, voters, countries] = await Promise.all([
    prisma.pollSettings.findUnique({ where: { id: 1 } }),
    prisma.voter.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.country.findMany({ orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({
    settings: settings ?? { voterThreshold: 0, isFinalized: false, isRevealed: false },
    voters: voters.map((v) => ({
      id: v.id,
      name: v.name,
      token: v.token,
      hasVoted: v.hasVoted,
      createdAt: v.createdAt,
    })),
    countries,
  });
}
