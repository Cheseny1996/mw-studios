import { connection, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { ChallengeRegistrationModel, ChallengeVoteModel } from "@/lib/models";
import { getChallengeSchedule, getJishindieSchedule } from "@/lib/jishindie-schedule";

export { getJishindieSchedule };

export async function GET(request: NextRequest) {
  await connection();
  await connectToDatabase();
  const slug = request.nextUrl.searchParams.get("challenge") || "weekly-jishindie";
  const [registered, allEntries, approved, totals, schedule, voteTrend] = await Promise.all([
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
    getChallengeSchedule(slug),
    ChallengeVoteModel.aggregate([
      { $match: { challengeSlug: slug, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: "hour" } }, votes: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const voteTotals = new Map(totals.map((row: { _id: unknown; votes: number }) => [String(row._id), row.votes]));
  return NextResponse.json({
    schedule,
    challenge: {
      slug,
      title: schedule.title,
      type: schedule.challengeType,
      status: schedule.status,
      published: schedule.published,
      description: schedule.description,
    },
    registered,
    totalVotes: totals.reduce((sum: number, row: { votes: number }) => sum + row.votes, 0),
    voteTrend: voteTrend.map((row: { _id: Date; votes: number }) => ({
      at: new Date(row._id).toISOString(),
      votes: row.votes,
    })),
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
  challengeSlug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
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
  await connectToDatabase();
  const slug = parsed.data.challengeSlug || "weekly-jishindie";
  const schedule = await getChallengeSchedule(slug);
  if (!schedule.published) {
    return NextResponse.json({ error: "This challenge has not been published yet." }, { status: 409 });
  }
  if (schedule.status !== "registration") {
    return NextResponse.json({
      error: schedule.status === "voting"
        ? "Registration has closed. Voting is now live."
        : schedule.status === "scheduled"
          ? "Registration has not opened for this challenge yet."
          : "Registration for this challenge has ended.",
    }, { status: 409 });
  }
  try {
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
      return NextResponse.json({ success: true, message: "This email is already registered for this challenge." });
    }
    throw error;
  }
}
