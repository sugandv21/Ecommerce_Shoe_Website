// src/pages/AuthPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded shadow-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-[#2f4f4f] text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  );
}

// Helper to read csrftoken cookie
function readCsrfTokenFromCookie() {
  try {
    const name = "csrftoken=";
    const cookie = (document.cookie || "").split(";").map(c => c.trim()).find(c => c.startsWith(name));
    if (!cookie) return null;
    return decodeURIComponent(cookie.substring(name.length));
  } catch (e) {
    return null;
  }
}

export default function AuthPage() {
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.next || "/";

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    showPassword: false,
  });

  // Register form state
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    showPassword: false,
  });

  // ensure axios sends cookies for cross-site requests
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = q.get("tab");
    if (t === "register" || t === "login") setTab(t);
  }, [location.search]);

  async function ensureCsrf() {
    // Try to set CSRF cookie via a small endpoint on backend
    try {
      await axios.get(`${API_ROOT}/auth/csrf/`);
    } catch (e) {
      // ignore — we will still attempt to read cookie and send header
    }
  }

  function resetMessages() {
    setError("");
    setModalMessage("");
  }

  // Register (unchanged behavior)
  async function handleRegister(e) {
    e?.preventDefault();
    resetMessages();

    if (!regForm.username?.trim()) { setError("Username is required."); return; }
    if (!regForm.email?.trim()) { setError("Email is required."); return; }
    if (!regForm.password) { setError("Password is required."); return; }
    if (regForm.password !== regForm.confirm_password) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await ensureCsrf();
      const payload = {
        username: regForm.username.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        confirm_password: regForm.confirm_password,
        first_name: regForm.first_name?.trim() || "",
        last_name: regForm.last_name?.trim() || "",
      };
      await axios.post(`${API_ROOT}/auth/register/`, payload);
      setModalMessage(
        "Congratulations — your account was created. A verification email has been sent. Please check your inbox to verify your account."
      );
      setModalOpen(true);
      setRegForm({ username: "", email: "", password: "", confirm_password: "", first_name: "", last_name: "", showPassword: false });
      setTab("login");
    } catch (err) {
      console.error("Register error:", err);
      const server = err?.response?.data ?? err?.message ?? "Registration failed.";
      if (typeof server === "object" && server !== null) {
        const msgs = [];
        for (const key of Object.keys(server)) {
          const val = server[key];
          if (Array.isArray(val)) msgs.push(`${key}: ${val.join(", ")}`);
          else msgs.push(`${key}: ${val}`);
        }
        setError(msgs.join(" / "));
      } else {
        setError(String(server));
      }
    } finally {
      setLoading(false);
    }
  }

  // Login — robust: explicit X-CSRFToken header + fallback to email field if username looks like email
  async function handleLogin(e) {
    e?.preventDefault();
    resetMessages();
    if (!loginForm.username?.trim()) { setError("Email or username is required."); return; }
    if (!loginForm.password) { setError("Password is required."); return; }

    setLoading(true);
    try {
      // 1) probe CSRF endpoint to set cookie (best effort)
      await ensureCsrf();

      // 2) read cookie token
      const csrfToken = readCsrfTokenFromCookie();

      // helper to post with CSRF header
      const postLogin = async (payload) => {
        const headers = {};
        if (csrfToken) headers["X-CSRFToken"] = csrfToken;
        // also set content-type explicitly
        headers["Content-Type"] = "application/json";
        return axios.post(`${API_ROOT}/auth/login/`, payload, { headers, withCredentials: true });
      };

      // Try: { username, password } first
      const primaryPayload = { username: loginForm.username.trim(), password: loginForm.password };
      let res;
      try {
        res = await postLogin(primaryPayload);
      } catch (errPrimary) {
        // If 400 and user input looks like email, try using { email, password } as fallback
        const isEmailLike = /\S+@\S+\.\S+/.test(loginForm.username);
        const status = errPrimary?.response?.status;
        // If server provided field errors, show them if we won't retry
        if (!isEmailLike || status !== 400) {
          // prepare readable message
          const server = errPrimary?.response?.data ?? errPrimary?.message ?? String(errPrimary);
          if (typeof server === "object" && server !== null) {
            const msgs = [];
            for (const key of Object.keys(server)) {
              const val = server[key];
              if (Array.isArray(val)) msgs.push(`${key}: ${val.join(", ")}`);
              else msgs.push(`${key}: ${val}`);
            }
            throw new Error(msgs.join(" / "));
          }
          throw errPrimary;
        }
        // fallback attempt with email
        try {
          res = await postLogin({ email: loginForm.username.trim(), password: loginForm.password });
        } catch (errFallback) {
          // final error — bubble message
          const server = errFallback?.response?.data ?? errFallback?.message ?? String(errFallback);
          if (typeof server === "object" && server !== null) {
            const msgs = [];
            for (const key of Object.keys(server)) {
              const val = server[key];
              if (Array.isArray(val)) msgs.push(`${key}: ${val.join(", ")}`);
              else msgs.push(`${key}: ${val}`);
            }
            throw new Error(msgs.join(" / "));
          }
          throw errFallback;
        }
      }

      // success: res holds the login response
      const userId = res?.data?.id ?? null;
      const username = res?.data?.username ?? loginForm.username.trim();
      const email = res?.data?.email ?? null;

      try {
        window.dispatchEvent(new CustomEvent("authUpdated", { detail: { id: userId, username, email } }));
      } catch (e) {
        // ignore dispatch errors
      }

      // redirect to next
      navigate(next || "/");
    } catch (err) {
      console.error("Login error:", err);
      // Show readable message if we threw an Error with message
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        const server = err?.response?.data ?? err?.message ?? "Login failed.";
        if (typeof server === "object" && server !== null) {
          const msgs = [];
          for (const key of Object.keys(server)) {
            const val = server[key];
            if (Array.isArray(val)) msgs.push(`${key}: ${val.join(", ")}`);
            else msgs.push(`${key}: ${val}`);
          }
          setError(msgs.join(" / "));
        } else {
          setError(String(server));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-4xl grid grid-cols-2 gap-6">
        {/* Left Card: login / register switch */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex border-b mb-4">
            <button onClick={() => { setTab("login"); resetMessages(); }} className={`px-6 py-2 ${tab === "login" ? "bg-[#2f4f4f] text-white" : "bg-gray-200"}`}>
              Log in
            </button>
            <button onClick={() => { setTab("register"); resetMessages(); }} className={`px-6 py-2 ${tab === "register" ? "bg-[#2f4f4f] text-white" : "bg-gray-200"}`}>
              Register
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Email or Username</label>
                <input value={loginForm.username} onChange={(e) => setLoginForm(s => ({ ...s, username: e.target.value }))} className="w-full border px-3 py-2 rounded" placeholder="Enter your email or username" autoComplete="username" />
              </div>

              <div>
                <label className="block text-sm font-medium">Password</label>
                <div className="relative">
                  <input type={loginForm.showPassword ? "text" : "password"} value={loginForm.password} onChange={(e) => setLoginForm(s => ({ ...s, password: e.target.value }))} className="w-full border px-3 py-2 rounded" placeholder="Enter password" autoComplete="current-password" />
                  <button type="button" onClick={() => setLoginForm(s => ({ ...s, showPassword: !s.showPassword }))} className="absolute right-2 top-2 text-sm text-gray-600">{loginForm.showPassword ? "Hide" : "Show"}</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="form-checkbox" /> Remember me</label>
                <a href="/forgot-password" className="text-sm text-teal-700 hover:underline">Forgot?</a>
              </div>

              <div className="text-right">
                <button type="submit" disabled={loading} className="bg-[#2f4f4f] text-white px-6 py-2 rounded">{loading ? "Logging in..." : "Log In"}</button>
              </div>

              <div className="text-center text-sm text-gray-500">Or</div>
              <div className="text-center">
                <button type="button" className="w-full border px-3 py-2 rounded">Continue with Google</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Username</label>
                <input value={regForm.username} onChange={(e) => setRegForm(s => ({ ...s, username: e.target.value }))} className="w-full border px-3 py-2 rounded" placeholder="Enter username" required />
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" value={regForm.email} onChange={(e) => setRegForm(s => ({ ...s, email: e.target.value }))} className="w-full border px-3 py-2 rounded" placeholder="Enter your email" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Password</label>
                  <div className="relative">
                    <input type={regForm.showPassword ? "text" : "password"} value={regForm.password} onChange={(e) => setRegForm(s => ({ ...s, password: e.target.value }))} className="w-full border px-3 py-2 rounded" placeholder="Enter password" required autoComplete="new-password" />
                    <button type="button" onClick={() => setRegForm(s => ({ ...s, showPassword: !s.showPassword }))} className="absolute right-2 top-2 text-sm text-gray-600">{regForm.showPassword ? "Hide" : "Show"}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Confirm Password</label>
                  <input type="password" value={regForm.confirm_password} onChange={(e) => setRegForm(s => ({ ...s, confirm_password: e.target.value }))} className="w-full border px-3 py-2 rounded" placeholder="Confirm password" required autoComplete="new-password" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="First name" value={regForm.first_name} onChange={(e) => setRegForm(s => ({ ...s, first_name: e.target.value }))} className="w-full border px-3 py-2 rounded" />
                <input placeholder="Last name" value={regForm.last_name} onChange={(e) => setRegForm(s => ({ ...s, last_name: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>

              <div className="text-right">
                <button type="submit" disabled={loading} className="bg-[#2f4f4f] text-white px-6 py-2 rounded">{loading ? "Registering..." : "Register"}</button>
              </div>
            </form>
          )}

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        {/* Right card */}
        <div className="bg-white rounded-lg p-6 shadow flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">Welcome to StepUp</h2>
          <p className="text-sm text-gray-600 text-center">Create an account to get faster checkout, track orders, and receive offers.</p>
          <div className="mt-6">
            <img src="/assets/illustration-auth.png" alt="auth illustration" className="w-48 h-48 object-contain" />
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal title="Account Created" onClose={() => setModalOpen(false)}>
          <p className="mb-4">{modalMessage}</p>
          <div className="text-center">
            <button onClick={() => setModalOpen(false)} className="bg-[#2f4f4f] text-white px-4 py-2 rounded">OK</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
