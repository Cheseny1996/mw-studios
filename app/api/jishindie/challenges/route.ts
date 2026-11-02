import { connection, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ChallengeSettingsModel } from "@/lib/models";

export async function GET() {
  await connection();
  await connectToDatabase();
  const challenges = await ChallengeSettingsModel.find({ published: { $ne: false } })
    .select("challengeSlug title challengeType description registrationStartsAt registrationEndsAt votingStartsAt votingEndsAt")
    .sort({ registrationStartsAt: 1 })
    .lean();
  return NextResponse.json({
    challenges: challenges.map((challenge) => ({
      slug: challenge.challengeSlug,
      title: challenge.title,
      type: challenge.challengeType,
      description: challenge.description || "",
      registrationStartsAt: challenge.registrationStartsAt,
      registrationEndsAt: challenge.registrationEndsAt,
      votingStartsAt: challenge.votingStartsAt,
      votingEndsAt: challenge.votingEndsAt,
    })),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
