import { connection, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ShopCategoryModel, ShopProductModel } from "@/lib/models";

export async function GET() {
  await connection();
  await connectToDatabase();
  const categories = await ShopCategoryModel.find({ active: true }).sort({ name: 1 }).lean();
  const products = categories.length
    ? await ShopProductModel.find({ status: "published", categorySlug: { $in: categories.map((category) => category.slug) } }).sort({ createdAt: -1 }).lean()
    : [];
  return NextResponse.json({
    categories: categories.map((category) => ({
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
    })),
    products: products.map((product) => ({
      _id: String(product._id),
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      categorySlug: product.categorySlug,
    })),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
