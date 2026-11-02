import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The reset link is invalid or incomplete." }, { status: 400 });
  await connectToDatabase();
  const hash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await UserModel.findOne({
    resetTokenHash: hash,
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) return NextResponse.json({ error: "The reset link is invalid or has expired." }, { status: 400 });
  user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();
  return NextResponse.json({ success: true, message: "Your password has been changed. You can now sign in." });
}
