import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    await connectToDatabase();
    const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    if (superAdminEmail && user.email === superAdminEmail && user.role !== "super_admin") {
      user.role = "super_admin";
      await user.save();
    }
    if (user.status !== "active") return NextResponse.json({ error: "This account is unavailable." }, { status: 403 });
    await createSession(user);
    return NextResponse.json({ user: { id: user._id, name: user.fullName, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Sign-in service unavailable:", error);
    return NextResponse.json(
      { error: "Sign-in is unavailable because the database or authentication service is not configured. Set MONGODB_URI and AUTH_SECRET, then restart the app." },
      { status: 503 },
    );
  }
}
