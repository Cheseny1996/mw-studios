import { connection, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CommunityPollModel, CommunityPollVoteModel } from "@/lib/models";

export async function GET() {
  await connection();
  await connectToDatabase();
  const now = new Date();
  const polls = await CommunityPollModel.find({
    status: { $ne: "draft" },
    startsAt: { $lte: now },
  }).sort({ createdAt: -1 }).lean();
  const counts = await CommunityPollVoteModel.aggregate([
    { $match: { pollId: { $in: polls.map((poll) => poll._id) } } },
    { $group: { _id: { pollId: "$pollId", optionIndex: "$optionIndex" }, votes: { $sum: 1 } } },
  ]);
  const totals = new Map(counts.map((row: { _id: { pollId: unknown; optionIndex: number }; votes: number }) => [
    `${String(row._id.pollId)}:${row._id.optionIndex}`,
    row.votes,
  ]));
  return NextResponse.json({
    polls: polls.map((poll) => {
      const options = poll.options.map((label: string, index: number) => ({
        label,
        votes: totals.get(`${String(poll._id)}:${index}`) || 0,
      }));
      return {
        _id: String(poll._id),
        title: poll.title,
        description: poll.description,
        status: poll.status === "closed" || new Date(poll.endsAt).getTime() <= now.getTime() ? "closed" : "active",
        startsAt: new Date(poll.startsAt).toISOString(),
        endsAt: new Date(poll.endsAt).toISOString(),
        options,
        totalVotes: options.reduce((total: number, option: { votes: number }) => total + option.votes, 0),
      };
    }),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
