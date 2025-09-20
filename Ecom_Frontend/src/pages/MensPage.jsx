
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import FiltersPanel from "../components/FiltersPanel";
import ProductCard from "../components/ProductCard";
import cartService from "../api/cartService";

const API_ROOT =
  typeof import.meta !== "undefined" ? import.meta.env.VITE_API_URL || "https://django-4hm5.onrender.com/api" : "";

export default function MensPage() {
  const PAGE_SIZE = 12;

  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [filterSets, setFilterSets] = useState({
    style: [],
    size: [],
    brands: [],
    color: [],
  });
  const [applied, setApplied] = useState({
    style: null,
    size: null,
    brands: null,
    color: null,
  });

  const [sortBy, setSortBy] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // CART state: server-side cart preview (cartService is source of truth)
  const [cartId, setCartId] = useState(null);
  const [cartPreview, setCartPreview] = useState({ items: [], total: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const normalizedApi = useMemo(() => API_ROOT.replace(/\/+$/, ""), []);

  // ----- Sorting helpers -----
  const toNumber = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const sortProducts = useCallback((list, mode) => {
    if (!Array.isArray(list)) return [];
    const arr = [...list];

    switch (mode) {
      case "new":
        arr.sort((a, b) => {
          const aCreated = a.created ? Date.parse(a.created) : null;
          const bCreated = b.created ? Date.parse(b.created) : null;
          if (aCreated && bCreated) return bCreated - aCreated;
          if (aCreated && !bCreated) return -1;
          if (!aCreated && bCreated) return 1;
          return (b.id || 0) - (a.id || 0);
        });
        return arr;

      case "price_asc":
        arr.sort((a, b) => toNumber(a.price) - toNumber(b.price));
        return arr;

      case "price_desc":
        arr.sort((a, b) => toNumber(b.price) - toNumber(a.price));
        return arr;

      case "rating":
        arr.sort((a, b) => toNumber(b.rating) - toNumber(a.rating));
        return arr;

      case "featured":
      default:
        return arr;
    }
  }, []);

  // ----- Build query params -----
  const buildParams = useCallback(
    (useOffset = 0) => {
      const params = {
        category: "mens",
        limit: PAGE_SIZE,
        offset: useOffset,
      };

      if (applied.style) params.style = applied.style;
      if (applied.brands) params.brands = applied.brands;
      if (applied.color) params.color = applied.color;
      if (applied.size) params.size = applied.size;

      switch (sortBy) {
        case "new":
          params.ordering = "-created";
          break;
        case "price_asc":
          params.ordering = "price";
          break;
        case "price_desc":
          params.ordering = "-price";
          break;
        case "rating":
          params.ordering = "-rating";
          break;
        default:
          break;
      }

      return params;
    },
    [applied, sortBy]
  );

  // ----- Fetch filters -----
  const fetchFilters = useCallback(async () => {
    try {
      setError(null);
      const url = `${normalizedApi}/filters/`;
      const res = await axios.get(url, {
        params: { category: "mens" },
        timeout: 10000,
      });
      if (res?.data) {
        setFilterSets({
          style: res.data.style || [],
          size: res.data.size || [],
          brands: res.data.brands || [],
          color: res.data.color || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch filters", err);
      setError("Failed to fetch filters.");
    }
  }, [normalizedApi]);

  // ----- Fetch products -----
  const fetchProducts = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setOffset(0);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params = buildParams(reset ? 0 : offset + PAGE_SIZE);
        const url = `${normalizedApi}/products/`;

        const res = await axios.get(url, { params, timeout: 10000 });
        const data = res.data || {};
        const list = data.results || data || [];

        if (reset) {
          const sorted = sortProducts(list, sortBy);
          setProducts(sorted);
          setCount(data.count || sorted.length);
          setOffset(0);
        } else {
          setProducts((prev) => {
            const combined = [...prev, ...list];
            const sortedCombined = sortProducts(combined, sortBy);
            const seen = new Set();
            const deduped = sortedCombined.filter((p) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
            return deduped;
          });
          setCount(data.count || products.length + list.length);
          setOffset((o) => o + PAGE_SIZE);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Failed to fetch products.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [normalizedApi, buildParams, offset, products.length, sortBy, sortProducts]
  );

  // ----- Effects for products/filters -----
  useEffect(() => {
    fetchFilters();
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts(true);
  }, [applied, sortBy]);

  useEffect(() => {
    setProducts((prev) => sortProducts(prev, sortBy));
  }, [sortBy, sortProducts]);

  // ----- CART functions using cartService -----

  // Refresh local preview from server cart
  const fetchCartPreview = useCallback(async () => {
    try {
      setCartLoading(true);
      const cart = await cartService.getCart(); // cartService will create/get as needed
      if (!cart) {
        setCartId(null);
        setCartPreview({ items: [], total: 0 });
        return null;
      }
      setCartId(cart.id ?? null);
      const items = Array.isArray(cart.items) ? cart.items : [];
      const total = items.reduce(
        (s, it) => s + (it.line_total ?? ((it.quantity || 0) * (it.product?.price || 0))),
        0
      );
      setCartPreview({ items, total });
      return cart;
    } catch (err) {
      console.error("fetchCartPreview failed", err);
      setCartId(null);
      setCartPreview({ items: [], total: 0 });
      return null;
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Add item to cart: uses cartService.addItem (which will create cart if needed)
  const addItemToCart = useCallback(
    async ({ productId, quantity = 1, size = "" }) => {
      setError(null);
      try {
        setCartLoading(true);
        await cartService.addItem(productId, quantity, size);
        await fetchCartPreview();
        return true;
      } catch (err) {
        console.error("Failed to add item to cart", err);
        setError("Failed to add item to cart.");
        return false;
      } finally {
        setCartLoading(false);
      }
    },
    [fetchCartPreview]
  );

  // Update entire cart items (sync) via cartService.updateCart
  // items should be array of { productId, quantity, size }
  const updateCart = useCallback(
    async (items = []) => {
      try {
        setCartLoading(true);
        // get or create cart
        let cart = await cartService.getCart();
        if (!cart || !cart.id) {
          // create an empty cart
          const create = await cartService.createCart ? await cartService.createCart({ items: [] }) : null;
          if (create && create.id) {
            cart = create;
          } else {
            // fallback: call API directly (least desirable)
            const createdRes = await axios.post(`${normalizedApi}/cart/`, { items: [] });
            cart = createdRes.data;
          }
        }
        const id = cart?.id;
        if (!id) throw new Error("Could not obtain cart id to update");

        const payload = {
          items: items.map((it) => ({ product_id: it.productId, quantity: it.quantity, size: it.size || "" })),
          replace: true,
        };

        await cartService.updateCart(id, payload);
        await fetchCartPreview();
      } catch (err) {
        console.error("Failed to update cart", err);
        setError("Failed to update cart.");
      } finally {
        setCartLoading(false);
      }
    },
    [fetchCartPreview, normalizedApi]
  );

  // Remove a single cart item by fetching current cart and rewriting without that item
  const removeItemFromCart = useCallback(
    async (productId, size = "") => {
      try {
        setCartLoading(true);
        const cart = await cartService.getCart();
        if (!cart || !cart.items) return;
        const remaining = cart.items.filter(
          (it) => !(it.product?.id === productId && (it.size || "") === (size || ""))
        );
        const payloadItems = remaining.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
          size: it.size || "",
        }));
        // update server cart to remaining items (replace)
        await cartService.updateCart(cart.id, { items: payloadItems, replace: true });
        await fetchCartPreview();
      } catch (err) {
        console.error("Failed to remove item from cart", err);
        setError("Failed to remove item.");
      } finally {
        setCartLoading(false);
      }
    },
    [fetchCartPreview]
  );

  // Attempt to load cart preview on mount
  useEffect(() => {
    fetchCartPreview();
  }, [fetchCartPreview]);

  // ----- Event handlers for filters and UI -----
  const handleApply = (key, value) => {
    setApplied((s) => ({ ...s, [key]: s[key] === value ? null : value }));
  };

  const handleLoadMore = async () => {
    if (products.length >= count) return;
    await fetchProducts(false);
  };

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "new", label: "New Arrivals" },
    { value: "price_asc", label: "Price: Low - High" },
    { value: "price_desc", label: "Price: High - Low" },
    { value: "rating", label: "Overall Rating" },
  ];

  // ----- Render -----
  return (
    <div>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1">
            <div className="bg-white flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50"
                aria-expanded={showFilters}
                aria-pressed={showFilters}
              >
                <span className="text-lg font-serif">Filters</span>
                <span className="text-lg">{showFilters ? "←" : "→"}</span>
              </button>

              <div className="text-sm text-gray-600">
                {Object.entries(applied)
                  .filter(([, v]) => v)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" • ") || ""}
              </div>

              <div
                className={`transition-opacity duration-300 ${
                  showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={!showFilters}
              >
                <FiltersPanel filterSets={filterSets} applied={applied} onApply={handleApply} />
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-48">
            <button
              onClick={() => setSortOpen((s) => !s)}
              className="w-full bg-[#475b57] text-white p-4 rounded-md text-center"
            >
              Sort by ▾
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-2 w-full border rounded-md bg-white shadow-lg z-10">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${
                      sortBy === opt.value ? "bg-gray-100 font-semibold text-green-700" : "hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="mt-8">
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                // pass cart handlers to ProductCard so its Add to Cart uses server-side API
                onAddToCart={async (payload) => {
                  // ProductCard might send { productId, qty, size } or { productId, quantity, size }
                  const productId = payload.productId ?? payload.product_id ?? p.id;
                  const quantity = payload.qty ?? payload.quantity ?? 1;
                  const size = payload.size ?? "";
                  await addItemToCart({ productId, quantity, size });
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            {loading ? (
              <div className="px-4 py-2 rounded bg-gray-200">Loading...</div>
            ) : products.length < count ? (
              <button onClick={handleLoadMore} className="px-4 py-2 rounded bg-green-700 text-white" disabled={loadingMore}>
                {loadingMore ? "Loading..." : "View more"}
              </button>
            ) : (
              <div className="px-4 py-2 rounded bg-gray-100 text-gray-500">No more items</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

