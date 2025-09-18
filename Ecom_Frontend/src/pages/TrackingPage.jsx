// src/pages/TrackingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// replace or keep API root from your project
const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

// import icons/images (adjust paths to where you keep assets)
import placedIcon from "../assets/images/cart.png";
import dispatchedIcon from "../assets/images/warehouse.png";
import transitIcon from "../assets/images/truck.png";
import deliveredIcon from "../assets/images/like.png";
import placeholder from "../assets/images/like.png";

function IconForStatus({ status }) {
  // map status to icon
  switch (status) {
    case "placed":
      return <img src={placedIcon} alt="placed" className="w-8 h-8" />;
    case "dispatched":
      return <img src={dispatchedIcon} alt="dispatched" className="w-8 h-8" />;
    case "in_transit":
      return <img src={transitIcon} alt="in transit" className="w-8 h-8" />;
    case "delivered":
      return <img src={deliveredIcon} alt="delivered" className="w-8 h-8" />;
    default:
      return <div className="w-8 h-8 rounded-full bg-gray-300" />;
  }
}

export default function TrackingPage() {
  const { id } = useParams(); // route: /tracking/:id  (or /orders/:id/tracking)
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // fetch order detail with tracking_events included
        const res = await axios.get(`${API_ROOT}/orders/${id}/`, { withCredentials: true });
        if (cancelled) return;
        setOrder(res.data);
        setEvents(res.data.tracking_events || []);
      } catch (err) {
        console.error("Failed to load order tracking", err);
        setError("Failed to load tracking information.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const latestEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    return events[events.length - 1];
  }, [events]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const product = order?.items?.[0]?.product ?? null; // first item for header image

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-md border border-gray-300 bg-white rounded shadow-sm">
        {/* Header */}
        <div className="p-3 border-b flex items-start gap-3">
          <button onClick={() => navigate(-1)} className="text-lg">←</button>
          <div className="flex-1">
            <div className="text-lg font-semibold">Your Order</div>
            <div className="text-xs text-gray-600">Order no #{String(order.id).padStart(6, "0")}</div>
          </div>
          <div className="text-sm text-right text-gray-600">
            <div className="font-semibold">Cash on Delivery</div>
            <div>₹ {order?.total_amount}</div>
          </div>
        </div>

        {/* Product summary */}
        <div className="p-3 flex gap-3 items-start border-b">
          <img src={product?.main_image_url || product?.images?.[0]?.url || placeholder} alt={product?.title} className="w-20 h-20 object-cover rounded" />
          <div className="flex-1">
            <div className="font-semibold">{product?.title}</div>
            <div className="text-sm text-gray-700">{product?.subtitle}</div>
            <div className="text-xs text-gray-500 mt-2">Exp : Delivery by {latestEvent ? new Date(latestEvent.timestamp).toDateString() : "—"}</div>
          </div>
        </div>

        {/* Timeline area */}
        <div className="p-6 bg-gray-50">
          <div className="space-y-6">
            {events.map((ev, idx) => {
              const isDone = ev.status !== "placed" ? true : true; // all events are shown as steps
              const isLast = idx === events.length - 1;
              return (
                <div key={ev.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 bg-white border ${isLast ? "border-green-700" : "border-gray-300"}`}>
                      <IconForStatus status={ev.status} />
                    </div>
                    {!isLast && <div className="w-px h-full bg-dashed border-l border-gray-300 mt-1" style={{height: 40}} />}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold">{ev.status.replace(/_/g, " ")}</div>
                    <div className="text-sm text-gray-600">{ev.timestamp_readable || new Date(ev.timestamp).toLocaleString()}</div>
                    {ev.location && <div className="text-sm text-gray-700 mt-1">{ev.location}</div>}
                    {ev.note && <div className="text-xs text-gray-500 mt-1">{ev.note}</div>}
                  </div>
                </div>
              );
            })}

            {/* If order not delivered, show final pending state */}
            {(!events || events.length === 0 || events[events.length - 1]?.status !== "delivered") && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="rounded-full p-2 bg-white border border-gray-300">
                    <img src={deliveredIcon} alt="pending" className="w-8 h-8 opacity-50" />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-400">Delivered successfully</div>
                  <div className="text-sm text-gray-400">Not delivered yet</div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
