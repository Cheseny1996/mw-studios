import { NextRequest, NextResponse } from "next/server";
import { getFreshStaffSession } from "@/lib/staff-auth";
import { connectToDatabase } from "@/lib/db";
import { StudioEventModel } from "@/lib/models";
import { canManageStaffSection } from "@/lib/staff-roles";

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "events")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  return NextResponse.json({ events: await StudioEventModel.find().sort({ date: 1 }).lean() });
}

export async function POST(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "events")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.date) return NextResponse.json({ error: "Title and date are required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const event = await StudioEventModel.findOneAndUpdate({ slug }, { ...body, slug }, { upsert: true, new: true, runValidators: true });
  return NextResponse.json({ event });
}

export async function PATCH(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "events")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.title || !body?.date) return NextResponse.json({ error: "Event ID, title and date are required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const event = await StudioEventModel.findByIdAndUpdate(body.id, { ...body, slug }, { new: true, runValidators: true });
  return event ? NextResponse.json({ event }) : NextResponse.json({ error: "Event not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "events")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  await connectToDatabase();
  const event = await StudioEventModel.findByIdAndDelete(id);
  return event ? NextResponse.json({ message: "Event deleted." }) : NextResponse.json({ error: "Event not found." }, { status: 404 });
}
