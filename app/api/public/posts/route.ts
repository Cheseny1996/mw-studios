import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ContentModel } from "@/lib/models";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const slug = request.nextUrl.searchParams.get("slug");
  if (slug) {
    const post = await ContentModel.findOne({ type: "post", slug, status: "published" }).lean();
    return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Story not found." }, { status: 404 });
  }
  const posts = await ContentModel.find({ type: "post", status: "published" }).sort({ publishedAt: -1 }).lean();
  return NextResponse.json({ posts });
}
