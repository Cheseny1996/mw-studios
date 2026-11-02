import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ChallengeSettingsModel } from "@/lib/models";
import { getFreshStaffSession } from "@/lib/staff-auth";

const settingsSchema = z.object({
  challengeSlug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(160),
  challengeType: z.enum(["tshirt", "seasonal", "game_night", "creative", "custom"]),
  description: z.string().trim().max(2000).default(""),
  published: z.boolean().default(true),
  registrationStartsAt: z.string().datetime(),
  registrationEndsAt: z.string().datetime(),
  votingStartsAt: z.string().datetime(),
  votingEndsAt: z.string().datetime(),
  nextAnnouncement: z.string().trim().max(1000).default(""),
  prizeSummary: z.string().trim().max(1000).default(""),
}).refine((value) =>
  new Date(value.registrationStartsAt) < new Date(value.registrationEndsAt)
  && new Date(value.registrationEndsAt) <= new Date(value.votingStartsAt)
  && new Date(value.votingStartsAt) < new Date(value.votingEndsAt),
{ message: "Dates must follow: registration starts, registration ends, voting starts, voting ends." });

async function authorize() {
  const session = await getFreshStaffSession();
  if (!session) return null;
  const allowed = ["super_admin", "admin", "election_manager"].includes(session.role)
    || (session.role === "department_admin" && session.department === "elections");
  return allowed ? session : null;
}

export async function GET(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage challenge schedules." }, { status: 403 });
  await connectToDatabase();
  const challengeSlug = request.nextUrl.searchParams.get("challenge");
  const settings = challengeSlug
    ? await ChallengeSettingsModel.findOne({ challengeSlug }).lean()
    : await ChallengeSettingsModel.find().sort({ registrationStartsAt: -1 }).lean();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage challenge schedules." }, { status: 403 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid challenge schedule." }, { status: 400 });
  await connectToDatabase();
  const settings = await ChallengeSettingsModel.findOneAndUpdate(
    { challengeSlug: parsed.data.challengeSlug },
    parsed.data,
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return NextResponse.json({ settings });
}
