import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { OpportunityModel } from "@/lib/models";

export async function GET() {
  const session = await getSession();
  if (!session || !["super_admin", "admin", "hr_manager", "content_editor"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  return NextResponse.json({ opportunities: await OpportunityModel.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["super_admin", "admin", "hr_manager", "content_editor"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const opportunity = await OpportunityModel.findOneAndUpdate({ slug }, { ...body, slug }, { upsert: true, new: true, runValidators: true });
  return NextResponse.json({ opportunity });
}
