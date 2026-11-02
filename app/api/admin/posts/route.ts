import { NextRequest, NextResponse } from "next/server";
import { getFreshStaffSession } from "@/lib/staff-auth";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";

function canManagePosts(role: string) {
  return ["super_admin", "admin", "content_editor", "communications"].includes(role);
}

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session || !canManagePosts(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  const posts = await ContentModel.find({ type: "post" }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const session = await getFreshStaffSession();
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

export async function PATCH(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManagePosts(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.title) return NextResponse.json({ error: "Post ID and title are required." }, { status: 400 });
  await connectToDatabase();
  const slug = String(body.slug || body.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const post = await ContentModel.findOneAndUpdate(
    { _id: body.id, type: "post" },
    { ...body, slug, type: "post", publishedAt: body.status === "published" ? new Date() : undefined },
    { new: true, runValidators: true },
  );
  return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Post not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManagePosts(String(session.role))) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
  await connectToDatabase();
  const post = await ContentModel.findOneAndDelete({ _id: id, type: "post" });
  return post ? NextResponse.json({ message: "Post deleted." }) : NextResponse.json({ error: "Post not found." }, { status: 404 });
}
