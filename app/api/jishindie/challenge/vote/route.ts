import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ChallengeRegistrationModel, ChallengeVoteModel } from "@/lib/models";
import { getChallengeSchedule } from "@/lib/jishindie-schedule";

const schema = z.object({
  contestantId: z.string().min(1),
  voterId: z.string().min(1).max(128).optional(),
  challengeSlug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a contestant before voting." }, { status: 400 });
  await connectToDatabase();
  const challengeSlug = parsed.data.challengeSlug || "weekly-jishindie";
  const schedule = await getChallengeSchedule(challengeSlug);
  if (!schedule.published) {
    return NextResponse.json({ error: "This challenge has not been published yet." }, { status: 409 });
  }
  if (schedule.status !== "voting") {
    return NextResponse.json({
      error: schedule.status === "registration" || schedule.status === "scheduled"
        ? "Voting is not open for this challenge yet."
        : "Voting has ended for this challenge.",
    }, { status: 409 });
  }
  let voterId = parsed.data.voterId || request.headers.get("x-mzima-voter-id");
  if (!voterId) {
    voterId = crypto.randomUUID();
    return NextResponse.json({ voterId, requiresRegistration: true }, { status: 401 });
  }
  const contestant = await ChallengeRegistrationModel.findOne({
    _id: parsed.data.contestantId,
    challengeSlug,
    status: "approved",
  }).lean();
  if (!contestant) return NextResponse.json({ error: "This contestant is not currently approved for voting." }, { status: 404 });
  try {
    await ChallengeVoteModel.create({
      challengeSlug,
      contestantId: contestant._id,
      voterId,
      auditReference: `MWJ-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
    });
    return NextResponse.json({ success: true, message: "Your vote has been recorded." });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "You have already voted in this weekly challenge." }, { status: 409 });
    }
    throw error;
  }
}
