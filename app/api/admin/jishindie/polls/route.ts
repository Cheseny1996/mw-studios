import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { CommunityPollModel, CommunityPollVoteModel } from "@/lib/models";
import { getFreshStaffSession } from "@/lib/staff-auth";

const pollSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).default(""),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(8),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(["draft", "active", "closed"]),
}).refine((value) => new Date(value.startsAt) < new Date(value.endsAt), {
  message: "Poll end time must be after its start time.",
});

async function authorize() {
  const session = await getFreshStaffSession();
  if (!session) return null;
  const allowed = ["super_admin", "admin", "election_manager"].includes(session.role)
    || (session.role === "department_admin" && session.department === "elections");
  return allowed ? session : null;
}

export async function GET() {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage polls." }, { status: 403 });
  await connectToDatabase();
  const polls = await CommunityPollModel.find().sort({ createdAt: -1 }).lean();
  const counts = await CommunityPollVoteModel.aggregate([
    { $group: { _id: "$pollId", votes: { $sum: 1 } } },
  ]);
  const totals = new Map(counts.map((row: { _id: unknown; votes: number }) => [String(row._id), row.votes]));
  return NextResponse.json({ polls: polls.map((poll) => ({ ...poll, votes: totals.get(String(poll._id)) || 0 })) });
}

export async function POST(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage polls." }, { status: 403 });
  const parsed = pollSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid poll details." }, { status: 400 });
  const options = [...new Set(parsed.data.options.map((option) => option.trim()).filter(Boolean))];
  if (options.length < 2) return NextResponse.json({ error: "A poll needs at least two different options." }, { status: 400 });
  await connectToDatabase();
  const poll = await CommunityPollModel.create({ ...parsed.data, options });
  return NextResponse.json({ poll }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage polls." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !mongoose.isValidObjectId(body.id)) {
    return NextResponse.json({ error: "A valid poll ID is required." }, { status: 400 });
  }
  const parsed = pollSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid poll details." }, { status: 400 });
  const options = [...new Set(parsed.data.options.map((option: string) => option.trim()).filter(Boolean))];
  if (options.length < 2) return NextResponse.json({ error: "A poll needs at least two different options." }, { status: 400 });
  await connectToDatabase();
  const poll = await CommunityPollModel.findByIdAndUpdate(body.id, { ...parsed.data, options }, { new: true, runValidators: true });
  return poll
    ? NextResponse.json({ poll })
    : NextResponse.json({ error: "Poll not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage polls." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id)) return NextResponse.json({ error: "A valid poll ID is required." }, { status: 400 });
  await connectToDatabase();
  const poll = await CommunityPollModel.findByIdAndDelete(id);
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  await CommunityPollVoteModel.deleteMany({ pollId: poll._id });
  return NextResponse.json({ success: true });
}
