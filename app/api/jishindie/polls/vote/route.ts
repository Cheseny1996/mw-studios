import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { CommunityPollModel, CommunityPollVoteModel } from "@/lib/models";

const voteSchema = z.object({
  pollId: z.string().refine(mongoose.isValidObjectId, "Invalid poll."),
  voterId: z.string().trim().min(16).max(128),
  optionIndex: z.number().int().min(0).max(7),
});

export async function POST(request: NextRequest) {
  const parsed = voteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select an option to vote." }, { status: 400 });
  await connectToDatabase();
  const poll = await CommunityPollModel.findById(parsed.data.pollId).lean();
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  const now = Date.now();
  if (poll.status !== "active" || now < new Date(poll.startsAt).getTime() || now >= new Date(poll.endsAt).getTime()) {
    return NextResponse.json({ error: "This poll is not open for voting." }, { status: 409 });
  }
  if (parsed.data.optionIndex >= poll.options.length) {
    return NextResponse.json({ error: "Choose an option from this poll." }, { status: 400 });
  }
  try {
    await CommunityPollVoteModel.create({
      pollId: poll._id,
      voterId: parsed.data.voterId,
      optionIndex: parsed.data.optionIndex,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "You have already voted in this poll." }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({ success: true, message: "Your vote has been recorded." });
}
