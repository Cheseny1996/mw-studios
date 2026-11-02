import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ShopCategoryModel, ShopOrderModel, ShopProductModel } from "@/lib/models";
import { getFreshStaffSession } from "@/lib/staff-auth";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().min(2).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).default(""),
  active: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().min(2).max(180).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(2000).default(""),
  imageUrl: z.string().trim().max(2048).url().or(z.literal("")).default(""),
  price: z.coerce.number().min(0).max(100_000_000),
  categorySlug: z.string().trim().toLowerCase().min(2).max(120),
  status: z.enum(["draft", "published"]).default("draft"),
});

async function authorize() {
  const session = await getFreshStaffSession();
  if (!session) return null;
  const allowed = ["super_admin", "admin", "shop_manager"].includes(session.role)
    || (session.role === "department_admin" && session.department === "shop");
  return allowed ? session : null;
}

function isDuplicate(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export async function GET() {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage the shop." }, { status: 403 });
  await connectToDatabase();
  const [categories, products, orders] = await Promise.all([
    ShopCategoryModel.find().sort({ name: 1 }).lean(),
    ShopProductModel.find().sort({ updatedAt: -1 }).lean(),
    ShopOrderModel.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  return NextResponse.json({ categories, products, orders });
}

export async function POST(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage the shop." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.kind === "category") {
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid category." }, { status: 400 });
    await connectToDatabase();
    try {
      const category = await ShopCategoryModel.create(parsed.data);
      return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
      if (isDuplicate(error)) return NextResponse.json({ error: "That category URL already exists." }, { status: 409 });
      throw error;
    }
  }
  if (body?.kind === "product") {
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid product." }, { status: 400 });
    await connectToDatabase();
    const category = await ShopCategoryModel.findOne({ slug: parsed.data.categorySlug });
    if (!category) return NextResponse.json({ error: "Choose an existing shop category." }, { status: 400 });
    try {
      const product = await ShopProductModel.create(parsed.data);
      return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
      if (isDuplicate(error)) return NextResponse.json({ error: "That product URL already exists." }, { status: 409 });
      throw error;
    }
  }
  return NextResponse.json({ error: "Choose a category or product to create." }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage the shop." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !mongoose.isValidObjectId(body.id)) {
    return NextResponse.json({ error: "A valid record ID is required." }, { status: 400 });
  }
  await connectToDatabase();
  if (body.kind === "order") {
    const parsed = z.object({ status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
    const order = await ShopOrderModel.findByIdAndUpdate(body.id, { status: parsed.data.status }, { new: true });
    return order
      ? NextResponse.json({ order })
      : NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (body.kind === "category") {
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid category." }, { status: 400 });
    try {
      const previousCategory = await ShopCategoryModel.findById(body.id).select("slug").lean();
      const category = await ShopCategoryModel.findByIdAndUpdate(body.id, parsed.data, { new: true, runValidators: true });
      if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
      if (previousCategory && previousCategory.slug !== category.slug) {
        await ShopProductModel.updateMany({ categorySlug: previousCategory.slug }, { categorySlug: category.slug });
      }
      return NextResponse.json({ category });
    } catch (error) {
      if (isDuplicate(error)) return NextResponse.json({ error: "That category URL already exists." }, { status: 409 });
      throw error;
    }
  }
  if (body.kind === "product") {
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid product." }, { status: 400 });
    if (!await ShopCategoryModel.exists({ slug: parsed.data.categorySlug })) {
      return NextResponse.json({ error: "Choose an existing shop category." }, { status: 400 });
    }
    try {
      const product = await ShopProductModel.findByIdAndUpdate(body.id, parsed.data, { new: true, runValidators: true });
      return product
        ? NextResponse.json({ product })
        : NextResponse.json({ error: "Product not found." }, { status: 404 });
    } catch (error) {
      if (isDuplicate(error)) return NextResponse.json({ error: "That product URL already exists." }, { status: 409 });
      throw error;
    }
  }
  return NextResponse.json({ error: "Choose a category, product, or order to update." }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "You do not have permission to manage the shop." }, { status: 403 });
  const kind = request.nextUrl.searchParams.get("kind");
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id) || !["category", "product"].includes(kind || "")) {
    return NextResponse.json({ error: "Choose a valid category or product to delete." }, { status: 400 });
  }
  await connectToDatabase();
  if (kind === "category") {
    const category = await ShopCategoryModel.findById(id);
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (await ShopProductModel.exists({ categorySlug: category.slug })) {
      return NextResponse.json({ error: "Move or delete its products before deleting this category." }, { status: 409 });
    }
    await category.deleteOne();
  } else {
    const product = await ShopProductModel.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
