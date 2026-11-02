import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { passwordResetToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const parsed = z.object({ email: z.string().email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  await connectToDatabase();
  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() });
  if (user) {
    const reset = passwordResetToken();
    user.resetTokenHash = reset.hash;
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
  }
  return NextResponse.json({ success: true, message: "If an account exists for that email, password reset instructions have been sent." });
}
