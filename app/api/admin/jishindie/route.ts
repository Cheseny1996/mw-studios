import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ChallengeRegistrationModel } from "@/lib/models";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["super_admin", "admin", "election_manager"].includes(String(session.role))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  await connectToDatabase();
  const slug = request.nextUrl.searchParams.get("challenge") || "weekly-jishindie";
  const entries = await ChallengeRegistrationModel.find({ challengeSlug: slug }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ entries });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["super_admin", "admin", "election_manager"].includes(String(session.role))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.entryId || !["pending", "approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ error: "Valid entry and status are required." }, { status: 400 });
  }
  await connectToDatabase();
  const entry = await ChallengeRegistrationModel.findByIdAndUpdate(
    body.entryId,
    { status: body.status },
    { new: true },
  );
  return entry
    ? NextResponse.json({ entry })
    : NextResponse.json({ error: "Entry not found." }, { status: 404 });
}
