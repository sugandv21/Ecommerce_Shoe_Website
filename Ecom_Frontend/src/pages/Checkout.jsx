// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import cartService from "../api/cartService";

// payment logos - adjust paths to match your project
import visaImg from "../assets/images/visa.png";
import gpayImg from "../assets/images/gpay.png";
import paypalImg from "../assets/images/paypal.png";
import clearpayImg from "../assets/images/clearpay.png";
import klarnaImg from "../assets/images/klarna.png";

const API_ROOT = (import.meta.env.VITE_API_URL || "https://django-4hm5.onrender.com/api").replace(/\/+$/, "");

// Ensure axios sends cookies for cross-origin requests
axios.defaults.withCredentials = true;

/* ---------- CSRF helpers ---------- */
// Read csrftoken cookie value
function readCsrfTokenFromCookie() {
  try {
    const name = "csrftoken=";
    const cookie = (document.cookie || "")
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(name));
    if (!cookie) return null;
    return decodeURIComponent(cookie.substring(name.length));
  } catch (e) {
    return null;
  }
}

// Best-effort: call backend endpoint that sets the CSRF cookie (ensure_csrf_cookie)
async function ensureCsrf() {
  try {
    await axios.get(`${API_ROOT}/auth/csrf/`);
  } catch (e) {
    // ignore errors; we will still attempt to read cookie and send header
  }
}

// Attach header object with X-CSRFToken when available
function csrfHeaderObject() {
  const token = readCsrfTokenFromCookie();
  if (token) return { "X-CSRFToken": token };
  return {};
}
/* ---------- /CSRF helpers ---------- */

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);

  // items: array of { product, quantity, size }
  const [items, setItems] = useState([]);
  const [cartId, setCartId] = useState(null);

  // form (controlled)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    card_holder_name: "",
    card_number: "",
    cvv: "",
    expiration_date: "",
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    payment_method: "cod",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const st = location.state || {};
        if (st.fromBuyNow && st.item) {
          // Buy Now single item -> fetch product detail and prefill order summary
          const resp = await axios.get(`${API_ROOT}/products/${st.item.product_id}/`, { withCredentials: true });
          const p = resp.data;
          if (cancelled) return;
          setItems([
            {
              product: p,
              quantity: Number(st.item.quantity || 1),
              size: st.item.size || "",
            },
          ]);
          setCartId(null);
          return;
        }

        // Otherwise load cart (cartService should respect withCredentials)
        const cart = await cartService.getCart();
        if (cancelled) return;
        setCartId(cart?.id ?? null);
        const mapped = (cart?.items || []).map((ci) => ({
          product: ci.product,
          quantity: Number(ci.quantity || 1),
          size: ci.size || "",
        }));
        setItems(mapped);
      } catch (err) {
        console.error("Checkout load error:", err);
        setMessage("Failed to load checkout data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location]);

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it?.product?.price || 0) * Number(it.quantity || 1), 0);
  }, [items]);

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    if (!form.first_name?.trim()) return "First name is required.";
    if (!form.email?.trim()) return "Email is required.";
    if (!form.address_line1?.trim()) return "Shipping address is required.";
    if (!form.pincode?.trim()) return "Pincode is required.";
    return null;
  }

  async function postCheckoutDetails(formData) {
    // Try to save checkout details to server (best-effort). Make sure CSRF header is present.
    await ensureCsrf();
    const headers = csrfHeaderObject();
    return axios.post(`${API_ROOT}/checkout-details/`, formData, { withCredentials: true, headers });
  }

  async function postOrder(payload) {
    await ensureCsrf();
    const headers = csrfHeaderObject();
    return axios.post(`${API_ROOT}/orders/`, payload, { withCredentials: true, headers });
  }

  async function handleOrder(e) {
    e?.preventDefault();
    setMessage(null);

    if (!items || items.length === 0) {
      setMessage("No items to order.");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setPlacing(true);
    try {
      // 1) Save checkout details (best-effort)
      try {
        const savePayload = { ...form };
        // don't send raw sensitive CVV in production - this is example only
        await postCheckoutDetails(savePayload);
      } catch (saveErr) {
        // If CSRF or auth fails here, warn but continue to order attempt (order may also fail)
        console.warn("Could not save checkout details:", saveErr?.response?.data || saveErr?.message || saveErr);
      }

      // 2) Place order
      if (cartId && !(location.state && location.state.fromBuyNow)) {
        const payload = {
          cart_id: cartId,
          fullname: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          shipping_address: form.address_line1 + (form.landmark ? ` | ${form.landmark}` : ""),
          payment_method: form.payment_method,
        };

        const res = await postOrder(payload);
        setMessage(`Order placed (id: ${res.data.order_id})`);
        navigate(`/order-confirmation/${res.data.order_id}`, { state: { message: res.data.message } });
        return;
      }

      // Buy Now -> send items explicitly
      const itemsPayload = items.map((it) => ({
        product: it.product.id,
        quantity: it.quantity,
        size: it.size || "",
      }));

      const payload = {
        fullname: `${form.first_name} ${form.last_name}`.trim(),
        email: form.email,
        shipping_address: form.address_line1 + (form.landmark ? ` | ${form.landmark}` : ""),
        payment_method: form.payment_method,
        items: itemsPayload,
      };

      const res2 = await postOrder(payload);
      setMessage(`Order placed (id: ${res2.data.order_id})`);
      navigate(`/order-confirmation/${res2.data.order_id}`, { state: { message: res2.data.message } });
    } catch (err) {
      console.error("Place order error:", err);
      const server = err?.response?.data ?? err?.message ?? "Order failed.";
      // Show friendly message if CSRF-related
      if (typeof server === "object" && server?.detail && String(server.detail).toLowerCase().includes("csrf")) {
        setMessage("Security check failed (CSRF). Try reloading the page and signing in again.");
      } else {
        setMessage(typeof server === "string" ? server : JSON.stringify(server));
      }
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <div className="max-w-6xl mx-auto p-6">Loading checkout…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-center font-serif text-2xl mb-6">Checkout</h1>

      <div className="flex gap-6">
        {/* Left: Order Summary (dark green) */}
        <aside className="w-1/3 bg-[#274541] text-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          {items.length > 0 ? (
            <>
              {items.map((it, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex gap-4 items-start">
                    <img
                      src={it.product.main_image_url || it.product.images?.[0]?.url || "/placeholder.png"}
                      alt={it.product.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-base">{it.product.title}</div>
                      {it.product.subtitle && <div className="text-sm opacity-80 mt-1">{it.product.subtitle}</div>}

                      <div className="grid grid-cols-2 gap-1 mt-3 text-sm">
                        <div className="opacity-90">Size</div>
                        <div className="text-right">{it.size || "-"}</div>

                        <div className="opacity-90">Quantity</div>
                        <div className="text-right">{it.quantity}</div>

                        <div className="opacity-90">MRP</div>
                        <div className="text-right">₹ {Number(it.product.price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-t border-white opacity-30 my-4" />
                </div>
              ))}

              <div className="mt-2 text-sm">
                <div className="flex justify-between mb-2">
                  <span>Amount</span>
                  <span>₹ {Number(total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Delivery fees</span>
                  <span>Free</span>
                </div>
                <hr className="border-t border-white opacity-30 my-3" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹ {Number(total).toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div>No items in order.</div>
          )}
        </aside>

        {/* Right: Form (light background) */}
        <form onSubmit={handleOrder} className="flex-1 bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Complete Your Order</h2>

          {/* Personal Details */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">First Name</label>
                <input
                  name="first_name"
                  placeholder="Enter your first name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full mt-0 p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Last Name</label>
                <input
                  name="last_name"
                  placeholder="Enter your last name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full mt-0 p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Email id</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full mt-0 p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Phone Number</label>
                <input
                  name="phone_number"
                  placeholder="Enter your phone no"
                  value={form.phone_number}
                  onChange={handleChange}
                  className="w-full mt-0 p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Payment Details</h3>

            <div className="flex items-center gap-3 mb-4">
              <img src={visaImg} alt="Visa" className="h-7 object-contain" />
              <img src={gpayImg} alt="GPay" className="h-7 object-contain" />
              <img src={paypalImg} alt="PayPal" className="h-7 object-contain" />
              <img src={clearpayImg} alt="Clearpay" className="h-7 object-contain" />
              <img src={klarnaImg} alt="Klarna" className="h-7 object-contain" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Card Holder Name</label>
                <input
                  name="card_holder_name"
                  placeholder="Enter name"
                  value={form.card_holder_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Card Number</label>
                <input
                  name="card_number"
                  placeholder="Enter card number"
                  value={form.card_number}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">CVV</label>
                <input
                  name="cvv"
                  placeholder="Example: 4329"
                  value={form.cvv}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Expiration Date</label>
                <input
                  name="expiration_date"
                  placeholder="MM/YY"
                  value={form.expiration_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="inline-block border rounded px-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute w-5 h-5 rounded-full border border-gray-500"></span>
                    <span
                      className={`absolute w-3 h-3 rounded-full ${
                        form.payment_method === "cod" ? "bg-gray-700" : "bg-transparent"
                      }`}
                      aria-hidden
                    ></span>
                    <input
                      name="payment_method"
                      type="radio"
                      value="cod"
                      checked={form.payment_method === "cod"}
                      onChange={handleChange}
                      className="absolute opacity-0 w-0 h-0"
                      aria-label="Cash on Delivery"
                    />
                  </span>
                  <span className="text-sm">Cash on Delivery</span>
                </label>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Shipping Address</h3>

            <label className="text-sm block mb-1">Address Line 1</label>
            <input
              name="address_line1"
              placeholder="Enter your address"
              value={form.address_line1}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-3"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1">City</label>
                <input name="city" placeholder="Your city" value={form.city} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">State</label>
                <input name="state" placeholder="Your state" value={form.state} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">Landmark</label>
                <input name="landmark" placeholder="Any landmark (famous place/mall)" value={form.landmark} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="text-sm block mb-1">Pincode</label>
                <input name="pincode" placeholder="Code" value={form.pincode} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button type="button" onClick={() => navigate(-1)} className="bg-gray-300 px-6 py-2 rounded text-lg font-medium">
              Cancel
            </button>
            <button type="submit" disabled={placing} className="bg-[#274541] text-white px-6 py-2 rounded text-lg font-medium">
              {placing ? "Processing..." : "Order Now"}
            </button>
          </div>

          {message && <div className="mt-4 text-sm text-red-600">{String(message)}</div>}
        </form>
      </div>
    </div>
  );

}
