// src/components/Navbar.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import cartImg from "../assets/images/cart.png";
import cartService from "../api/cartService";

export default function Navbar({ cartCount: cartCountProp = null }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null); // { id, username, email } or null
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const apiRoot =
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_API_URL : "") ||
    "http://127.0.0.1:8000/api";

  // helper to compute total quantity
  const computeCountFromCart = useCallback((cartData) => {
    if (!cartData || !Array.isArray(cartData.items)) return 0;
    return cartData.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, []);

  // fetch logo once
  useEffect(() => {
    let mounted = true;
    const api = cartService.api;

    api
      .get("/navbar/")
      .then((res) => {
        if (!mounted) return;
        const data = res.data || {};
        if (data.logo) {
          const logo =
            typeof data.logo === "string" && data.logo.startsWith("http")
              ? data.logo
              : `${apiRoot.replace(/\/api\/?$/, "")}${data.logo}`;
          setLogoUrl(logo);
        }
      })
      .catch((err) => {
        // non-fatal
        // eslint-disable-next-line no-console
        console.warn("Navbar: failed to fetch logo", err?.response?.data || err.message || err);
      });

    return () => {
      mounted = false;
    };
  }, [apiRoot]);

  // refresh cart count (uses cartService.getCart so it respects session/token)
  const refreshCartCount = useCallback(async () => {
    try {
      const cart = await cartService.getCart();
      const cnt = computeCountFromCart(cart);
      setCartCount(cnt);
    } catch (err) {
      // on error, show zero (don't break UI)
      // eslint-disable-next-line no-console
      console.warn("Navbar: failed to fetch cart count", err?.response?.data || err.message || err);
      setCartCount(0);
    }
  }, [computeCountFromCart]);

  // get current user info from backend (optional endpoint /auth/me/)
  const fetchCurrentUser = useCallback(async () => {
    try {
      // prefer using cartService.api (axios instance) so CSRF / credentials are included
      const api = cartService.api;
      // Backend endpoint expected: GET /api/auth/me/ -> { id, username, email }
      const res = await api.get("/auth/me/");
      if (res?.data) {
        setUser(res.data);
        return;
      }
    } catch (err) {
      // many backends won't have /auth/me/ — do nothing and remain anonymous
      // eslint-disable-next-line no-console
      // console.info("Navbar: /auth/me/ not available or user not authenticated", err?.response?.status);
      setUser(null);
    }
  }, []);

  // initial load and listeners
  useEffect(() => {
    if (typeof cartCountProp === "number") {
      setCartCount(cartCountProp);
    } else {
      refreshCartCount();
    }

    // Try to fetch current user (if backend supports endpoint)
    fetchCurrentUser();

    // listen to events dispatched by login/logout or cartService
    const onCartUpdated = () => {
      refreshCartCount();
    };
    const onAuthUpdated = (ev) => {
      // optional payload: ev.detail might contain user object
      if (ev?.detail) setUser(ev.detail);
      else fetchCurrentUser();
    };

    window.addEventListener("cartUpdated", onCartUpdated);
    window.addEventListener("authUpdated", onAuthUpdated);

    return () => {
      window.removeEventListener("cartUpdated", onCartUpdated);
      window.removeEventListener("authUpdated", onAuthUpdated);
    };
  }, [cartCountProp, refreshCartCount, fetchCurrentUser]);

  // keep prop override in sync if it changes later
  useEffect(() => {
    if (typeof cartCountProp === "number") {
      setCartCount(cartCountProp);
    }
  }, [cartCountProp]);

  const toggleMenu = () => setMobileOpen((s) => !s);

  const linkClasses = (path) =>
    `hover:text-[#ffa0a0] ${location.pathname === path ? "text-[#ffa0a0]" : "text-white"}`;

  // Logout handler
  const handleLogout = async () => {
    try {
      await cartService.api.post("/auth/logout/"); // backend logout endpoint mapped in your views
    } catch (err) {
      // ignore network errors but log
      // eslint-disable-next-line no-console
      console.warn("Logout request failed", err?.response?.data || err.message || err);
    } finally {
      setUser(null);
      setDropdownOpen(false);
      // notify others
      try {
        window.dispatchEvent(new CustomEvent("authUpdated", { detail: null }));
      } catch (e) {}
      // navigate home after logout
      navigate("/");
    }
  };

  // click outside to close dropdown
  useEffect(() => {
    function onDocClick(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [dropdownOpen]);

  return (
    <header className="bg-[#2f4f4f]">
      <div className="max-w-screen-2xl mx-auto px-10">
        <nav className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Site logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold">
                  Stepup
                </div>
              )}
            </div>

            <div className="hidden sm:block">
              <div
                className="flex items-center bg-white rounded-full shadow-sm h-10 px-3"
                style={{ minWidth: 420, maxWidth: 320 }}
              >
                <svg
                  className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="6" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search here"
                  className="w-full bg-transparent outline-none text-gray-600 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ul className="hidden lg:flex items-center gap-6 text-lg">
              <li>
                <Link to="/" className={linkClasses("/")}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className={linkClasses("/about")}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className={linkClasses("/contact")}>
                  Contact Us
                </Link>
              </li>

              {/* Auth area: show username+dropdown when user is present, otherwise Log in */}
              <li>
                {!user ? (
                  <Link to="/auth" className={linkClasses("/auth")}>
                    Log in
                  </Link>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((v) => !v)}
                      className="flex items-center gap-2 text-white px-3 py-1 rounded hover:bg-white/10"
                      aria-haspopup="true"
                      aria-expanded={dropdownOpen}
                    >
                      <span className="text-sm">{user.username}</span>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 8l4 4 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-md z-30 text-sm">
                        {/* <Link to="/tracking/:id" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">Track Your Order</Link> */}
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800">Logout</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            </ul>

            {/* Cart */}
            <div className="relative">
              <Link to="/cart" className="inline-flex items-center">
                <p className="text-white text-lg mr-1">Cart</p>
                <img src={cartImg} alt="Cart" className="w-6 h-6" />
              </Link>
              {cartCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-white text-[#c0396a] w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold">
                  {cartCount}
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="lg:hidden p-2 rounded-md text-white hover:bg-white/10"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-max-h duration-200 overflow-hidden ${mobileOpen ? "max-h-60" : "max-h-0"}`}>
          <div className="py-3 border-t border-white/10">
            <ul className="flex flex-col gap-3 text-lg">
              <li>
                <Link to="/" className={`block px-2 ${linkClasses("/")}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className={`block px-2 ${linkClasses("/about")}`}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`block px-2 ${linkClasses("/contact")}`}>
                  Contact Us
                </Link>
              </li>
              <li>
                {!user ? (
                  <Link to="/auth" className={`block px-2 ${linkClasses("/auth")}`}>
                    Log in
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex-1 text-white">{user.username}</div>
                    <button onClick={handleLogout} className="text-white bg-white/10 px-3 py-1 rounded">Logout</button>
                  </div>
                )}
              </li>
            </ul>

            {/* Mobile search */}
            <div
              className="mt-3 flex items-center bg-white rounded-full shadow-sm h-10 px-3"
              style={{ minWidth: 220, maxWidth: 250 }}
            >
              <svg
                className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="6" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search here"
                className="w-full bg-transparent outline-none text-gray-600 placeholder-gray-400 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
