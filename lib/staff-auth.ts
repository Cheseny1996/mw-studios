import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

export async function getFreshStaffSession() {
  const session = await getSession();
  if (!session || typeof session.sub !== "string") return null;

  await connectToDatabase();
  const user = await UserModel.findById(session.sub)
    .select("_id fullName email role department status")
    .lean();

  if (!user || user.status !== "active") return null;

  return {
    ...session,
    sub: String(user._id),
    name: user.fullName,
    email: user.email,
    role: String(user.role),
    department: String(user.department || "other"),
  };
}
