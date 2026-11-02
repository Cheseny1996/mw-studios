import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  await connectToDatabase();
  await ContentModel.updateOne(
    { slug: `newsletter:${String(email).toLowerCase()}`, type: "newsletter_subscriber" },
    { $setOnInsert: { title: String(email), slug: `newsletter:${String(email).toLowerCase()}`, type: "newsletter_subscriber", status: "published" } },
    { upsert: true },
  );
  return NextResponse.json({ success: true, message: "You are subscribed to Mzima Wells updates." });
}
