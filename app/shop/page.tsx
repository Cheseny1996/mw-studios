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
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
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
    setOrderSubmitting(true);
    try {
      const response = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          deliveryMethod,
          paymentMethod: "mpesa",
          items: cartItems.map((product) => ({ productId: product._id, quantity: cart[product._id] })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      setNotice(response.ok
        ? `Order ${data.orderNumber} · KSh ${Number(data.total).toLocaleString()}. ${data.message} Payment status: awaiting M-Pesa confirmation.`
        : `${data.error || "Could not submit your order."}${data.orderNumber ? ` Order reference: ${data.orderNumber}.` : ""}`);
      if (response.ok) {
        setCart({});
        setCheckoutOpen(false);
        setDeliveryMethod("delivery");
        form.reset();
        void monitorPayment(data.orderNumber);
      }
    } catch {
      setNotice("Could not reach checkout. Your basket is still saved on this page; please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function monitorPayment(orderNumber: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      try {
        const response = await fetch(`/api/shop/order-status?order=${encodeURIComponent(orderNumber)}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setNotice(`Order ${orderNumber} was submitted, but we could not refresh its payment status. Please keep the order reference.`);
          return;
        }
        if (data.paymentStatus === "paid") {
          setNotice(`Payment received for order ${orderNumber}. M-Pesa receipt: ${data.receiptNumber}.`);
          return;
        }
        if (data.paymentStatus === "failed") {
          setNotice(`M-Pesa payment for order ${orderNumber} was not completed. ${data.paymentResult || "You can place the order again to retry."}`);
          return;
        }
      } catch {
        setNotice(`Order ${orderNumber} is awaiting payment confirmation. Keep the order reference and check your M-Pesa messages.`);
        return;
      }
    }
    setNotice(`Order ${orderNumber} is still awaiting M-Pesa confirmation. Check your M-Pesa messages; keep this reference if you contact the shop.`);
  }

  const cartCount = cartItems.reduce((count, item) => count + cart[item._id], 0);

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
          <button type="button" disabled={!cartItems.length} onClick={() => setCartOpen(true)} aria-label={`Open basket with ${cartCount} items`}>
            Basket · {cartCount} · KSh {total.toLocaleString()}
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
                <button className="shop-product-image shop-product-image-button" type="button" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.name} details`}>
                  {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>MW</span>}
                </button>
                <div className="shop-product-copy">
                  <span>{categories.find((category) => category.slug === product.categorySlug)?.name || "MzimaWells"}</span>
                  <button className="shop-product-title" type="button" onClick={() => setSelectedProduct(product)}>{product.name}</button>
                  <p>{product.description}</p>
                  <button className="shop-product-details-button" type="button" onClick={() => setSelectedProduct(product)}>View product details</button>
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
        ) : <div className="shop-empty"><b>{categories.length ? "No products in this collection yet." : "The shop is getting ready."}</b><p>Products appear here after a shop administrator adds a price, description, image and publishes them.</p></div>}
      </section>
      {selectedProduct && <div className="challenge-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}>
        <div className="challenge-modal shop-checkout-card shop-product-detail" role="dialog" aria-modal="true" aria-label={`${selectedProduct.name} details`}>
          <button className="challenge-modal-close" type="button" aria-label="Close product details" onClick={() => setSelectedProduct(null)}>×</button>
          <div className="shop-product-detail-image">{selectedProduct.imageUrl ? <img src={selectedProduct.imageUrl} alt={selectedProduct.name} /> : <span>MW</span>}</div>
          <span>{categories.find((category) => category.slug === selectedProduct.categorySlug)?.name || "MZIMAWELLS SHOP"}</span>
          <h2>{selectedProduct.name}</h2>
          <p>{selectedProduct.description || "Official MzimaWells merchandise."}</p>
          <strong className="shop-product-detail-price">KSh {selectedProduct.price.toLocaleString()}</strong>
          <button className="submit-registration" type="button" onClick={() => { updateQuantity(selectedProduct._id, 1); setSelectedProduct(null); }}>
            Add to basket{cart[selectedProduct._id] ? ` · ${cart[selectedProduct._id]} in basket` : ""}
          </button>
        </div>
      </div>}
      {cartOpen && <div className="challenge-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
        <div className="challenge-modal shop-checkout-card shop-cart-card" role="dialog" aria-modal="true" aria-label="Shopping basket">
          <button className="challenge-modal-close" type="button" aria-label="Close basket" onClick={() => setCartOpen(false)}>×</button>
          <span>YOUR BASKET</span><h2>Review your order</h2>
          <ul className="shop-cart-list">{cartItems.map((item) => <li key={item._id}>
            <div><b>{item.name}</b><span>KSh {item.price.toLocaleString()} each</span></div>
            <div className="shop-cart-item-actions">
              <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item._id, -1)}>−</button>
              <span>{cart[item._id]}</span>
              <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item._id, 1)}>+</button>
            </div>
            <strong>KSh {(item.price * cart[item._id]).toLocaleString()}</strong>
          </li>)}</ul>
          <div className="shop-cart-total"><b>Order total</b><strong>KSh {total.toLocaleString()}</strong></div>
          <button className="submit-registration" type="button" disabled={!cartItems.length} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to checkout</button>
        </div>
      </div>}
      {checkoutOpen && <div className="challenge-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !orderSubmitting) setCheckoutOpen(false); }}>
        <div className="challenge-modal-card shop-checkout-card">
          <button className="challenge-modal-close" type="button" aria-label="Close order form" disabled={orderSubmitting} onClick={() => setCheckoutOpen(false)}>×</button>
          <span>MW SHOP CHECKOUT</span><h2>Delivery and payment</h2>
          <p>Pay securely with an M-Pesa prompt on your phone. We’ll confirm your order after Safaricom verifies payment.</p>
          <ul>{cartItems.map((item) => <li key={item._id}>{item.name} × {cart[item._id]} — KSh {(item.price * cart[item._id]).toLocaleString()}</li>)}</ul>
          <strong>Order total: KSh {total.toLocaleString()}</strong>
          <form className="challenge-registration-form" onSubmit={submitOrder}>
            <label>Full name<input name="customerName" required minLength={2} maxLength={120} /></label>
            <label>Email<input name="email" type="email" required maxLength={254} /></label>
            <label>M-Pesa phone<input name="phone" type="tel" required minLength={9} maxLength={16} placeholder="0712 345 678" pattern="[\d+()\s-]{9,16}" /></label>
            <fieldset className="shop-delivery-options"><legend>Fulfilment option</legend>
              <label><input type="radio" name="fulfilment-choice" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} /> Delivery</label>
              <label><input type="radio" name="fulfilment-choice" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} /> Pick up</label>
            </fieldset>
            {deliveryMethod === "delivery" && <label>Delivery address<textarea name="deliveryAddress" required minLength={5} rows={3} maxLength={1000} /></label>}
            <div className="shop-payment-choice"><b>Payment method</b><span><strong>M-Pesa STK Push</strong> · Main payment option</span><small>A secure payment prompt will be sent to the phone number above.</small></div>
            <button className="submit-registration" type="submit" disabled={orderSubmitting}>{orderSubmitting ? "Sending M-Pesa prompt…" : `Pay KSh ${total.toLocaleString()} with M-Pesa`}</button>
          </form>
        </div>
      </div>}
    </main>
  );
}
