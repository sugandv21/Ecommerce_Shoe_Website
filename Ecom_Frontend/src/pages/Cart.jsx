// src/pages/Cart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import PaymentOptions from "../components/PaymentOptions";
import CartItem from "../components/CartItem";
import cartService from "../api/cartService";
import lock from "../assets/images/lock.png";
import CartHeader from "../components/CartHeader";

const API_ROOT = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

export default function Cart() {
  const navigate = useNavigate();

  const [cartData, setCartData] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load cart and normalize items
  const fetchCart = async () => {
    setMessage("");
    setLoading(true);
    try {
      const data = await cartService.getCart();
      const cart = data || { items: [] };

      const normalizedItems = (cart.items || []).map((it) => {
        const product = it.product || it.product_data || (it.product_id ? { id: it.product_id, price: it.price } : null);
        return {
          id: it.id,
          product,
          quantity: Number(it.quantity ?? it.qty ?? 1),
          size: it.size ?? "",
          line_total: it.line_total ?? (product ? (product.price || 0) * (it.quantity || 1) : 0),
        };
      });

      setCartData({ ...cart, items: normalizedItems });
    } catch (err) {
      console.error("fetchCart failed", err);
      const status = err?.response?.status;
      if (status === 404) setMessage("Cart endpoint not found (404). Check backend URLs.");
      else if (status === 403) setMessage("Authentication required to fetch cart. Please log in.");
      else setMessage("Failed to load cart.");
      setCartData({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const onCartUpdated = () => fetchCart();
    window.addEventListener("cartUpdated", onCartUpdated);
    return () => window.removeEventListener("cartUpdated", onCartUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = (cartData.items || []).reduce(
    (s, it) => s + (it.product?.price || 0) * (it.quantity || 0),
    0
  );

  // utility to build payload expected by updateCart
  const buildPayloadItems = (items) =>
    (items || []).map((it) => ({
      product_id: it.product?.id ?? it.product_id ?? (it.product && it.product.id) ?? null,
      quantity: Number(it.quantity ?? 1),
      size: it.size ?? "",
    })).filter(i => i.product_id != null);

  // Update entire cart (replace)
  const updateCart = async (items, replace = true) => {
    setActionLoading(true);
    setMessage("");
    try {
      // ensure we have a cart id (getCart will create one if backend supports)
      let cartId = cartData?.id;
      if (!cartId) {
        const created = await cartService.getCart(); // will try GET then POST create
        cartId = created?.id;
      }
      if (!cartId) {
        setMessage("No cart available to update.");
        return null;
      }

      const payload = {
        items: buildPayloadItems(items),
        ...(replace ? { replace: true } : {}),
      };

      await cartService.updateCart(cartId, payload);
      await fetchCart();
    } catch (err) {
      console.error("updateCart failed", err);
      setMessage("Could not update cart.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (cartItemId = null, productId = null, size = "") => {
    setMessage("");
    setActionLoading(true);

    // Optimistic UI update: remove the item locally immediately so user sees it gone
    const optimisticNext = (cartData.items || []).filter((it) => {
      if (cartItemId != null) return String(it.id) !== String(cartItemId);
      return !(it.product?.id === productId && (it.size || "") === (size || ""));
    });
    setCartData(prev => ({ ...prev, items: optimisticNext }));

    try {
      // Try server-side removal first (cartService has many fallbacks inside)
      await cartService.removeItem({
        cart: cartData,
        cartId: cartData?.id ?? null,
        cartItemId: cartItemId,
        productId: productId,
        size: size,
      });

      // success: refresh canonical state
      await fetchCart();
    } catch (err) {
      // Log full error for debugging
      console.error("removeItem server attempt failed, falling back to updateCart. error:", err);
      setMessage("Server remove failed — attempting client-side fallback.");

      try {
        // Build items payload excluding the removed rows (same logic as cartService fallback)
        const itemsPayload = (cartData.items || []).filter(ci => {
          if (cartItemId != null) return String(ci.id) !== String(cartItemId);
          const ciPid = ci.product?.id ?? ci.product_id ?? null;
          if (ciPid == null) return true;
          const ciPidStr = String(ciPid);
          const ciSize = (ci.size || "").toString();
          return !(ciPidStr === String(productId) && ciSize === (size || "").toString());
        }).map(ci => ({
          product_id: ci.product?.id ?? ci.product_id,
          quantity: Number(ci.quantity ?? ci.qty ?? 1),
          size: ci.size || "",
        }));

        // If payload equals existing (nothing removed) warn and stop
        if ((cartData.items || []).length - itemsPayload.length === 0) {
          console.warn("[Cart.handleRemove] fallback did not find matching rows to remove", { cartItemId, productId, size });
          setMessage("Could not find matching item to remove.");
          // Refresh from server to keep canonical state
          await fetchCart();
          return;
        }

        // Ensure we have a cartId (getCart will create if needed)
        let cid = cartData?.id;
        if (!cid) {
          const created = await cartService.getCart();
          cid = created?.id;
        }
        if (!cid) {
          setMessage("No cart available to update.");
          return;
        }

        // Call updateCart directly to apply replacement on the backend
        await cartService.updateCart(cid, { items: itemsPayload, replace: true });

        // Refresh canonical cart
        await fetchCart();
        setMessage("Item removed (client-side fallback).");
      } catch (fallbackErr) {
        console.error("Client-side fallback updateCart failed:", fallbackErr);
        setMessage("Remove failed (server + client fallback). See console for details.");
        // restore original cart view from server to avoid wrong UI state
        try { await fetchCart(); } catch (e) { /* ignore */ }
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Change quantity for an item — target by cartItemId
  const handleQtyChange = async (cartItemId, qty, size = "") => {
    setMessage("");
    setActionLoading(true);
    try {
      // produce items list from local cartData, updating the row with matching id
      const items = (cartData.items || []).map((it) => {
        if (String(it.id) === String(cartItemId)) {
          // update this row
          return { product: { id: it.product?.id ?? it.product_id }, quantity: Number(qty || 1), size: it.size ?? "" };
        }
        // keep other rows
        return { product: { id: it.product?.id ?? it.product_id }, quantity: Number(it.quantity || 1), size: it.size ?? "" };
      });

      // if not found (edge case), append new
      const found = items.some(it => String(it.product?.id) === String((cartData.items || []).find(ci => String(ci.id) === String(cartItemId))?.product?.id) && (it.size || "") === (size || ""));
      if (!found) {
        // locate product id from local cart row fallback
        const source = (cartData.items || []).find(it => String(it.id) === String(cartItemId));
        const pid = source?.product?.id ?? source?.product_id;
        if (pid) items.push({ product: { id: pid }, quantity: Number(qty || 1), size: size || "" });
      }

      await updateCart(items, true);
    } catch (err) {
      console.error("Failed to change qty", err);
      setMessage("Could not update quantity.");
    } finally {
      setActionLoading(false);
    }
  };

  // Change size for item — target by cartItemId (merge quantities if needed)
  const handleSizeChange = async (cartItemId, productId, newSize, prevSize = "") => {
    setMessage("");
    setActionLoading(true);
    try {
      const items = (cartData.items || []).slice();

      // find the source by id (preferred)
      const srcIndex = items.findIndex(it => String(it.id) === String(cartItemId));
      if (srcIndex === -1) {
        // fallback: find by productId + prevSize
        const idx2 = items.findIndex(it => (it.product?.id === productId) && ((it.size || "") === (prevSize || "")));
        if (idx2 === -1) {
          await fetchCart();
          setActionLoading(false);
          return;
        }
        // use idx2 as source
        const src = items[idx2];
        items.splice(idx2, 1);
        const existingIndex = items.findIndex(it => (it.product?.id === productId) && ((it.size || "") === (newSize || "")));
        if (existingIndex !== -1) {
          items[existingIndex].quantity = Number(items[existingIndex].quantity || 0) + Number(src.quantity || 0);
        } else {
          items.push({ product: { id: productId }, quantity: Number(src.quantity || 1), size: newSize || "" });
        }
      } else {
        // source found by cartItemId
        const src = items[srcIndex];
        items.splice(srcIndex, 1);
        const existingIndex = items.findIndex(it => (it.product?.id === productId) && ((it.size || "") === (newSize || "")));
        if (existingIndex !== -1) {
          items[existingIndex].quantity = Number(items[existingIndex].quantity || 0) + Number(src.quantity || 0);
        } else {
          items.push({ product: { id: productId }, quantity: Number(src.quantity || 1), size: newSize || "" });
        }
      }

      // Build payload and update
      const payloadItems = items.map(it => ({
        product: { id: it.product?.id ?? it.product_id ?? (it.product && it.product.id) },
        quantity: Number(it.quantity || 1),
        size: it.size || "",
      }));
      await updateCart(payloadItems, true);
    } catch (err) {
      console.error("Failed to change size", err);
      setMessage("Could not update size.");
    } finally {
      setActionLoading(false);
    }
  };


const handleCheckout = () => {
  setMessage("");

  if (!selectedPayment) {
    setMessage("Please select a payment method before checkout.");
    return;
  }
  if (!cartData.items || cartData.items.length === 0) {
    setMessage("Cart is empty.");
    return;
  }

  // Build state object to send to checkout page
  const checkoutState = {
    cartId: cartData.id ?? null,
    items: cartData.id ? undefined : (cartData.items || []), // prefer cartId if available
    subtotal: (cartData.items || []).reduce(
      (s, it) => s + (it.product?.price || 0) * (it.quantity || 0),
      0
    ),
    selectedPayment, // pass chosen payment method
  };

  // navigate to checkout page
  navigate("/checkout", { state: checkoutState });
};


  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() + 23);
  cutoff.setMinutes(cutoff.getMinutes() + 53);
  cutoff.setSeconds(cutoff.getSeconds() + 50);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="mx-auto text-3xl md:text-4xl font-serif font-semibold text-center">
        Your Cart
      </h1>

      <CartHeader
        deliveryText="Free & Fast arriving by Monday"
        deadline={cutoff.toISOString()}
        continueHref="/shop"
      />

      <div className="bg-white rounded-md shadow p-4 my-6">
        {loading ? (
          <p>Loading cart...</p>
        ) : !cartData.items || cartData.items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="space-y-6">
            {cartData.items.map((it) => (
              <CartItem
                key={it.id || `${it.product?.id}-${it.size}`}
                product={it.product}
                quantity={it.quantity}
                size={it.size}
                onRemove={(productId, sizeArg) => handleRemove(it.id, productId, sizeArg)}
                onQtyChange={(productId, qty, sizeArg) => handleQtyChange(it.id, qty, sizeArg)}
                onSizeChange={(productId, newSize) => handleSizeChange(it.id, productId, newSize, it.size)}
              />
            ))}

            <hr />
            <div className="border-t border-gray-300 pt-3 text-sm w-full max-w-4xl mx-auto px-6">
              <div className="mb-2">Summary</div>

              <div className="grid grid-cols-2 gap-x-4 mb-2 max-w-xs">
                <div className="font-medium">Total</div>
                <div>&#8377; {subtotal.toFixed(2)}</div>

                <div>Delivery</div>
                <div className="text-gray-800">Free</div>
              </div>

              <div className="flex justify-end items-center border-b border-gray-300 pb-2">
                <a
                  href="#"
                  className="flex items-center gap-1 text-teal-700 hover:underline text-sm"
                >
                  Delivery &amp; return information
                  <img src="/truck.png" alt="truck" className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {message && <div className="mt-3 text-sm text-red-600">{message}</div>}
      </div>

      <div className="bg-gray-50 rounded-md p-4">
        <button
  className={`w-full p-3 rounded text-white font-medium mb-4 flex items-center justify-center gap-2 ${
    selectedPayment && cartData.items?.length
      ? "bg-emerald-700"
      : "bg-gray-400 cursor-not-allowed"
  }`}
  onClick={handleCheckout}
  disabled={!selectedPayment || !cartData.items?.length}
>
  <img src={lock} alt="lock" className="w-4 h-4 object-contain" />
  <span>Checkout Securely</span>
</button>


        <PaymentOptions value={selectedPayment} onChange={setSelectedPayment} />
      </div>
    </div>
  );
}
