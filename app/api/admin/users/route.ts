import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { ASSIGNABLE_STAFF_ROLES, DEPARTMENT_STAFF_ROLES, STAFF_DEPARTMENTS } from "@/lib/staff-roles";
import { getFreshStaffSession } from "@/lib/staff-auth";

const assignmentSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(ASSIGNABLE_STAFF_ROLES),
  department: z.enum(STAFF_DEPARTMENTS),
});

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session || !["super_admin", "department_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Staff role management is not available to this account." }, { status: 403 });
  }
  await connectToDatabase();
  const department = session.department;
  const filter = session.role === "super_admin"
    ? { status: "active" }
    : {
      status: "active",
      $or: [
        { department },
        { role: "member", $or: [{ department: "other" }, { department: { $exists: false } }] },
        { role: "super_admin" },
      ],
    };
  const users = await UserModel.find(
    filter,
    { _id: 1, fullName: 1, email: 1, role: 1, department: 1 },
  ).sort({ updatedAt: -1 }).lean();
  const roles = session.role === "super_admin"
    ? ASSIGNABLE_STAFF_ROLES
    : DEPARTMENT_STAFF_ROLES[department as keyof typeof DEPARTMENT_STAFF_ROLES] || [];
  return NextResponse.json({
    users,
    roles,
    departments: session.role === "super_admin" ? STAFF_DEPARTMENTS : [department],
    currentDepartment: department,
    isSuperAdmin: session.role === "super_admin",
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !["super_admin", "department_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Staff role management is not available to this account." }, { status: 403 });
  }
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email, role, and department." }, { status: 400 });
  if (session.role === "department_admin") {
    const allowedRoles = DEPARTMENT_STAFF_ROLES[session.department as keyof typeof DEPARTMENT_STAFF_ROLES] || [];
    if (parsed.data.department !== session.department || !allowedRoles.includes(parsed.data.role)) {
      return NextResponse.json({ error: "You can only assign eligible roles within your own department." }, { status: 403 });
    }
  }
  if (parsed.data.role === "department_admin" && session.role !== "super_admin") {
    return NextResponse.json({ error: "Only the global Super Admin can appoint department admins." }, { status: 403 });
  }
  if (parsed.data.role === "department_admin" && parsed.data.department === "other") {
    return NextResponse.json({ error: "Choose a specific department before appointing a department admin." }, { status: 400 });
  }
  if (parsed.data.role !== "department_admin" && parsed.data.role !== "admin"
    && !DEPARTMENT_STAFF_ROLES[parsed.data.department as keyof typeof DEPARTMENT_STAFF_ROLES]?.includes(parsed.data.role)) {
    return NextResponse.json({ error: "That staff role is not available in the selected department." }, { status: 400 });
  }
  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) return NextResponse.json({ error: "No account was found for that email. The person must register first." }, { status: 404 });
  if (user.status !== "active") return NextResponse.json({ error: "This account is not active and cannot be assigned a staff role." }, { status: 409 });
  if (user.role === "super_admin") return NextResponse.json({ error: "The super administrator account cannot be changed here." }, { status: 403 });
  if (session.role === "department_admin" && user.role === "department_admin") {
    return NextResponse.json({ error: "Only the global Super Admin can change a department admin appointment." }, { status: 403 });
  }
  if (session.role === "department_admin" && user.department !== session.department && !(user.role === "member" && (!user.department || user.department === "other"))) {
    return NextResponse.json({ error: "You can only manage members of your department or unassigned members." }, { status: 403 });
  }

  user.role = parsed.data.role;
  user.department = parsed.data.department;
  await user.save();

  return NextResponse.json({
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
}
