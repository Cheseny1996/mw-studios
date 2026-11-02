import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const role = String(session.role || "member");
  const staff = ["super_admin", "admin", "content_editor", "event_manager", "hr_manager"];
  if (!staff.includes(role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  return NextResponse.json({ user: { id: session.sub, name: session.name, email: session.email, role } });
}
