import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
axios.defaults.withCredentials = true; 

import placedIcon from "../assets/images/cart.png";
import dispatchedIcon from "../assets/images/warehouse.png";
import transitIcon from "../assets/images/truck.png";
import deliveredIcon from "../assets/images/like.png";
import placeholder from "../assets/images/like.png"; 

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", icon: placedIcon },
  { key: "dispatched", label: "Order Dispatched", icon: dispatchedIcon },
  { key: "in_transit", label: "Order in transit", icon: transitIcon },
  { key: "delivered", label: "Delivered successfully", icon: deliveredIcon },
];

function Icon({ src, done }) {
  return (
    <div
      className={`rounded-full p-3 flex items-center justify-center shadow-sm ${
        done ? "bg-emerald-800 border-2 border-emerald-900" : "bg-gray-200 border border-gray-300"
      }`}
      style={{ width: 56, height: 56 }}
    >
      <img src={src} alt="" className={`w-6 h-6 ${done ? "filter brightness-150" : "opacity-60"}`} />
    </div>
  );
}

/** Resolve a usable image URL from an order item or product object.
 * Tries multiple common shapes:
 *  - product.main_image_url
 *  - product.images[0].url
 *  - product.image
 *  - item.product_image (some APIs return item-level image)
 * Falls back to the provided local placeholder.
 * If the returned value looks like a relative path (starts with '/'),
 * prefix with API_ROOT (assumes images served from same backend).
 */
function resolveImageUrl({ product = null, item = null } = {}) {
  const candidates = [];

  if (product) {
    if (product.main_image_url) candidates.push(product.main_image_url);
    if (product.image) candidates.push(product.image);
    if (product.main_image) candidates.push(product.main_image);
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // some APIs embed objects `{ url: "..." }` or strings
      const first = product.images[0];
      if (first && typeof first === "string") candidates.push(first);
      if (first && typeof first === "object" && (first.url || first.src)) candidates.push(first.url || first.src);
    }
  }

  if (item) {
    if (item.product_image) candidates.push(item.product_image);
    if (item.image) candidates.push(item.image);
  }

  // Normalize and validate candidate URL
  for (let url of candidates) {
    if (!url) continue;
    if (typeof url !== "string") continue;
    url = url.trim();
    if (!url) continue;

    // If url already absolute, return as-is
    if (/^https?:\/\//i.test(url)) return url;

    // If it looks like a data URL, return
    if (/^data:/i.test(url)) return url;

    // If it starts with a slash, make absolute by prefixing API root (strip possible '/api' from API_ROOT)
    if (url.startsWith("/")) {
      // if API_ROOT contains /api, try using its origin part only
      try {
        const apiUrl = new URL(API_ROOT);
        return apiUrl.origin + url;
      } catch (e) {
        // fallback: join naively
        return API_ROOT.replace(/\/+$/, "") + url;
      }
    }

    // Otherwise, if it's relative (no leading slash) — join
    return API_ROOT.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
  }

  // final fallback to local placeholder import
  return placeholder;
}

export default function TrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [needEmail, setNeedEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  function applyOrderAndEvents(orderData) {
    setOrder(orderData);
    const evs = (orderData.tracking_events || []).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setEvents(evs);
  }

  async function fetchOrder({ email = null } = {}) {
    setLoading(true);
    setError(null);

    const params = {};
    if (email) params.email = email;

    try {
      const res = await axios.get(`${API_ROOT}/orders/${id}/`, { params, withCredentials: true });
      applyOrderAndEvents(res.data);
      setNeedEmail(false);
      return { success: true };
    } catch (err) {
      const resp = err?.response;
      const status = resp?.status;

      if (status === 401 || status === 403 || status === 404) {
        try {
          const trac = await axios.get(`${API_ROOT}/orders/${id}/tracking/`, { params, withCredentials: true });
          const evlist = (trac.data || []).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setEvents(evlist);
          setOrder({ id, items: [], total_amount: "—", payment_method: "—" });
          setNeedEmail(false);
          return { success: true };
        } catch {
          if (!email) {
            setNeedEmail(true);
            setError("This order is private. Enter the email used for the order to view tracking.");
            return { success: false };
          }
          setError(resp?.data?.detail || `Access denied (status ${status}).`);
          return { success: false };
        }
      }

      if (!resp) {
        setError("Network error — is the API server running?");
      } else {
        setError(resp?.data || `Request failed (${resp.status})`);
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) {
      setError("Missing order id in URL.");
      setLoading(false);
      return;
    }
    fetchOrder();
  }, [id]);

  const handleEmailSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!emailInput || !emailInput.trim()) {
      setError("Enter the email used at checkout.");
      return;
    }
    await fetchOrder({ email: emailInput.trim() });
  };

  const eventsMap = useMemo(() => {
    const m = {};
    for (const ev of events) m[ev.status] = ev;
    return m;
  }, [events]);

  const latestIndex = useMemo(() => {
    if (!events || events.length === 0) return -1;
    const last = events[events.length - 1];
    const idx = STATUS_STEPS.findIndex((s) => s.key === last.status);
    return idx >= 0 ? idx : -1;
  }, [events]);

  if (loading) return <div className="p-6">Loading…</div>;

  // choose image from first item (robust)
  const previewImg = (() => {
    const firstItem = (order?.items && order.items.length > 0) ? order.items[0] : null;
    const product = firstItem?.product ?? null;
    return resolveImageUrl({ product, item: firstItem });
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl border border-gray-300 bg-white rounded shadow-sm">
        {/* Header: Order no / Payment method / Amount in one row */}
<div className="p-3">
  <div className="flex items-center justify-between gap-4">
    {/* Left: back button + title + order no */}
    <div className="flex items-center gap-3 min-w-0">
      <button onClick={() => navigate(-1)} className="text-lg flex-shrink-0">←</button>

      <div className="min-w-0">
        <div className="text-lg font-semibold truncate">Order Tracking</div>
        <div className="text-xs text-gray-600 truncate ms-20">
          Order no #{String(order?.id ?? id).padStart(6, "0")}
        </div>
      </div>
    </div>

    {/* Right: payment method + amount (kept together) */}
    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
      <div className="text-sm text-gray-600 text-right flex items-center gap-3">
  <div className="font-semibold truncate">
    {order?.payment_method
      ? (order.payment_method === "cod"
          ? "Cash on Delivery"
          : order.payment_method)
      : "Payment"}
  </div>
  <div>₹ {order?.total_amount ?? "—"}</div>
</div>

    </div>
  </div>
</div>


        <div className="p-3 flex gap-3 items-start border-b">
          <img src={previewImg} alt="" className="w-20 h-20 object-contain rounded" />
          <div className="flex-1">
            <div className="font-semibold">{order?.items?.[0]?.product?.title ?? order?.items?.[0]?.title ?? "—"}</div>
            <div className="text-sm text-gray-700">{order?.items?.[0]?.product?.subtitle ?? ""}</div>
            <div className="text-xs text-gray-500 mt-2">
              Exp : Delivery by {events.length ? new Date(events[events.length-1].timestamp).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          {needEmail && (
            <form onSubmit={handleEmailSubmit} className="mb-4">
              <div className="mb-2 text-sm text-gray-700">This order is private. Enter the email used for the order to view tracking:</div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="order@example.com"
                className="w-full p-2 border rounded mb-2"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-[#274541] text-white rounded">Submit</button>
                <button type="button" onClick={() => { setNeedEmail(false); setError(null); }} className="px-4 py-2 border rounded">Cancel</button>
              </div>
            </form>
          )}

          {error && <div className="mb-4 text-sm text-red-600"><strong>Error:</strong> {String(error)}</div>}

          <div className="space-y-8">
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= latestIndex;
              const ev = eventsMap[step.key] || null;
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <Icon src={step.icon} done={done} />
                    {idx !== STATUS_STEPS.length - 1 && (
                      <div className="w-px" style={{ height: 80, background: done ? "#065f46" : "#E5E7EB" }} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className={`${done ? "text-emerald-900 font-semibold" : "text-gray-400 font-semibold"}`}>{step.label}</div>
                    {done ? (
                      ev ? (
                        <>
                          <div className="text-sm text-gray-700 mt-1">{ev.timestamp_readable || new Date(ev.timestamp).toLocaleString()}</div>
                          {ev.location && <div className="text-sm text-gray-700 mt-1">{ev.location}</div>}
                          {ev.note && <div className="text-xs text-gray-500 mt-1">{ev.note}</div>}
                        </>
                      ) : (
                        <div className="text-sm text-gray-700 mt-1">{events.length ? (events[events.length-1].timestamp_readable || new Date(events[events.length-1].timestamp).toLocaleString()) : ""}</div>
                      )
                    ) : (
                      <div className="text-sm text-gray-400 mt-1">{step.key === "delivered" ? "Not delivered yet" : "Pending"}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {(!events || events.length === 0) && <div className="text-sm text-gray-600">No tracking events found for this order.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
