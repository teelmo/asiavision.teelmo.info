import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const db = await getDB();
  return NextResponse.json({
    settings: db.settings,
    voters: db.voters,
    countries: COUNTRIES,
  });
}
