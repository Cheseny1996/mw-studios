import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

const roles = ["member", "super_admin", "admin", "content_editor", "event_manager", "communications", "hr_manager", "election_manager", "shop_manager", "finance_manager"];

export async function GET() {
  const session = await getSession();
  if (!session || !["super_admin", "admin"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  const users = await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users, roles });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["super_admin", "admin"].includes(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.userId || !roles.includes(body.role)) return NextResponse.json({ error: "Valid user and role are required." }, { status: 400 });
  if (String(session.role) !== "super_admin" && ["super_admin", "admin"].includes(body.role)) return NextResponse.json({ error: "Only a super administrator can assign administrator roles." }, { status: 403 });
  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(body.userId, { role: body.role }, { new: true }).select("-passwordHash");
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: "User not found." }, { status: 404 });
}
