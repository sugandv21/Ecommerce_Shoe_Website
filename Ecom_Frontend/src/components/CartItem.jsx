import React, { useState, useEffect, useRef } from "react";

export default function CartItem({
  product = {},
  quantity = 1,
  size = "",
  onRemove = () => {},    // onRemove(productId, size)
  onQtyChange = () => {}, // onQtyChange(productId, qty, size)
  onSizeChange = () => {},// onSizeChange(productId, size)
  placeholder = null,
  maxQty = 99,
}) {
  const envPlaceholder =
    (typeof import.meta !== "undefined" && import.meta.env.VITE_PLACEHOLDER_IMAGE) ||
    null;
  const placeholderImg = placeholder || envPlaceholder || "/placeholder.png";

  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const initialImageUrl = firstImage?.url || firstImage?.image || placeholderImg;
  const initialAlt = firstImage?.alt_text || product.title || "product";

  const [imgSrc, setImgSrc] = useState(initialImageUrl);
  const [selectedSize, setSelectedSize] = useState(size || "");
  const [qty, setQty] = useState(Number.isNaN(Number(quantity)) ? 1 : Number(quantity));
  const qtyTimeout = useRef(null);

  useEffect(() => {
    setImgSrc(firstImage?.url || firstImage?.image || placeholderImg);
  }, [firstImage, placeholderImg]);

  useEffect(() => setSelectedSize(size || ""), [size]);
  useEffect(() => setQty(Number.isNaN(Number(quantity)) ? 1 : Number(quantity)), [quantity]);

  function handleImgError() {
    if (imgSrc !== placeholderImg) setImgSrc(placeholderImg);
  }

  function triggerQtyChange(nextQty) {
    if (qtyTimeout.current) clearTimeout(qtyTimeout.current);
    qtyTimeout.current = setTimeout(() => {
      try { onQtyChange(product.id, nextQty, selectedSize || ""); }
      catch (e) { console.error(e); }
    }, 200);
  }

  function handleQtySelect(e) {
    const val = Math.max(1, Math.min(maxQty, Number(e.target.value) || 1));
    setQty(val);
    triggerQtyChange(val);
  }

  function handleSizeChange(e) {
    const val = e.target.value;
    setSelectedSize(val);
    try { onSizeChange(product.id, val); } catch (e) { console.error(e); }
  }

  function handleRemoveClick() {
    try { onRemove(product.id, selectedSize || ""); } catch (e) { console.error(e); }
  }

  // Normalize size options to an array of { id, label }
  const sizeOptions = (product.sizes && product.sizes.length > 0)
    ? product.sizes.map(s => {
        if (typeof s === "string" || typeof s === "number") return { id: s, label: String(s) };
        const label = s.label ?? s.name ?? s.size ?? s.value ?? s.label_text ?? "";
        return { id: s.id ?? label ?? JSON.stringify(s), label: String(label) };
      })
    : [{ id: "41", label: "41" }, { id: "42", label: "42" }, { id: "43", label: "43" }];

  const stableId = product.id ? `size-select-${product.id}` : `size-select-${Math.floor(Math.random()*1e9)}`;

  const formatINR = (val = 0) =>
    typeof val === "number" ? new Intl.NumberFormat("en-IN").format(val) : val;

  const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name;

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <div className="flex items-start gap-4 py-5 border-b border-gray-300">
        <div className="w-28 h-28 flex-shrink-0 rounded overflow-hidden border">
          <img src={imgSrc} alt={initialAlt} onError={handleImgError} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm text-gray-600">{brandName || "Lilley"}</div>
            <div className="text-lg font-serif font-semibold">{product.title || "Drew Womens Diamante Slip Shoe"}</div>
            <div className="mt-1 text-sm">
              MRP <span className="font-medium">&#8377; {formatINR(product.price ?? 3799)}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-sm">
                <select
                  id={stableId}
                  className="w-full border px-3 py-2 rounded text-sm"
                  value={selectedSize}
                  onChange={handleSizeChange}
                >
                  <option value="">Size (41)</option>
                  {sizeOptions.map(opt => (
                    <option key={opt.id} value={opt.label ?? opt.id}>{opt.label ?? opt.id}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <select
                  value={qty}
                  onChange={handleQtySelect}
                  className="w-full border px-3 py-2 rounded text-sm"
                  aria-label="Select quantity"
                >
                  {Array.from({ length: Math.min(10, maxQty) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  {maxQty > 10 && <option value={maxQty}>{maxQty}+</option>}
                </select>
              </label>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={handleRemoveClick}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded hover:bg-gray-50"
              type="button"
              aria-label={`Remove ${product.title || "item"}`}
            >
              <span>Remove</span>
              <span className="text-base">🗑</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
