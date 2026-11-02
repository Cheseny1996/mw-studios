import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { StudioEventModel } from "@/lib/models";

export async function GET() {
  await connectToDatabase();
  const events = await StudioEventModel.find({ status: "published" }).sort({ date: 1 }).lean();
  return NextResponse.json({ events });
}
