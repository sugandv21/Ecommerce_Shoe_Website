import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import cartService from "../api/cartService";
import payVisa from "../assets/images/visa.png";
import payMstr from "../assets/images/mastercard.webp";
import payRupay from "../assets/images/rupay.png";
import payUpi from "../assets/images/upi.webp";
import whatsappImg from "../assets/images/whatsapp.png";
import placeholder from "../assets/images/lock.png";

function RatingStars({ rating = 0 }) {
  const filled = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < filled ? "text-yellow-400" : "text-gray-300"}`}
            viewBox="0 0 20 20"
            fill={i < filled ? "currentColor" : "none"}
            stroke="currentColor"
          >
            <path
              d="M10 1.5l2.6 5.27 5.8.84-4.2 4.09 0.99 5.77L10 14.77 4.81 17.47l0.99-5.77L1.6 7.61l5.8-.84L10 1.5z"
              strokeWidth="0.6"
            />
          </svg>
        ))}
      </div>
      <div className="text-sm text-gray-600">{rating}/5</div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]); // urls
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);
  const API_ROOT = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

  useEffect(() => {
    // prefill from navigation state (ProductCard passes { size, qty })
    if (location && location.state) {
      if (location.state.size) setSize(location.state.size);
      if (location.state.qty) setQty(Number(location.state.qty) || 1);
    }
  }, [location]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_ROOT}/products/${id}/`, { withCredentials: true });
        if (cancelled) return;
        const p = res.data;
        setProduct(p);
        // build images array from serializer: try variant_thumbs then images[].url
        const thumbs = Array.isArray(p.variant_thumbs) && p.variant_thumbs.filter(Boolean);
        if (thumbs && thumbs.length > 0) {
          setImages(thumbs.slice(0, 6));
        } else if (Array.isArray(p.images) && p.images.length > 0) {
          setImages(p.images.map((i) => i.url).slice(0, 6));
        } else {
          // fallback duplicates placeholder to fill grid
          setImages(Array.from({ length: 6 }, () => placeholder));
        }

        // default size selection if product has sizes and we have no size
        if ((!location?.state || !location.state.size) && p.sizes && p.sizes.length > 0) {
          const first = p.sizes[0].label ?? p.sizes[0].id ?? p.sizes[0];
          setSize(first);
        }
      } catch (err) {
        console.error("Failed to load product", err);
        setMessage("Failed to load product.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, API_ROOT, location]);

  const sizeOptions = useMemo(() => {
    if (!product?.sizes || product.sizes.length === 0) return [];
    return product.sizes.map((s) => {
      if (typeof s === "string" || typeof s === "number") return { id: s, label: String(s) };
      return { id: s.id ?? s.label ?? String(s), label: s.label ?? s.name ?? String(s.id) };
    });
  }, [product]);

  async function handleAddToCart(e) {
    e?.preventDefault();
    setMessage(null);

    if (!product) {
      setMessage("Product not loaded.");
      return;
    }
    if (sizeOptions.length > 0 && !size) {
      setMessage("Please select a size.");
      return;
    }
    if (!qty || Number(qty) < 1) {
      setMessage("Quantity must be at least 1.");
      return;
    }

    setAdding(true);
    try {
      await cartService.addItem(product.id, Number(qty), size || "");
      try {
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      } catch (e) {}
      setMessage("Added to cart.");
    } catch (err) {
      console.error("Add to cart error", err);
      setMessage("Could not add to cart.");
    } finally {
      setAdding(false);
    }
  }

  // NEW: direct Buy Now handler that bypasses cart and navigates to checkout with state
  function handleBuyNow(e) {
    e?.preventDefault();
    setMessage(null);

    if (!product) {
      setMessage("Product not loaded.");
      return;
    }
    if (sizeOptions.length > 0 && !size) {
      setMessage("Please select a size.");
      return;
    }
    if (!qty || Number(qty) < 1) {
      setMessage("Quantity must be at least 1.");
      return;
    }

    // navigate to checkout with a single-item payload
    navigate("/checkout", {
      state: {
        fromBuyNow: true,
        item: {
          product_id: product.id,
          quantity: Number(qty),
          size: size || "",
        },
      },
    });
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div>Loading product…</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <section className="md:col-span-2">
        <div className="grid grid-cols-2 grid-rows-3 gap-4">
          {images.map((src, i) => {
            const isSelected = i === selectedImageIndex;
            return (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`overflow-hidden rounded-lg border ${isSelected ? "" : "border-gray-200"} bg-white focus:outline-none`}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={src || placeholder}
                  alt={`${product.title} image ${i + 1}`}
                  className="w-full h-40 md:h-56 object-contain bg-gray-50"
                  onError={(e) => (e.currentTarget.src = placeholder)}
                />
              </button>
            );
          })}
        </div>
      </section>

      <aside className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-serif font-semibold">{product.title}</h1>
        {product.subtitle && <p className="text-sm text-gray-600 mt-1">{product.subtitle}</p>}

        <div className="mt-3">
          <div className="flex items-baseline gap-3">
            <div className="text-xs text-gray-500">MRP</div>
            <div className="text-2xl font-bold">₹ {product.price}</div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <RatingStars rating={product.rating} />
            <span className="text-gray-600">{product.reviews_count ?? 16} reviews</span>
          </div>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium">Color</div>
            <div className="flex items-center gap-3 mt-2">
              {product.colors.map((c, idx) => {
                const value = typeof c === "string" ? c : c.hex ?? c.value ?? "";
                return (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border"
                    title={c.name ?? value}
                    style={{ backgroundColor: value || "transparent" }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {sizeOptions.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium">Shoe Size</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {sizeOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.label)}
                  className={`px-3 py-1 rounded border ${size === s.label ? "bg-gray-800 text-white" : "bg-white"}`}
                  aria-pressed={size === s.label}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-sm font-medium">Quantity</div>
          <div className="mt-4">
            <div className="w-36 bg-gray-100 rounded-md overflow-hidden inline-flex items-center gap-0 border border-gray-200">
              <button
                onClick={() => setQty((q) => Math.max(1, Number(q) - 1))}
                aria-label="Decrease quantity"
                className="px-3 py-2 text-lg leading-none focus:outline-none hover:bg-gray-200"
                title="Decrease"
              >
                −
              </button>

              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                className="w-14 text-center px-1 py-2 bg-transparent border-gray-200 focus:outline-none"
                aria-label="Quantity"
              />

              <button
                onClick={() => setQty((q) => Number(q) + 1)}
                aria-label="Increase quantity"
                className="px-3 py-2 text-lg leading-none focus:outline-none hover:bg-gray-200"
                title="Increase"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full px-4 py-3 rounded text-white font-medium ${adding ? "bg-gray-400" : "bg-[#2f4f4f] hover:bg-[#3b5f5f]"}`}
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>

          {/* BUY NOW: navigate to checkout with single-item state (bypass cart) */}
          <button
            onClick={handleBuyNow}
            className="w-full px-4 py-3 rounded bg-[#3b5f5f] text-white flex items-center justify-center"
            aria-label="Buy now and go to checkout"
          >
            <span className="font-medium">Buy Now</span>

            <span className="relative w-28 h-8 flex-shrink-0" aria-hidden="true" role="img" aria-label="Payment options">
              {[payVisa, payMstr, payRupay, payUpi].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="ml-4 w-8 h-8 rounded-full border bg-white object-contain"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: `${i * 18}px`,
                    zIndex: 20 + i,
                    boxShadow: "0 0 0 2px #fff",
                  }}
                />
              ))}
            </span>
          </button>

          <div className="mt-4 border border-black rounded p-2">
            <div className="text-sm font-medium mb-2 text-center">Secure Checkout With</div>
            <div className="flex items-center gap-3">
              <img src={payUpi} alt="UPI" className="w-16 h-8 object-contain" />
              <img src={payRupay} alt="RuPay" className="w-16 h-8 object-contain" />
              <img src={payMstr} alt="MasterCard" className="w-16 h-8 object-contain" />
              <img src={payVisa} alt="Visa" className="w-16 h-8 object-contain" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 border border-black px-2">
            <button
              onClick={() => {
                window.open("https://wa.me/919999999999?text=Hi%20I%27m%20unsure%20about%20my%20size", "_blank");
              }}
              className="text-sm"
            >
              Unsure about your size? Let&apos;s connect
            </button>
            <img src={whatsappImg} alt="whatsapp" className="w-8 h-8 object-contain rounded-full" />
          </div>

          <div className="mt-4 bg-gray-200 rounded-xl p-4 text-center text-sm space-y-2 ">
            <div className="font-medium">COD Available</div>
            <hr className="border-t-1 border-black my-1" />
            <div>24 Hour Dispatch</div>
            <hr className="border-t-1 border-black my-1" />
            <div>7 Days easy return &amp; exchange</div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-sm text-gray-700">
          <h3 className="font-semibold mb-2">Product Details</h3>
          <div>{product.description || "No description available."}</div>
        </div>
      </aside>
    </div>
  );
}
