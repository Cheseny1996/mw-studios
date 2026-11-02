import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ShopOrderModel } from "@/lib/models";

const orderNumberSchema = z.string().regex(/^MW-[A-F0-9]{16}$/);

export async function GET(request: NextRequest) {
  const parsed = orderNumberSchema.safeParse(request.nextUrl.searchParams.get("order"));
  if (!parsed.success) return NextResponse.json({ error: "A valid order reference is required." }, { status: 400 });
  await connectToDatabase();
  const order = await ShopOrderModel.findOne({ orderNumber: parsed.data })
    .select("orderNumber paymentStatus paymentResult mpesaReceiptNumber")
    .lean();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    paymentResult: order.paymentResult,
    receiptNumber: order.mpesaReceiptNumber,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
