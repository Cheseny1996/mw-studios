import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { StudioEventModel, EventRegistrationModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.sub) return NextResponse.json({ error: "Sign in to register for this event." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.eventId) return NextResponse.json({ error: "Event is required." }, { status: 400 });
  await connectToDatabase();
  const event = await StudioEventModel.findOne({ _id: body.eventId, status: "published" });
  if (!event) return NextResponse.json({ error: "This event is unavailable." }, { status: 404 });
  if (event.capacity > 0 && event.registrationCount >= event.capacity) return NextResponse.json({ error: "This event is at capacity." }, { status: 409 });
  try {
    await EventRegistrationModel.create({ eventId: event._id, userId: session.sub, status: "registered" });
    await StudioEventModel.updateOne({ _id: event._id }, { $inc: { registrationCount: 1 } });
    return NextResponse.json({ message: "Your event registration is confirmed." });
  } catch {
    return NextResponse.json({ error: "You are already registered for this event." }, { status: 409 });
  }
}
