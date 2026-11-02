import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";

function canManagePosts(role: string) {
  return ["super_admin", "admin", "content_editor"].includes(role);
}

export async function GET() {
  const session = await getSession();
  if (!session || !canManagePosts(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  const posts = await ContentModel.find({ type: "post" }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !canManagePosts(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const post = await ContentModel.findOneAndUpdate(
    { slug, type: "post" },
    { ...body, slug, type: "post", status: body.status || "draft", publishedAt: body.status === "published" ? new Date() : undefined },
    { upsert: true, new: true, runValidators: true },
  );
  return NextResponse.json({ post }, { status: body.status === "published" ? 200 : 201 });
}
