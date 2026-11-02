import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { ChallengeRegistrationModel, ChallengeVoteModel } from "@/lib/models";

export function getJishindieSchedule(now = new Date()) {
  const shifted = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const date = shifted.getUTCDate();
  const day = shifted.getUTCDay();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();

  const elapsedMinutes = hour * 60 + minute;
  let daysUntilSunday = (7 - day) % 7;
  if (day === 0 && elapsedMinutes < 21 * 60) daysUntilSunday = 0;

  const sunday = Date.UTC(year, month, date + daysUntilSunday);
  const registrationEndsAt = new Date(sunday + 8 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);
  const votingEndsAt = new Date(sunday + 21 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);

  let status: "registration" | "voting" | "closed" = "registration";
  if (now.getTime() >= registrationEndsAt.getTime() && now.getTime() < votingEndsAt.getTime()) status = "voting";
  if (now.getTime() >= votingEndsAt.getTime()) status = "closed";

  return {
    timezone: "Africa/Nairobi (EAT)",
    status,
    registrationEndsAt: registrationEndsAt.toISOString(),
    votingStartsAt: registrationEndsAt.toISOString(),
    votingEndsAt: votingEndsAt.toISOString(),
    nextAnnouncement: status === "registration"
      ? "Registration closes Sunday at 8:00 AM EAT. Voting opens immediately."
      : status === "voting"
        ? "Voting is live until Sunday at 9:00 PM EAT."
        : "The challenge is complete. The next Sunday challenge opens for registration.",
  };
}

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const slug = request.nextUrl.searchParams.get("challenge") || "weekly-jishindie";
  const [registered, allEntries, approved, totals] = await Promise.all([
    ChallengeRegistrationModel.countDocuments({ challengeSlug: slug }),
    ChallengeRegistrationModel.find({ challengeSlug: slug })
      .select("fullName stageName category entryTitle entryLink photograph status")
      .sort({ createdAt: -1 })
      .lean(),
    ChallengeRegistrationModel.find({ challengeSlug: slug, status: "approved" })
      .select("fullName stageName category entryTitle entryLink photograph status voterId")
      .lean(),
    ChallengeVoteModel.aggregate([
      { $match: { challengeSlug: slug } },
      { $group: { _id: "$contestantId", votes: { $sum: 1 } } },
    ]),
  ]);
  const voteTotals = new Map(totals.map((row: { _id: unknown; votes: number }) => [String(row._id), row.votes]));
  return NextResponse.json({
    schedule: getJishindieSchedule(),
    challenge: {
      slug,
      title: "Weekly Jishindie Challenge",
      status: "registration",
    },
    registered,
    totalVotes: totals.reduce((sum: number, row: { votes: number }) => sum + row.votes, 0),
    entries: allEntries.map((entry) => ({
      _id: String(entry._id),
      fullName: entry.fullName,
      stageName: entry.stageName || "",
      category: entry.category,
      status: entry.status,
      photograph: entry.photograph || "",
    })),
    contestants: approved.map((entry) => ({
      ...entry,
      voteCount: voteTotals.get(String(entry._id)) ?? 0,
    })),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

const registrationSchema = z.object({
  challengeSlug: z.string().trim().min(2).max(100).optional(),
  fullName: z.string().trim().min(2).max(100),
  stageName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  category: z.enum(["music", "dance", "film", "fashion", "comedy", "content"]),
  entryTitle: z.string().trim().min(2).max(160),
  entryLink: z.string().trim().url().optional().or(z.literal("")),
  photograph: z.string().max(2_500_000).optional().refine(
    (value) => !value || /^data:image\/(jpeg|png|webp);base64,/i.test(value),
    "Upload a JPEG, PNG, or WebP image.",
  ),
});

export async function POST(request: NextRequest) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid registration details." }, { status: 400 });
  }
  const schedule = getJishindieSchedule();
  if (schedule.status !== "registration") {
    return NextResponse.json({
      error: schedule.status === "voting"
        ? "Registration has closed. Voting is now live."
        : "Registration for this challenge has ended.",
    }, { status: 409 });
  }
  await connectToDatabase();
  try {
    const slug = parsed.data.challengeSlug === "kapsokwony-annual-run"
      ? "kapsokwony-annual-run"
      : "weekly-jishindie";
    const entry = await ChallengeRegistrationModel.findOneAndUpdate(
      { challengeSlug: slug, email: parsed.data.email.toLowerCase() },
      {
        $setOnInsert: {
          challengeSlug: slug,
          ...parsed.data,
          email: parsed.data.email.toLowerCase(),
          voterId: `MW-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
          status: "registered",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return NextResponse.json({
      success: true,
      voterId: entry?.voterId,
      message: "Registration received. Your contestant profile will be visible after approval.",
    }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ success: true, message: "This email is already registered for the weekly challenge." });
    }
    throw error;
  }
}
