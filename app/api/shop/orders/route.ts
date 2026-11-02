import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ShopCategoryModel, ShopOrderModel, ShopProductModel } from "@/lib/models";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  deliveryAddress: z.string().trim().max(1000).default(""),
  items: z.array(z.object({
    productId: z.string().refine(mongoose.isValidObjectId),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Enter valid order details." }, { status: 400 });
  await connectToDatabase();
  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  const products = await ShopProductModel.find({
    _id: { $in: [...quantities.keys()] },
    status: "published",
  }).lean();
  if (products.length !== quantities.size) return NextResponse.json({ error: "One or more selected products are no longer available." }, { status: 409 });
  const activeCategorySlugs = new Set((await ShopCategoryModel.find({
    active: true,
    slug: { $in: products.map((product) => product.categorySlug) },
  }).select("slug").lean()).map((category) => category.slug));
  const unavailableCategory = products.some((product) => !activeCategorySlugs.has(product.categorySlug));
  if (unavailableCategory) return NextResponse.json({ error: "One or more selected product categories are unavailable." }, { status: 409 });
  const items = products.map((product) => ({
    productId: product._id,
    name: product.name,
    price: product.price,
    quantity: quantities.get(String(product._id)) || 1,
  }));
  const total = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const order = await ShopOrderModel.create({
    orderNumber: `MW-${randomBytes(4).toString("hex").toUpperCase()}`,
    customerName: parsed.data.customerName,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone,
    deliveryAddress: parsed.data.deliveryAddress,
    items,
    total,
    status: "pending",
  });
  return NextResponse.json({
    success: true,
    orderNumber: order.orderNumber,
    total: order.total,
    message: "Order request received. The shop team will contact you to confirm payment and delivery.",
  }, { status: 201 });
}
