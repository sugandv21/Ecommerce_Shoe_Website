// src/components/ProductCard.jsx
import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import cartService from "../api/cartService";

function Star({ filled }) {
  return (
    <svg
      className={`w-4 h-4 inline-block ${filled ? "text-yellow-400" : "text-gray-300"}`}
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M10 1.5l2.6 5.27 5.8.84-4.2 4.09 0.99 5.77L10 14.77 4.81 17.47l0.99-5.77L1.6 7.61l5.8-.84L10 1.5z"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/**
 * ProductCard
 * Props:
 *  - product: product object (expected shape from ProductSerializer)
 *  - onAddToCart: optional async function({ productId, qty = 1, size = "" }) => Promise
 */
export default function ProductCard({ product = {}, onAddToCart }) {
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");

  // defensive product shape handling
  const images = Array.isArray(product.images) ? product.images : [];
  const firstImg = images[0] || null;
  const imgUrl = firstImg ? (typeof firstImg === "string" ? firstImg : firstImg.url || firstImg.image || "") : "";
  const placeholder = "/placeholder.png";

  const colorList = (product.colors || [])
    .map((c, i) => {
      if (!c) return null;
      if (typeof c === "string") return { id: `c-${i}`, name: "", value: c };
      return {
        id: c.id ?? `c-${i}`,
        name: c.name ?? c.label ?? "",
        value: c.hex ?? c.value ?? "",
      };
    })
    .filter(Boolean);

  const rating = Number(product.rating) || 0;
  const filledCount = Math.round(rating);

  const stop = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
  };

  const fallbackAppendToCart = useCallback(async (productId, quantity = 1, sizeStr = "") => {
    const cart = await cartService.getCart();
    const cartId = cart?.id;
    const existing = Array.isArray(cart.items) ? cart.items.slice() : [];

    const normalized = [];
    let merged = false;

    for (const ci of existing) {
      const pid = ci.product?.id ?? ci.product_id ?? null;
      const s = (ci.size || "") + "";
      if (pid == null) continue;

      if (pid === productId && s === (sizeStr || "")) {
        const newQty = Number(ci.quantity || 0) + Number(quantity || 0);
        normalized.push({ product_id: pid, quantity: newQty, size: s });
        merged = true;
      } else {
        normalized.push({ product_id: pid, quantity: Number(ci.quantity || 0), size: s });
      }
    }

    if (!merged) {
      normalized.push({ product_id: productId, quantity: Number(quantity || 0), size: sizeStr || "" });
    }

    const payload = { items: normalized, replace: true };
    const updated = await cartService.updateCart(cartId, payload);
    return updated;
  }, []);

  async function handleAdd(e) {
    stop(e);
    if (adding) return;
    setAdding(true);

    try {
      if (!product?.id) throw new Error("Product ID missing");

      const payload = { productId: product.id, qty: Number(qty || 1), size: size || "" };

      if (typeof onAddToCart === "function") {
        await onAddToCart(payload);
      } else {
        try {
          await cartService.addItem(product.id, payload.qty, payload.size);
        } catch (err) {
          console.warn("cartService.addItem failed — falling back to merging via updateCart:", err);
          await fallbackAppendToCart(product.id, payload.qty, payload.size);
        }
      }

      // success feedback (use toast in real app)
      // eslint-disable-next-line no-console
      console.debug("Product added to cart:", product.id, payload.qty, payload.size);
      try { window.dispatchEvent(new CustomEvent("cartUpdated")); } catch (e) {}
    } catch (err) {
      console.error("Add to cart failed:", err?.server ?? err?.response?.data ?? err?.message ?? err);
      if (err?.server) {
        alert("Add to cart failed: " + (typeof err.server === "string" ? err.server : JSON.stringify(err.server)));
      } else {
        alert("Add to cart failed. Check console for details.");
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="bg-white shadow-md rounded-md overflow-hidden" role="group" aria-label={product.title || "product"}>
      <div className="h-56 md:h-64">
  {imgUrl ? (
    <Link
      to={`/product/${product.id}`}
      state={{ size, qty }}
      onClick={stop}
      className="block h-full w-full"
      aria-label={`Open ${product.title} details`}
    >
      <img
        src={imgUrl}
        alt={product.title || "Product image"}
        className="object-cover h-full w-full"
        onError={(e) => {
          e.currentTarget.src = placeholder;
        }}
      />
    </Link>
  ) : (
    <div className="flex items-center justify-center h-full w-full text-gray-400 bg-gray-50">
      No image
    </div>
  )}
</div>


      <div className="p-4">
        <h4 className="font-bold text-lg">
          <Link
            to={`/product/${product.id}`}
            state={{ size, qty }}
            onClick={stop}
            className="hover:underline"
          >
            {product.title}
          </Link>
        </h4>

        {product.subtitle && <p className="text-sm text-gray-600">{product.subtitle}</p>}

        <div className="mt-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="mr-1">
                  <Star filled={i < filledCount} />
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-700 mt-2">MRP ₹{product.price}</div>
        </div>

        {colorList.length > 0 && (
          <div className="mt-3 flex items-center gap-3" onClick={stop}>
            <span className="text-sm font-medium">Color</span>
            <div className="flex items-center gap-2">
              {colorList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.name || `color ${c.value}`}
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: c.value || "transparent" }}
                  title={c.name || c.value}
                  onClick={stop}
                />
              ))}
            </div>
          </div>
        )}

        {/* Optional quick size + qty controls */}
        <div className="mt-3 flex items-center gap-2">
          {product.sizes && product.sizes.length > 0 && (
            <select
              className="border px-2 py-1 text-sm"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              aria-label="Select size"
              onClick={stop}
            >
              <option value="">Size</option>
              {product.sizes.map((s) => (
                <option key={s.id ?? s.label} value={s.label ?? s.id}>
                  {s.label ?? s.id}
                </option>
              ))}
            </select>
          )}

          <select
            className="border px-2 py-1 text-sm"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            aria-label="Quantity"
            onClick={stop}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <Link
            to={`/product/${product.id}`}
            state={{ size, qty }}
            onClick={stop}
            className="px-6 py-2 text-center border rounded-xl bg-white shadow-sm hover:bg-gray-50"
          >
            Buy
          </Link>

          <button
            onClick={handleAdd}
            disabled={adding}
            className={`px-4 py-2 text-center rounded-xl text-white shadow-sm ${
              adding ? "bg-gray-400 cursor-not-allowed" : "bg-[#2f4f4f] hover:bg-[#3b5f5f]"
            }`}
            aria-disabled={adding}
            aria-busy={adding}
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
