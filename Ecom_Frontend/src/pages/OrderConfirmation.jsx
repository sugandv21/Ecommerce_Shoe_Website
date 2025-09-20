// src/pages/OrderConfirmation.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_ROOT = (import.meta.env.VITE_API_URL || "https://django-4hm5.onrender.com/api").replace(/\/+$/, "");

// Best-effort CSRF setter (call once before protected requests)
async function ensureCsrf() {
  try {
    await axios.get(`${API_ROOT}/auth/csrf/`, { withCredentials: true });
  } catch (err) {
    // ignore — we still try to send cookies/headers; log for debugging only
    // console.warn("ensureCsrf failed:", err?.response?.data ?? err?.message);
  }
}

function DecorativeTick({ size = 120 }) {
  const dots = [
    { x: -46, y: -12, s: 6 },
    { x: -28, y: -44, s: 8 },
    { x: -6, y: -58, s: 4 },
    { x: 20, y: -60, s: 6 },
    { x: 48, y: -40, s: 5 },
    { x: 60, y: -10, s: 6 },
    { x: 42, y: 18, s: 5 },
    { x: 12, y: 38, s: 4 },
    { x: -20, y: 44, s: 6 },
    { x: -42, y: 28, s: 5 },
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        aria-hidden
        className="rounded-full flex items-center justify-center"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          background: "#274541",
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
        }}
      >
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {dots.map((d, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `calc(50% + ${d.x}px)`,
            top: `calc(50% + ${d.y}px)`,
            width: d.s,
            height: d.s,
            borderRadius: d.s,
            background: "#274541",
            opacity: 0.95 - (i % 3) * 0.12,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        />
      ))}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "modal"}
    >
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-md shadow-2xl max-w-3xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-600 hover:text-gray-900">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);

  // ensure axios sends cookies on all requests in this component
  axios.defaults.withCredentials = true;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // Best-effort: request CSRF cookie prior to protected GET (useful if backend expects it)
      await ensureCsrf();

      try {
        setLoading(true);
        setError(null);

        // Primary fetch: order detail (may require authenticated session)
        const res = await axios.get(`${API_ROOT}/orders/${id}/`, { withCredentials: true });
        if (cancelled) return;
        setOrder(res.data);
      } catch (err) {
        // Save last axios error to window for quick console inspection
        window.lastAxiosError = err;

        // Log full response if present (server returns helpful "detail")
        console.warn("Failed to load order:", err?.response?.status, err?.response?.data ?? err?.message);

        if (err?.response) {
          const status = err.response.status;
          const body = err.response.data;
          setError(`Order fetch failed (${status}): ${JSON.stringify(body)}`);

          // fallback: if auth/ownership or not found, try tracking-only endpoint (also sends credentials)
          if (status === 401 || status === 403 || status === 404) {
            try {
              const t = await axios.get(`${API_ROOT}/orders/${id}/tracking/`, { withCredentials: true });
              if (cancelled) return;
              // we only have tracking events — create placeholder order for UI
              const evlist = (t.data || []).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              // convert to a minimal order object so modal can still render
              setOrder({ id, items: [], total_amount: "—", payment_method: "—", tracking_events: evlist });
              setError(null); // clear error because fallback succeeded
            } catch (err2) {
              window.lastAxiosError = err2;
              console.warn("Tracking-only fetch failed:", err2?.response?.status, err2?.response?.data ?? err2?.message);
              setError(`Tracking fetch failed: ${err2?.response?.status ?? "network error"}`);
            }
          }
        } else {
          setError("Network error fetching order. Check server/CORS.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, location.key]);

  async function openModal() {
    setModalOpen(true);
    if (order && order.items && order.items.length > 0) return;
    setModalLoading(true);
    try {
      await ensureCsrf();
      const res = await axios.get(`${API_ROOT}/orders/${id}/`, { withCredentials: true });
      setOrder(res.data);
    } catch (err) {
      window.lastAxiosError = err;
      console.warn("Failed to load order details for modal:", err?.response?.data ?? err?.message);
    } finally {
      setModalLoading(false);
    }
  }

  const orderNumber = order ? `#Bh${String(order.id).padStart(7, "0")}` : `#Bh${String(id || "").padStart(7, "0")}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4">
      <div className="max-w-2xl w-full border shadow-sm">
        <div className="p-12 bg-white text-center">
          <div className="flex justify-center mb-6">
            <DecorativeTick size={140} />
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">Thank you for your order</h1>

          <p className="text-sm text-gray-700 mb-4">
            We’ve received your order and it will ship in 5-7 business days.
          </p>

          <p className="text-sm text-gray-700 mb-6">Your order number is <span className="font-semibold">{orderNumber}</span></p>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={openModal}
              className="px-6 py-3 border rounded-md text-lg font-medium hover:shadow"
            >
              View Order
            </button>

            <button
              onClick={() => navigate("/tracking/" + id)}
              className="px-6 py-3 rounded-md bg-[#274541] text-white text-lg font-medium hover:opacity-95"
            >
              Track Order
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600">
              <strong>Error:</strong> {String(error)}
              <div className="text-xs text-gray-500 mt-1">Open DevTools → Console/Network for details (window.lastAxiosError).</div>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Order ${orderNumber}`}>
        {modalLoading ? (
          <div>Loading order...</div>
        ) : order ? (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <div><strong>Order Id</strong></div>
              <div>{order.id}</div>
            </div>

            <div className="flex justify-between">
              <div><strong>Placed</strong></div>
              <div>{order.created ? new Date(order.created).toLocaleString() : "—"}</div>
            </div>

            <div className="flex justify-between">
              <div><strong>Status</strong></div>
              <div>{order.paid ? "Paid" : "Pending"}</div>
            </div>

            <div>
              <strong>Shipping Address</strong>
              <div className="mt-1">{order.shipping_address || "—"}</div>
            </div>

            <div>
              <strong>Items</strong>
              <div className="mt-2 space-y-2">
                {order.items && order.items.length > 0 ? order.items.map(it => (
                  <div key={it.id} className="flex gap-4 items-center border-b pb-2">
                    <img src={it.product?.main_image_url || it.product?.images?.[0]?.url || "/placeholder.png"} alt={it.title} className="w-16 h-16 object-contain rounded" />
                    <div className="flex-1">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs text-gray-600">Size: {it.size || "-"}</div>
                      <div className="text-xs text-gray-600">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-right">₹ {Number(it.price).toFixed(2)}</div>
                  </div>
                )) : <div>No items found.</div>}
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t">
              <div><strong>Total</strong></div>
              <div className="font-semibold">₹ {order.total_amount ? Number(order.total_amount).toFixed(2) : "—"}</div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        ) : (
          <div>Could not load order details.</div>
        )}
      </Modal>
    </div>
  );
}

