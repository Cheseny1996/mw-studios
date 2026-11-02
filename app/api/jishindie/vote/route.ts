import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { ElectionModel, VoteModel } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { CandidateModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const authSession = await getSession();
  if (!authSession?.sub) return NextResponse.json({ error: "Please sign in before voting." }, { status: 401 });
  const voterId = String(authSession.sub);
  const { electionId, candidateId } = await request.json().catch(() => ({}));
  if (!electionId || !candidateId) {
    return NextResponse.json({ error: "Election, voter and candidate are required." }, { status: 400 });
  }
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const election = await ElectionModel.findById(electionId).session(session);
      if (!election) throw Object.assign(new Error("Election not found."), { code: "ELECTION_NOT_FOUND" });
      const now = new Date();
      if (now < election.startAt || now > election.endAt || election.status !== "open") {
        throw Object.assign(new Error("Voting is not currently open."), { code: "VOTING_CLOSED" });
      }
      const candidate = await CandidateModel.findOne({
        _id: candidateId,
        status: "approved",
        electionIds: electionId,
      }).session(session);
      if (!candidate) throw Object.assign(new Error("The selected candidate is not eligible for this election."), { code: "INVALID_CANDIDATE" });
      const existing = await VoteModel.findOne({ electionId, voterId }).session(session);
      if (existing) throw Object.assign(new Error("YOU HAVE ALREADY VOTED THIS WEEK. Thank you for participating. You may vote again in the next eligible weekly election."), { code: "ALREADY_VOTED" });
      const auditReference = `JSH-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
      await VoteModel.create([{ electionId, voterId, candidateId, validityStatus: "valid", auditReference }], { session });
      await ElectionModel.updateOne({ _id: electionId }, { $inc: { totalValidVotes: 1 } }).session(session);
      return { success: true, message: "YOUR VOTE HAS BEEN SUCCESSFULLY RECORDED. Thank you for participating in Jishindie. Your voice counts." };
    });
    return NextResponse.json(result);
  } catch (error) {
    const typed = error as Error & { code?: string };
    const status = typed.code === "ALREADY_VOTED" ? 409 : typed.code === "VOTING_CLOSED" ? 423 : 400;
    return NextResponse.json({ error: typed.message }, { status });
  } finally {
    await session.endSession();
  }
}
