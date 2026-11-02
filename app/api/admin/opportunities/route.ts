import { NextRequest, NextResponse } from "next/server";
import { getFreshStaffSession } from "@/lib/staff-auth";
import { connectToDatabase } from "@/lib/db";
import { OpportunityModel } from "@/lib/models";

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session || !["super_admin", "admin", "hr_manager", "content_editor"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  return NextResponse.json({ opportunities: await OpportunityModel.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !["super_admin", "admin", "hr_manager", "content_editor"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const opportunity = await OpportunityModel.findOneAndUpdate({ slug }, { ...body, slug }, { upsert: true, new: true, runValidators: true });
  return NextResponse.json({ opportunity });
}

export async function PATCH(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !["super_admin", "admin", "hr_manager", "content_editor"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.title) return NextResponse.json({ error: "Opportunity ID and title are required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const opportunity = await OpportunityModel.findByIdAndUpdate(body.id, { ...body, slug }, { new: true, runValidators: true });
  return opportunity ? NextResponse.json({ opportunity }) : NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !["super_admin", "admin", "hr_manager", "content_editor"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 });
  await connectToDatabase();
  const opportunity = await OpportunityModel.findByIdAndDelete(id);
  return opportunity ? NextResponse.json({ message: "Opportunity deleted." }) : NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
}
