// src/api/cartService.js
import axios from "axios";

const RAW_API = typeof import.meta !== "undefined" ? import.meta.env.VITE_API_URL : "";
const API_ROOT = (RAW_API || "https://django-4hm5.onrender.com/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

/** Read CSRF token from cookie (Django) */
function getCsrfToken() {
  try {
    const name = "csrftoken=";
    const cookie = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(name));
    if (!cookie) return null;
    return decodeURIComponent(cookie.substring(name.length));
  } catch (e) {
    return null;
  }
}

/**
 * Auto-inject CSRF header for unsafe HTTP methods if token present.
 * This keeps callers simpler so they don't need to pass headers manually.
 */
api.interceptors.request.use((config) => {
  const method = (config.method || "").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers["X-CSRFToken"] = token;
    }
  }
  return config;
}, (err) => Promise.reject(err));

function notifyUpdated() {
  try {
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  } catch (e) {
    // ignore
  }
}

function detectHtml(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim().slice(0, 200).toLowerCase();
  if (s.startsWith("<!doctype") || s.includes("<html")) return str;
  return null;
}

async function safeLogResponse(err, label = "response") {
  try {
    const resp = err?.response;
    console.error(`[cartService] ${label} status:`, resp?.status);
    console.error(`[cartService] ${label} url:`, resp?.config?.url);
    console.error(`[cartService] ${label} headers:`, resp?.headers);
    const body = resp?.data;
    if (typeof body === "string") {
      console.error(`[cartService] ${label} body (snippet):`, body.slice(0, 1200));
    } else {
      console.error(`[cartService] ${label} data:`, body);
    }
  } catch (e) {
    console.error("[cartService] safeLogResponse failed", e);
  }
}

/** Try GET candidates for cart endpoints */
async function tryGetCandidates(candidates = ["/cart/my/", "/cart/my", "/cart/", "/cart"]) {
  let lastErr = null;
  for (const path of candidates) {
    try {
      const res = await api.get(path);
      const data = res?.data;
      if (Array.isArray(data)) return data[0] || { items: [] };
      return data || { items: [] };
    } catch (err) {
      lastErr = err;
      const html = detectHtml(err?.response?.data);
      if (html) {
        const e = new Error("HTML debug page returned while GET " + path);
        e.serverHtml = html;
        throw e;
      }
      const status = err?.response?.status;
      if (status === 401 || status === 403) throw err;
      // continue trying next candidate
    }
  }
  throw lastErr;
}

/** Create empty cart */
export async function createCart() {
  try {
    const res = await api.post("/cart/", { items: [] });
    return res.data || { items: [] };
  } catch (err) {
    await safeLogResponse(err, "createCart");
    const html = detectHtml(err?.response?.data) || err?.serverHtml;
    const e = new Error("createCart failed");
    e.server = err?.response?.data || err?.message || err;
    if (html) e.serverHtml = html;
    throw e;
  }
}

/** Get or create cart */
export async function getCart() {
  try {
    const cart = await tryGetCandidates();
    return cart;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) throw err;
    if (err?.serverHtml) throw err;
    try {
      const created = await createCart();
      return created;
    } catch (createErr) {
      throw createErr;
    }
  }
}

/** convenience: return cart id or null */
export async function getCartId() {
  const cart = await getCart();
  return cart?.id ?? null;
}

/** Merge items helper */
function mergeItems(existingItems = [], incoming = { product_id: null, quantity: 1, size: "" }) {
  const normalized = [];
  const map = new Map();
  for (const it of existingItems || []) {
    const pid = it.product?.id ?? it.product_id;
    if (!pid) continue;
    const key = `${pid}_${(it.size || "")}`;
    map.set(key, { product_id: pid, quantity: Number(it.quantity || 0), size: it.size || "" });
  }
  const inKey = `${incoming.product_id}_${incoming.size || ""}`;
  if (map.has(inKey)) {
    map.get(inKey).quantity = Number(map.get(inKey).quantity || 0) + Number(incoming.quantity || 0);
  } else {
    map.set(inKey, { product_id: incoming.product_id, quantity: Number(incoming.quantity || 0), size: incoming.size || "" });
  }
  for (const v of map.values()) normalized.push(v);
  return normalized;
}

/** updateCart wrapper */
export async function updateCart(cartId = null, payload = { items: [], replace: false }) {
  try {
    let id = cartId;
    if (!id) {
      const cart = await getCart();
      id = cart?.id;
      if (!id) throw new Error("No cart id available");
    }
    try {
      const res = await api.put(`/cart/${id}/`, payload);
      notifyUpdated();
      return res.data;
    } catch (putErr) {
      await safeLogResponse(putErr, "updateCart.PUT");
      const status = putErr?.response?.status;
      if ([405, 400, 404].includes(status)) {
        const res2 = await api.patch(`/cart/${id}/`, payload);
        notifyUpdated();
        return res2.data;
      }
      throw putErr;
    }
  } catch (err) {
    console.error("[cartService] updateCart final error", err);
    throw err;
  }
}

/**
 * addItem
 */
export async function addItem(productId, quantity = 1, size = "") {
  try {
    let cart = await getCart();
    if (!cart || !cart.id) {
      cart = await createCart();
    }
    const cartId = cart.id;
    if (!cartId) throw new Error("No cart id available");

    const paths = [
      `/cart/${cartId}/add_item/`,
      `/cart/${cartId}/add_item`,
      `/cart/add_item/`,
      `/cart/add_item`,
    ];

    let lastErr = null;
    for (const p of paths) {
      try {
        const res = await api.post(p, { product_id: productId, quantity, size });
        notifyUpdated();
        return res.data;
      } catch (err) {
        lastErr = err;
        await safeLogResponse(err, `addItem.try:${p}`);
        const html = detectHtml(err?.response?.data);
        if (html) {
          const e = new Error("server returned HTML debug page during add_item");
          e.serverHtml = html;
          throw e;
        }
        const status = err?.response?.status;
        if (status === 401 || status === 403) throw err;
      }
    }

    // fallback: merge+replace
    const latest = await getCart();
    const merged = mergeItems(latest.items || [], { product_id: productId, quantity, size });
    const updated = await updateCart(latest.id, { items: merged, replace: true });
    notifyUpdated();
    return updated;
  } catch (err) {
    console.error("[cartService] addItem final error", err);
    if (err?.serverHtml) {
      console.error("[cartService] server HTML snippet:", err.serverHtml.slice(0, 800));
    }
    throw err;
  }
}

/**
 * removeItem:
 * Preferred usage: pass cartItemId to delete the specific row.
 * Fallback: pass productId (+ optional size) to remove all matching rows.
 */
export async function removeItem({ cartId = null, cart = null, cartItemId = null, productId = null, size = "" } = {}) {
  try {
    // ensure we have cart object & id
    let current = cart;
    if (!current) {
      current = await getCart();
    }
    const id = cartId || current?.id;
    if (!id) throw new Error("No cart id to remove from");

    // 1) If cartItemId provided: attempt DELETE /cart-items/<id>/
    if (cartItemId != null) {
      const deleteCandidates = [
        `/cart-items/${cartItemId}/`,
        `/cart-items/${cartItemId}`,
      ];
      for (const p of deleteCandidates) {
        try {
          const res = await api.delete(p);
          if (res?.data && (res.data.items || res.data.items === [])) {
            notifyUpdated();
            return res.data;
          }
          const latest = await getCart();
          notifyUpdated();
          return latest;
        } catch (err) {
          await safeLogResponse(err, `removeItem.tryDelete:${p}`);
          const html = detectHtml(err?.response?.data);
          if (html) {
            console.warn("[cartService] removeItem DELETE returned HTML; will try fallback endpoints.");
          } else {
            const status = err?.response?.status;
            if (status === 401 || status === 403) throw err;
            // continue to next candidate
          }
        }
      }
    }

    // 2) Try cart-level remove_item detail action (preferred fallback)
    const postCandidates = [
      `/cart/${id}/remove_item/`,
      `/cart/${id}/remove_item`,
      `/cart/remove_item/`,
      `/cart/remove_item`,
    ];
    const payloadById = cartItemId != null ? { cartItemId } : null;
    const payloadByProduct = (productId != null) ? { productId, size } : null;

    for (const p of postCandidates) {
      try {
        const payload = payloadById || payloadByProduct || {};
        const res = await api.post(p, payload);
        notifyUpdated();
        return res.data;
      } catch (err) {
        await safeLogResponse(err, `removeItem.tryPost:${p}`);
        const html = detectHtml(err?.response?.data);
        if (html) {
          console.warn("[cartService] removeItem POST returned HTML; trying other fallbacks.");
        } else {
          const status = err?.response?.status;
          if (status === 401 || status === 403) throw err;
        }
      }
    }

    // 3) Final fallback: perform client-side filtering and updateCart replace
    const latest = await getCart();
    const targetPidStr = productId == null ? null : String(productId);
    const targetSize = (size || "").toString();

    let itemsPayload;
    if (cartItemId != null) {
      itemsPayload = (latest.items || []).filter(ci => String(ci.id) !== String(cartItemId)).map(ci => ({
        product_id: ci.product?.id ?? ci.product_id,
        quantity: Number(ci.quantity || ci.qty || 1),
        size: ci.size || "",
      }));
    } else if (productId != null) {
      itemsPayload = (latest.items || []).filter(ci => {
        const ciPid = ci.product?.id ?? ci.product_id ?? null;
        if (ciPid == null) return true;
        const ciPidStr = String(ciPid);
        const ciSize = (ci.size || "").toString();
        return !(ciPidStr === targetPidStr && ciSize === targetSize);
      }).map(ci => ({
        product_id: ci.product?.id ?? ci.product_id,
        quantity: Number(ci.quantity || ci.qty || 1),
        size: ci.size || "",
      }));
    } else {
      throw new Error("removeItem requires either cartItemId or productId");
    }

    const updated = await updateCart(latest.id, { items: itemsPayload, replace: true });
    notifyUpdated();
    return updated;
  } catch (err) {
    await safeLogResponse(err, "removeItem");
    const server = err?.response?.data || err?.message || err;
    const e = new Error("removeItem failed: " + JSON.stringify(server));
    e.server = server;
    throw e;
  }
}

export default {
  api,
  getCart,
  getCartId,
  createCart,
  addItem,
  updateCart,
  removeItem,
};

