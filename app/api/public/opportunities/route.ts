import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { OpportunityModel } from "@/lib/models";

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const slug = request.nextUrl.searchParams.get("slug");
  if (slug) {
    const opportunity = await OpportunityModel.findOne({ slug, status: "published" }).lean();
    return opportunity ? NextResponse.json({ opportunity }) : NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }
  const opportunities = await OpportunityModel.find({ status: "published" }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ opportunities });
}
