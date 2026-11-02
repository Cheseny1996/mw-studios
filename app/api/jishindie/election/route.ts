import { connection, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CandidateModel, ElectionModel, VoteModel } from "@/lib/models";

export async function GET() {
  await connection();
  await connectToDatabase();
  const now = new Date();
  const election = await ElectionModel.findOne({ endAt: { $gte: now } }).sort({ startAt: 1 }) ?? await ElectionModel.findOne().sort({ startAt: -1 });
  if (!election) return NextResponse.json({ election: null, candidates: [], totalValidVotes: 0, status: "registration" });
  const candidates = await CandidateModel.find({ status: "approved" }).sort({ displayName: 1 }).lean();
  const totals = await VoteModel.aggregate([
    { $match: { electionId: election._id, validityStatus: "valid" } },
    { $group: { _id: "$candidateId", votes: { $sum: 1 } } },
  ]);
  const tally = new Map(totals.map((row: { _id: unknown; votes: number }) => [String(row._id), row.votes]));
  const ranked = candidates.map((candidate) => ({ ...candidate, voteCount: tally.get(String(candidate._id)) ?? 0 }));
  ranked.sort((a, b) => b.voteCount - a.voteCount);
  const totalValidVotes = ranked.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  return NextResponse.json({ election, candidates: ranked, totalValidVotes, status: election.status });
}
