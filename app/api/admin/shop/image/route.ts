import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getFreshStaffSession } from "@/lib/staff-auth";

const imageTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
};

export async function POST(request: NextRequest) {
  const session = await getFreshStaffSession();
  const allowed = session && (
    ["super_admin", "admin", "shop_manager"].includes(session.role)
    || (session.role === "department_admin" && session.department === "shop")
  );
  if (!allowed) return NextResponse.json({ error: "You do not have permission to upload shop images." }, { status: 403 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Image uploads are not configured. Connect a Vercel Blob store to this project." }, { status: 503 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size < 1 || file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Product images must be no larger than 4 MB." }, { status: 400 });
  }
  const imageType = imageTypes[file.type as keyof typeof imageTypes];
  if (!imageType) return NextResponse.json({ error: "Use a JPEG, PNG or WebP product image." }, { status: 415 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageType.signature(bytes)) return NextResponse.json({ error: "The selected file is not a valid image of the stated type." }, { status: 415 });
  const blob = await put(`shop-products/${randomUUID()}.${imageType.extension}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return NextResponse.json({ url: blob.url }, { status: 201 });
}
