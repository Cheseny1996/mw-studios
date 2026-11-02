import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { ASSIGNABLE_STAFF_ROLES, STAFF_DEPARTMENTS } from "@/lib/staff-roles";
import { getFreshStaffSession } from "@/lib/staff-auth";

const assignmentSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(ASSIGNABLE_STAFF_ROLES),
  department: z.enum(STAFF_DEPARTMENTS),
});

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Only a super administrator can manage staff roles." }, { status: 403 });
  await connectToDatabase();
  const users = await UserModel.find(
    { role: { $in: ASSIGNABLE_STAFF_ROLES }, status: "active" },
    { _id: 1, fullName: 1, email: 1, role: 1, department: 1 },
  ).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ users, roles: ASSIGNABLE_STAFF_ROLES, departments: STAFF_DEPARTMENTS });
}

export async function PATCH(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Only a super administrator can manage staff roles." }, { status: 403 });
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email, role, and department." }, { status: 400 });
  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) return NextResponse.json({ error: "No account was found for that email. The person must register first." }, { status: 404 });
  if (user.status !== "active") return NextResponse.json({ error: "This account is not active and cannot be assigned a staff role." }, { status: 409 });
  if (user.role === "super_admin") return NextResponse.json({ error: "The super administrator account cannot be changed here." }, { status: 403 });

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
