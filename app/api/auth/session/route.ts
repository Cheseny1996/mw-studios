import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session ? {
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
  } : null });
}
