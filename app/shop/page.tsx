"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = { _id: string; name: string; slug: string; description: string };
type Product = { _id: string; name: string; slug: string; description: string; imageUrl: string; price: number; categorySlug: string };

const merchandiseShowcase = [
  ["Mbuzi Xperience collection", "/media/mw-shop/mbuzi-xperience-collection.jpg"],
  ["MzimaWells merchandise", "/media/mw-shop/mw-merchandise-collection.jpg"],
  ["Branded shirts and polos", "/media/mw-shop/mbuzi-branded-shirts.jpg"],
] as const;

export default function ShopPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Shop is unavailable right now.");
        setCategories(data.categories || []);
        setProducts(data.products || []);
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Could not load the shop."))
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = useMemo(() => products.filter((product) =>
    selectedCategory === "all" || product.categorySlug === selectedCategory,
  ), [products, selectedCategory]);
  const cartItems = products.filter((product) => (cart[product._id] || 0) > 0);
  const total = cartItems.reduce((sum, product) => sum + product.price * cart[product._id], 0);

  function updateQuantity(productId: string, delta: number) {
    setCart((current) => {
      const quantity = Math.max(0, Math.min(50, (current[productId] || 0) + delta));
      const next = { ...current };
      if (quantity === 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...fields,
        items: cartItems.map((product) => ({ productId: product._id, quantity: cart[product._id] })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok
      ? `${data.message} Order reference: ${data.orderNumber}. Total: KSh ${Number(data.total).toLocaleString()}.`
      : data.error || "Could not submit your order.");
    if (response.ok) {
      setCart({});
      setCheckoutOpen(false);
      form.reset();
    }
  }

  return (
    <main className="inner-page shop-page">
      <header className="inner-page-header">
        <Link href="/" className="inner-brand"><span>MzimaWells</span> Studios</Link>
        <Link href="/">← Back to home</Link>
      </header>
      <section className="inner-hero section-hero shop-hero">
        <span>MW SHOP</span>
        <h1>Wear the story.<br />Support the creators.</h1>
        <p>Official MzimaWells merchandise and creator essentials.</p>
      </section>
      <section className="route-content">
        <div className="shop-heading">
          <div><span>THE COLLECTION</span><h2>Shop MzimaWells</h2></div>
          <button type="button" disabled={!cartItems.length} onClick={() => setCheckoutOpen(true)}>
            Your order · {cartItems.reduce((count, item) => count + cart[item._id], 0)} · KSh {total.toLocaleString()}
          </button>
        </div>
        <section className="shop-lookbook" aria-label="MW Shop merchandise gallery">
          <div className="shop-lookbook-heading"><span>MW SHOP LOOKBOOK</span><h3>Our merchandise and product collections</h3></div>
          <div className="shop-lookbook-grid">{merchandiseShowcase.map(([title, image]) => <figure key={image}><Image src={image} alt={title} width={768} height={960} /><figcaption>{title}</figcaption></figure>)}</div>
        </section>
        {categories.length > 0 && <div className="shop-category-list" aria-label="Shop categories">
          <button className={selectedCategory === "all" ? "active" : ""} onClick={() => setSelectedCategory("all")}>All products</button>
          {categories.map((category) => <button key={category._id} className={selectedCategory === category.slug ? "active" : ""} onClick={() => setSelectedCategory(category.slug)}>{category.name}</button>)}
        </div>}
        {notice && <p className="shop-notice" role="status">{notice}</p>}
        {loading ? <p className="shop-empty">Loading the MW Shop…</p> : visibleProducts.length ? (
          <div className="shop-product-grid">
            {visibleProducts.map((product) => (
              <article className="shop-product-card" key={product._id}>
                <div className="shop-product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>MW</span>}</div>
                <div className="shop-product-copy">
                  <span>{categories.find((category) => category.slug === product.categorySlug)?.name || "MzimaWells"}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="shop-product-buy"><strong>KSh {product.price.toLocaleString()}</strong>
                    <div className="shop-quantity">
                      <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => updateQuantity(product._id, -1)} disabled={!cart[product._id]}>−</button>
                      <span>{cart[product._id] || 0}</span>
                      <button type="button" aria-label={`Add one ${product.name}`} onClick={() => updateQuantity(product._id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="shop-empty"><b>{categories.length ? "No products in this collection yet." : "The shop is getting ready."}</b><p>New merchandise will appear here as soon as it is available.</p></div>}
      </section>
      {checkoutOpen && <div className="challenge-modal" role="dialog" aria-modal="true" aria-label="Submit your shop order">
        <div className="challenge-modal-card shop-checkout-card">
          <button className="challenge-modal-close" type="button" aria-label="Close order form" onClick={() => setCheckoutOpen(false)}>×</button>
          <span>MW SHOP ORDER</span><h2>Where should we reach you?</h2>
          <p>Submit your order request; the shop team will contact you to confirm payment and delivery.</p>
          <ul>{cartItems.map((item) => <li key={item._id}>{item.name} × {cart[item._id]} — KSh {(item.price * cart[item._id]).toLocaleString()}</li>)}</ul>
          <strong>Order total: KSh {total.toLocaleString()}</strong>
          <form className="challenge-registration-form" onSubmit={submitOrder}>
            <label>Full name<input name="customerName" required minLength={2} maxLength={120} /></label>
            <label>Email<input name="email" type="email" required maxLength={254} /></label>
            <label>Phone<input name="phone" type="tel" required minLength={7} maxLength={32} /></label>
            <label>Delivery address<textarea name="deliveryAddress" rows={3} maxLength={1000} /></label>
            <button className="submit-registration" type="submit">Request this order</button>
          </form>
        </div>
      </div>}
    </main>
  );
}
