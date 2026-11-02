import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ShopCategoryModel, ShopOrderModel, ShopProductModel } from "@/lib/models";
import { isMpesaConfigured, normalizeMpesaPhone, requestMpesaStkPush } from "@/lib/mpesa";

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  deliveryMethod: z.enum(["delivery", "pickup"]),
  deliveryAddress: z.string().trim().max(1000).default(""),
  paymentMethod: z.literal("mpesa"),
  items: z.array(z.object({
    productId: z.string().refine(mongoose.isValidObjectId),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Enter valid order details." }, { status: 400 });
  if (parsed.data.deliveryMethod === "delivery" && parsed.data.deliveryAddress.length < 5) {
    return NextResponse.json({ error: "Enter a delivery address, or choose pickup." }, { status: 400 });
  }
  const mpesaPhone = normalizeMpesaPhone(parsed.data.phone);
  if (!mpesaPhone) return NextResponse.json({ error: "Enter a valid Kenyan M-Pesa phone number, such as 0712345678." }, { status: 400 });
  if (!isMpesaConfigured()) {
    return NextResponse.json({ error: "M-Pesa checkout is not set up yet. The shop administrator must configure Safaricom Daraja in Vercel." }, { status: 503 });
  }
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
  if (items.some((item) => !Number.isInteger(item.price))) {
    return NextResponse.json({ error: "This order contains a price with cents. Please contact the shop to correct the product price." }, { status: 409 });
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (total < 1) return NextResponse.json({ error: "The order total must be at least KSh 1 to pay with M-Pesa." }, { status: 400 });
  const order = await ShopOrderModel.create({
    orderNumber: `MW-${randomBytes(8).toString("hex").toUpperCase()}`,
    customerName: parsed.data.customerName,
    email: parsed.data.email.toLowerCase(),
    phone: mpesaPhone,
    deliveryMethod: parsed.data.deliveryMethod,
    deliveryAddress: parsed.data.deliveryMethod === "delivery" ? parsed.data.deliveryAddress : "",
    items,
    total,
    paymentMethod: parsed.data.paymentMethod,
    paymentStatus: "initiating",
    status: "pending",
  });
  try {
    const payment = await requestMpesaStkPush(total, mpesaPhone, order.orderNumber);
    order.paymentStatus = "pending";
    order.mpesaCheckoutRequestId = payment.checkoutRequestId;
    order.mpesaMerchantRequestId = payment.merchantRequestId;
    await order.save();
    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentStatus: order.paymentStatus,
      message: payment.customerMessage,
    }, { status: 201 });
  } catch (error) {
    order.paymentStatus = "failed";
    order.paymentResult = error instanceof Error ? error.message.slice(0, 500) : "M-Pesa payment could not be started.";
    await order.save();
    return NextResponse.json({
      error: order.paymentResult,
      orderNumber: order.orderNumber,
    }, { status: 502 });
  }
}
