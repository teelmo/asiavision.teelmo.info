import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid voter id." }, { status: 400 });
  }

  await mutate((db) => {
    db.voters = db.voters.filter((v) => v.id !== id);
    db.votes = db.votes.filter((v) => v.voterId !== id);
  });

  return NextResponse.json({ ok: true });
}
