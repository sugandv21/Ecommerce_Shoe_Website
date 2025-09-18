// src/pages/OrderConfirmation.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

function DecorativeTick({ size = 120 }) {
  // Renders a circular tick with surrounding small dots (pure CSS + SVG)
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
      {/* main circle with checkmark (SVG) */}
      <div
        aria-hidden
        className="rounded-full flex items-center justify-center"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          background: "#274541", // same green
          boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
        }}
      >
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* decorative dots */}
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API_ROOT}/orders/${id}/`, { withCredentials: true });
        if (cancelled) return;
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order:", err);
        setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function openModal() {
    setModalOpen(true);
    // If we don't already have items full details (order may have them already), ensure loaded
    if (!order) {
      setModalLoading(true);
      try {
        const res = await axios.get(`${API_ROOT}/orders/${id}/`, { withCredentials: true });
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order details for modal:", err);
      } finally {
        setModalLoading(false);
      }
    }
  }

  // derive order number string (format like #Bh2300006 in your example) — you can customize
  const orderNumber = order ? `#Bh${String(order.id).padStart(7, "0")}` : `#Bh${String(id || "").padStart(7, "0")}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4">
      <div className="max-w-2xl w-full border shadow-sm">
        <div className="p-12 bg-white text-center">
          <div className="flex justify-center mb-6">
            <DecorativeTick size={140} />
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">Thankyou for your ordering</h1>

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
              onClick={() => {
                // placeholder: you can route to a tracking page or external provider
                navigate("/track-order/" + id);
              }}
              className="px-6 py-3 rounded-md bg-[#274541] text-white text-lg font-medium hover:opacity-95"
            >
              Track Order
            </button>
          </div>
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
              <div>{new Date(order.created).toLocaleString()}</div>
            </div>

            <div className="flex justify-between">
              <div><strong>Status</strong></div>
              <div>{order.paid ? "Paid" : "Pending"}</div>
            </div>

            <div>
              <strong>Shipping Address</strong>
              <div className="mt-1">{order.shipping_address}</div>
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
              <div className="font-semibold">₹ {Number(order.total_amount).toFixed(2)}</div>
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
