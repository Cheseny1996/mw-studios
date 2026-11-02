import { NextResponse } from "next/server";
import { getFreshStaffSession } from "@/lib/staff-auth";
import { isStaffRole } from "@/lib/staff-roles";

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const role = String(session.role || "member");
  if (!isStaffRole(role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  return NextResponse.json({
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      role,
      department: session.department,
    },
  });
}
