import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFreshStaffSession } from "@/lib/staff-auth";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";
import { canManageStaffSection } from "@/lib/staff-roles";

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().max(180).optional(),
  excerpt: z.string().trim().max(320).optional(),
  body: z.string().max(100_000).optional(),
  seoTitle: z.string().trim().max(180).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  contentBlocks: z.array(z.object({
    kind: z.enum(["heading", "paragraph"]),
    level: z.number().int().min(1).max(6),
    text: z.string().max(10_000),
  })).max(100).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

function articleFields(body: z.infer<typeof postSchema>) {
  const tags = [...new Map((body.tags || [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => [tag.toLocaleLowerCase(), tag])).values()];
  const contentBlocks = (body.contentBlocks || []).filter((block) => block.text.trim());
  const slug = String(body.slug || body.title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    slug,
    title: body.title,
    excerpt: body.excerpt || "",
    body: body.body || contentBlocks.map((block) => block.text.trim()).join("\n\n"),
    status: body.status,
    metadata: {
      seoTitle: body.seoTitle || body.title,
      metaDescription: body.metaDescription || body.excerpt || "",
      tags,
      contentBlocks,
    },
  };
}

export async function GET() {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "posts")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectToDatabase();
  const posts = await ContentModel.find({ type: "post" }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "posts")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid title, status, and article content." }, { status: 400 });
  await connectToDatabase();
  const fields = articleFields(parsed.data);
  const existing = await ContentModel.findOne({ slug: fields.slug, type: "post" });
  const publishedAt = fields.status === "published" ? existing?.publishedAt || new Date() : undefined;
  const post = existing
    ? await ContentModel.findByIdAndUpdate(existing._id, { ...fields, ...(publishedAt ? { publishedAt } : {}) }, { new: true, runValidators: true })
    : await ContentModel.create({ ...fields, type: "post", ...(publishedAt ? { publishedAt } : {}) });
  return NextResponse.json({ post }, { status: fields.status === "published" ? 200 : 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "posts")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "Post ID, title, status, and article content are required." }, { status: 400 });
  await connectToDatabase();
  const existing = await ContentModel.findOne({ _id: parsed.data.id, type: "post" });
  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const fields = articleFields(parsed.data);
  const publishedAt = fields.status === "published" ? existing.publishedAt || new Date() : undefined;
  const post = await ContentModel.findByIdAndUpdate(
    existing._id,
    { ...fields, ...(publishedAt ? { publishedAt } : {}) },
    { new: true, runValidators: true },
  );
  return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Post not found." }, { status: 404 });
}

export async function DELETE(request: NextRequest) {
  const session = await getFreshStaffSession();
  if (!session || !canManageStaffSection(session.role, session.department, "posts")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
  await connectToDatabase();
  const post = await ContentModel.findOneAndDelete({ _id: id, type: "post" });
  return post ? NextResponse.json({ message: "Post deleted." }) : NextResponse.json({ error: "Post not found." }, { status: 404 });
}
