import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='100%25' height='100%25' fill='%23efefef'/%3E%3C/svg%3E";

const makeAbsolute = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/\//.test(url)) return `https:${url}`;
  if (url.startsWith("/")) return (API_URL || "") + url;
  return url;
};

// helper to fetch a single product by id (returns null on error)
const fetchProductById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/products/${id}/`, { timeout: 10000 });
    return res.data || null;
  } catch (err) {
    console.warn(`Failed to fetch product ${id}`, err);
    return null;
  }
};

export default function Offers() {
  // Row 1: womens picks (1,5,6,9 => zero indices 0,4,5,8 from a womens list)
  const WOMENS_INDICES = [0, 2, 3, 7];

  // Row 2: kids explicit ids
  const KIDS_IDS = [102, 110, 108, 109];

  // Row 3: mens explicit ids
  const MENS_IDS = [52, 55, 57, 59];

  const [womens, setWomens] = useState([]); // products selected from womens list
  const [kids, setKids] = useState([]); // fetched by ids
  const [mens, setMens] = useState([]); // fetched by ids
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1) fetch first 12 womens products (like earlier)
        const womensRes = await axios.get(`${API_URL}/products/`, {
          params: { category: "womens", limit: 12 },
          timeout: 10000,
        });
        const womensItems = Array.isArray(womensRes.data?.results)
          ? womensRes.data.results
          : [];

        const pickedWomens = WOMENS_INDICES.map((i) => womensItems[i]).filter(Boolean);

        // normalize (image candidate)
        const normW = pickedWomens.map((p) => {
          const img =
            p?.image ||
            (Array.isArray(p?.images) && (p.images[0]?.image || p.images[0]?.url)) ||
            p?.image_url ||
            p?.thumbnail ||
            "";
          return { ...p, __imageSrc: makeAbsolute(img) || PLACEHOLDER };
        });

        // 2) fetch kids products by id (parallel)
        const kidsPromises = KIDS_IDS.map((id) => fetchProductById(id));
        const kidsResults = await Promise.all(kidsPromises);
        const normalizedKids = kidsResults
          .filter(Boolean)
          .map((p) => {
            const img =
              p?.image ||
              (Array.isArray(p?.images) && (p.images[0]?.image || p.images[0]?.url)) ||
              p?.image_url ||
              p?.thumbnail ||
              "";
            return { ...p, __imageSrc: makeAbsolute(img) || PLACEHOLDER };
          });

        // 3) fetch mens products by id (parallel) - may be used after expand
        const mensPromises = MENS_IDS.map((id) => fetchProductById(id));
        const mensResults = await Promise.all(mensPromises);
        const normalizedMens = mensResults
          .filter(Boolean)
          .map((p) => {
            const img =
              p?.image ||
              (Array.isArray(p?.images) && (p.images[0]?.image || p.images[0]?.url)) ||
              p?.image_url ||
              p?.thumbnail ||
              "";
            return { ...p, __imageSrc: makeAbsolute(img) || PLACEHOLDER };
          });

        if (!cancelled) {
          setWomens(normW);
          setKids(normalizedKids);
          setMens(normalizedMens);
        }
      } catch (err) {
        console.error("NewTrending: failed to fetch products", err);
        if (!cancelled) {
          // keep whatever succeeded and empty arrays for failures
          setWomens((s) => s);
          setKids((s) => s);
          setMens((s) => s);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER;
  };

  const renderCard = (p) => {
    if (!p) return null;
    return (
      <Link
        key={p.id}
        to={`/product/${p.id}`}
        className="group block text-center"
        aria-label={`View ${p.title}`}
      >
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          <img
            src={p.__imageSrc || PLACEHOLDER}
            alt={p.title || "product"}
            className="w-full h-70 object-contain bg-white"
            loading="lazy"
            onError={handleImgError}
          />
        </div>

        <div className="mt-4">
          <h3 className="text-lg md:text-xl font-medium leading-tight text-gray-800">
            {p.title}
          </h3>
          <div className="mt-2 text-base text-gray-700">MRP : ₹ {p.price}</div>
        </div>
      </Link>
    );
  };

  // Compose rows
  const row1 = womens;
  const row2 = kids;
  const row3 = mens;

  return (
    <section className="max-w-6xl mx-auto px-6 py-14 relative">
      <h2 className="text-3xl font-serif text-center mb-8">Offers</h2>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Grid: 4 columns - each row is conceptually 4 items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {row1.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No items</div>
            ) : (
              row1.map((p) => renderCard(p))
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {row2.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No items</div>
            ) : (
              row2.map((p) => renderCard(p))
            )}
          </div>

          {/* row3 hidden by default; shown when expanded */}
          {expanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {row3.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No items</div>
              ) : (
                row3.map((p) => renderCard(p))
              )}
            </div>
          )}

          {/* View all button aligned right-bottom of section */}
          <div className="flex justify-end">
            <button
              onClick={() => setExpanded((s) => !s)}
              className="px-4 py-2 rounded bg-[#2F4F4F] text-white hover:bg-[#2F4000] transition"
              aria-expanded={expanded}
            >
              {expanded ? "View less" : "View all"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
