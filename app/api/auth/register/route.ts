import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { createSession } from "@/lib/auth";

const schema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  password: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid account details." }, { status: 400 });
  }
  await connectToDatabase();
  const email = parsed.data.email.toLowerCase();
  if (await UserModel.exists({ email })) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await UserModel.create({
    ...parsed.data,
    email,
    passwordHash,
    role: "member",
    emailVerified: false,
    status: "active",
  });
  await createSession(user);
  return NextResponse.json({ user: { id: user._id, name: user.fullName, email: user.email, role: user.role } }, { status: 201 });
}
