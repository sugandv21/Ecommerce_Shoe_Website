import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import cartService from "../api/cartService";
import phonepe from "../assets/images/phonepe.png";
import gpay from "../assets/images/gpay1.png";
import paytm from "../assets/images/paytm.png";
import payVisa from "../assets/images/visa.png";
import payMstr from "../assets/images/mastercard.webp";
import payRupay from "../assets/images/rupay.png";
import payUpi from "../assets/images/upi.webp";
import whatsappImg from "../assets/images/whatsapp.png";
import placeholder from "../assets/images/lock.png";
import Reviews from "../components/ReviewCard";
import AuthPage from "../pages/AuthPage";

axios.defaults.withCredentials = true;

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

function InfoModal({ open, onClose, onContinue, message }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="text-lg font-semibold mb-3">Continue to Checkout</div>
        <div className="text-sm text-gray-700 mb-6">{message}</div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button onClick={onContinue} className="px-4 py-2 rounded bg-[#2f4f4f] text-white">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]); 
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const pendingBuyRef = useRef(null);

  const placeholderSrc = (placeholder && (placeholder.default || placeholder)) || "";
  const API_ROOT = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

  useEffect(() => {
    if (location && location.state) {
      if (location.state.size) setSize(location.state.size);
      if (location.state.qty) setQty(Number(location.state.qty) || 1);
      if (location.state.color) setSelectedColor(location.state.color);
    }
  }, [location]);
  function getImageUrl(entry) {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    return (
      entry.url ||
      entry.image ||
      entry.image_url ||
      entry.src ||
      entry.path ||
      entry.file ||
      entry.thumbnail ||
      ""
    );
  }

  function preloadUrl(u) {
    return new Promise((resolve) => {
      if (!u) return resolve(null);
      try {
        const img = new window.Image();
        img.onload = () => resolve(u);
        img.onerror = () => resolve(null);
        img.src = u;
        setTimeout(() => {
          resolve(img.complete ? u : null);
        }, 4000);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function resolveValidUrls(rawArr = []) {
    const candidates = Array.isArray(rawArr) ? rawArr.map(getImageUrl).filter(Boolean) : [];
    const unique = Array.from(new Set(candidates)); 
    if (unique.length === 0) return [];

    const results = await Promise.all(unique.map((u) => preloadUrl(u)));
    const ok = results.filter(Boolean);
    return ok;
  }


  async function buildSixImages(p) {
    const tryArr = Array.isArray(p.images) && p.images.length > 0 ? p.images : (Array.isArray(p.variant_thumbs) ? p.variant_thumbs : []);
    const valid = await resolveValidUrls(tryArr);

    if (valid.length === 0) {
      const maybe = getImageUrl(p.image) || getImageUrl(p.main_image) || getImageUrl(p.cover) || "";
      const maybeOk = maybe ? (await preloadUrl(maybe)) : null;
      if (maybeOk) {
        return Array.from({ length: 6 }, () => maybeOk);
      }
      return Array.from({ length: 6 }, () => placeholderSrc);
    }

    const out = [];
    for (let i = 0; i < 6; i++) {
      out.push(valid[i % valid.length]);
    }
    return out;
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get(`${API_ROOT}/products/${id}/`);
        if (cancelled) return;
        const p = res.data;
        setProduct(p);

        try {
          const finalImages = await buildSixImages(p);
          if (!cancelled) {
            setImages(finalImages);
            setSelectedImageIndex((prev) => (prev >= finalImages.length ? 0 : prev));
            console.log("finalImages:", finalImages);
          }
        } catch (err) {
          console.error("Error building images:", err);
          if (!cancelled) {
            setImages(Array.from({ length: 6 }, () => placeholderSrc));
            setSelectedImageIndex(0);
          }
        }

        if ((!location?.state || !location.state.size) && p.sizes && p.sizes.length > 0) {
          const first = p.sizes[0].label ?? p.sizes[0].id ?? p.sizes[0];
          setSize(first);
        }

        if ((!location?.state || !location.state.color) && p.colors && p.colors.length > 0) {
          const firstColor = p.colors[0];
          const colorValue = typeof firstColor === "string" ? firstColor : (firstColor.hex ?? firstColor.value ?? firstColor.name ?? "");
          setSelectedColor({ raw: firstColor, value: colorValue, label: (firstColor.name ?? colorValue) });
        } else if (location?.state?.color) {
        }
      } catch (err) {
        console.error("Failed to load product", err);
        if (!cancelled) setMessage("Failed to load product.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, API_ROOT, location, placeholderSrc]);

  useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      setCheckingAuth(true);
      try {
        const res = await axios.get(`${API_ROOT}/auth/me/`);
        if (!mounted) return;
        setUser(res?.data ?? null);
      } catch (err) {
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };
    fetchMe();

    const onAuthUpdated = () => {
      fetchMe();
      const payload = pendingBuyRef.current;
      if (authModalOpen && payload) {
        setAuthModalOpen(false);
        pendingBuyRef.current = null;
        navigate("/checkout", { state: { fromBuyNow: true, item: payload } });
      }
    };

    window.addEventListener("authUpdated", onAuthUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("authUpdated", onAuthUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_ROOT, authModalOpen]);

  const sizeOptions = useMemo(() => {
    if (!product?.sizes || product.sizes.length === 0) return [];
    return product.sizes.map((s) => {
      if (typeof s === "string" || typeof s === "number") return { id: s, label: String(s) };
      return { id: s.id ?? s.label ?? String(s), label: s.label ?? s.name ?? String(s.id) };
    });
  }, [product]);

  // When a user clicks a color swatch, update selectedColor state
  const onSelectColor = (c) => {
    if (!c) return;
    const value = typeof c === "string" ? c : (c.hex ?? c.value ?? "");
    const label = typeof c === "string" ? c : (c.name ?? value);
    setSelectedColor({ raw: c, value, label });
  };

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
      // Note: cartService.addItem signature preserved (productId, qty, size)
      await cartService.addItem(product.id, Number(qty), size || "");
      try {
        // dispatch cart update; include color info in detail if consumers want it
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { color: selectedColor?.value ?? null } }));
      } catch (e) {}
      setMessage("Added to cart.");
    } catch (err) {
      console.error("Add to cart error", err);
      setMessage("Could not add to cart.");
    } finally {
      setAdding(false);
    }
  }

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

    const itemPayload = {
      product_id: product.id,
      quantity: Number(qty),
      size: size || "",
      color: selectedColor?.value ?? null, // include color so checkout can pick it up
    };

    if (!user) {
      pendingBuyRef.current = itemPayload;
      setInfoModalOpen(true);
      return;
    }

    navigate("/checkout", {
      state: {
        fromBuyNow: true,
        item: itemPayload,
      },
    });
  }

  function onInfoContinue() {
    setInfoModalOpen(false);
    setAuthModalOpen(true);
    navigate("/auth", { state: { modal: true } });
  }

  function closeAuthModal() {
    setAuthModalOpen(false);
    pendingBuyRef.current = null;
    try {
      navigate(-1);
    } catch (e) {
      navigate(`/products/${id}`);
    }
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div>Loading product…</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          <div className="grid grid-cols-2 grid-rows-3 gap-4">
            {images.map((src, i) => {
              const isPlaceholder = !src || src === placeholderSrc;
              const isSelected = i === selectedImageIndex;
              return (
                <button
                  key={`thumb-${i}-${src ? src.slice(0, 20) : "ph"}`}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative overflow-hidden rounded-lg `}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={src || placeholderSrc}
                    alt={`${product.title} image ${i + 1}`}
                    className="w-full h-40 md:h-56 object-contain bg-gray-50"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholderSrc;
                    }}
                  />

                  {isPlaceholder && (
                    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                      <div className="bg-white/80 text-xs text-red-600 px-2 py-1 rounded-t">
                        placeholder
                      </div>
                    </div>
                  )}
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

          {/* Colors: interactive swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium">Color</div>
              <div className="flex items-center gap-3 mt-2">
                {product.colors.map((c, idx) => {
                  const raw = c;
                  const value = typeof c === "string" ? c : (c.hex ?? c.value ?? "");
                  const label = typeof c === "string" ? c : (c.name ?? value);
                  const isSel = selectedColor && (selectedColor.value === value || selectedColor.label === label);

                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectColor(raw)}
                      title={label}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center focus:outline-none `}
                      aria-pressed={isSel}
                      style={{ backgroundColor: value || "transparent" }}
                    >
                      {/* if swatch is empty (string empty), show small border dot */}
                      {!value && <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shoe Size buttons */}
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

          {/* NEW: Selected summary row (color swatch + color label + size) shown above Quantity */}
          <div className="mt-4">
            <div className="text-sm font-medium">Selected</div>
            <div className="flex items-center gap-3 mt-2 text-sm">
              {/* show selected color swatch and label */}
              {selectedColor ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: selectedColor.value || "transparent" }}
                    title={selectedColor.label}
                  />
                  <span className="text-gray-700">{selectedColor.label}</span>
                </div>
              ) : (
                <div className="text-gray-500">No color selected</div>
              )}

              <span className="text-gray-400">•</span>

              {/* show selected size */}
              <div>
                {size ? <span className="text-gray-700">Size: {size}</span> : <span className="text-gray-500">No size selected</span>}
              </div>
            </div>
          </div>

          {/* Quantity controls (now below Selected summary) */}
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

            <button
              onClick={handleBuyNow}
              className="w-full px-4 py-3 rounded bg-[#3b5f5f] text-white flex items-center justify-center"
              aria-label="Buy now and go to checkout"
            >
              <span className="font-medium">Buy Now</span>

              <span className="relative w-28 h-8 flex-shrink-0" aria-hidden="true" role="img" aria-label="Payment options">
                {[phonepe, gpay, paytm].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className="ml-4 w-8 h-8 object-contain"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${i * 18}px`,
                      zIndex: 20 + i,
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

      <div className="mt-10">
        <Reviews />
      </div>

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        onContinue={onInfoContinue}
        message="You will be asked to log in to complete checkout."
      />

      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/50">
          <div className="w-full max-w-3xl bg-transparent p-4">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-end p-3">
                <button
                  onClick={closeAuthModal}
                  className="text-gray-600 px-3 py-1 rounded hover:bg-gray-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <AuthPage />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
