import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const names: unknown = body?.names;
  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ error: "Provide at least one voter name." }, { status: 400 });
  }

  const cleanNames = names
    .filter((n): n is string => typeof n === "string")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (cleanNames.length === 0) {
    return NextResponse.json({ error: "Provide at least one voter name." }, { status: 400 });
  }

  const created = await prisma.$transaction(
    cleanNames.map((name) =>
      prisma.voter.create({ data: { name, token: randomUUID() } })
    )
  );

  return NextResponse.json({ voters: created });
}
