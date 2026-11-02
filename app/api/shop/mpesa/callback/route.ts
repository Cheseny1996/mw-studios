import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ShopOrderModel } from "@/lib/models";

type CallbackItem = { Name?: unknown; Value?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  const body = isRecord(payload) ? payload.Body : null;
  const callback = isRecord(body) ? body.stkCallback : null;
  if (!isRecord(callback)) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback payload." }, { status: 400 });
  }
  if (typeof callback.CheckoutRequestID !== "string" || typeof callback.MerchantRequestID !== "string"
    || typeof callback.ResultCode !== "number") {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payment callback." }, { status: 400 });
  }
  await connectToDatabase();
  const order = await ShopOrderModel.findOne({
    mpesaCheckoutRequestId: callback.CheckoutRequestID,
    mpesaMerchantRequestId: callback.MerchantRequestID,
    paymentStatus: "pending",
  });
  if (!order) return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback received." });

  if (callback.ResultCode !== 0) {
    order.paymentStatus = "failed";
    order.paymentResult = typeof callback.ResultDesc === "string" ? callback.ResultDesc.slice(0, 500) : "M-Pesa payment was not completed.";
    await order.save();
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback received." });
  }

  const callbackMetadata = isRecord(callback.CallbackMetadata) ? callback.CallbackMetadata : null;
  const callbackItems = callbackMetadata && Array.isArray(callbackMetadata.Item)
    ? callbackMetadata.Item as CallbackItem[]
    : [];
  const metadataValue = (name: string) => callbackItems.find((item) => item.Name === name)?.Value;
  const amount = metadataValue("Amount");
  const receipt = metadataValue("MpesaReceiptNumber");
  const phone = metadataValue("PhoneNumber");
  if (typeof amount !== "number" || amount !== order.total || typeof receipt !== "string" || !receipt
    || typeof phone !== "number" || String(phone) !== order.phone) {
    order.paymentStatus = "failed";
    order.paymentResult = "The M-Pesa callback did not match the order amount or receipt.";
    await order.save();
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback received." });
  }
  order.paymentStatus = "paid";
  order.mpesaReceiptNumber = receipt;
  order.paymentResult = "Payment confirmed by M-Pesa.";
  await order.save();
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback received." });
}
