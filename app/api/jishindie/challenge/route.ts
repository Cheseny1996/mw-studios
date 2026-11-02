import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { ChallengeRegistrationModel, ChallengeVoteModel } from "@/lib/models";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const slug = request.nextUrl.searchParams.get("challenge") || "weekly-jishindie";
  const [registered, approved, totals] = await Promise.all([
    ChallengeRegistrationModel.countDocuments({ challengeSlug: slug }),
    ChallengeRegistrationModel.find({ challengeSlug: slug, status: "approved" })
      .select("fullName stageName category entryTitle entryLink status voterId")
      .lean(),
    ChallengeVoteModel.aggregate([
      { $match: { challengeSlug: slug } },
      { $group: { _id: "$contestantId", votes: { $sum: 1 } } },
    ]),
  ]);
  const voteTotals = new Map(totals.map((row: { _id: unknown; votes: number }) => [String(row._id), row.votes]));
  return NextResponse.json({
    challenge: {
      slug,
      title: "Weekly Jishindie Challenge",
      status: "registration",
      prizes: [
        { name: "Grand Prize", reward: "Feature outfit + branded merchandise" },
        { name: "Runner Up", reward: "MzimaWells hoodie + studio access" },
        { name: "Fan Favourite", reward: "MzimaWells mug + branded T-shirt" },
      ],
    },
    registered,
    contestants: approved.map((entry) => ({
      ...entry,
      voteCount: voteTotals.get(String(entry._id)) ?? 0,
    })),
  }, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
}

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  stageName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  category: z.enum(["music", "dance", "film", "fashion", "comedy", "content"]),
  entryTitle: z.string().trim().min(2).max(160),
  entryLink: z.string().trim().url().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid registration details." }, { status: 400 });
  }
  await connectToDatabase();
  try {
    const slug = "weekly-jishindie";
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
