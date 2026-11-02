import { connection, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    const mongoose = await connectToDatabase();
    return NextResponse.json({
      configured: true,
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.name ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: Boolean(process.env.MONGODB_URI),
        connected: false,
        message: error instanceof Error ? error.message : "MongoDB connection failed.",
      },
      { status: 503 },
    );
  }
}
