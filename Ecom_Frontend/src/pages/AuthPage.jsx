import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import googleLogo from "../assets/images/google.png";


const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {/* <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-[#2f4f4f] text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
}

function readCsrfTokenFromCookie() {
  try {
    const name = "csrftoken=";
    const cookie = (document.cookie || "")
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(name));
    if (!cookie) return null;
    return decodeURIComponent(cookie.substring(name.length));
  } catch (e) {
    return null;
  }
}

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.next || "/";

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    showPassword: false,
  });

  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    showPassword: false,
    agree: false,
  });

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const t = q.get("tab");
    if (t === "register" || t === "login") setTab(t);
  }, [location.search]);

  async function ensureCsrf() {
    try {
      await axios.get(`${API_ROOT}/auth/csrf/`);
    } catch (e) {}
  }

  function resetMessages() {
    setError("");
    setModalMessage("");
  }

  async function handleRegister(e) {
    e?.preventDefault();
    resetMessages();

    if (!regForm.username?.trim()) return setError("Username is required.");
    if (!regForm.email?.trim()) return setError("Email is required.");
    if (!regForm.password) return setError("Password is required.");
    if (regForm.password !== regForm.confirm_password)
      return setError("Passwords do not match.");
    if (!regForm.agree)
      return setError("You must agree to the Terms and Conditions.");

    setLoading(true);
    try {
      await ensureCsrf();
      const payload = {
        username: regForm.username.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        confirm_password: regForm.confirm_password,
      };
      await axios.post(`${API_ROOT}/auth/register/`, payload);
      setModalMessage(
        "You’ve successfully created an account.A confirmation email will be on its way to you shartly,containing a verification link."
      );
      setModalOpen(true);
      setRegForm({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        showPassword: false,
        agree: false,
      });
      setTab("login");
    } catch (err) {
      console.error("Register error:", err);
      const server = err?.response?.data ?? err?.message ?? "Registration failed.";
      if (typeof server === "object" && server !== null) {
        const msgs = [];
        for (const key of Object.keys(server)) {
          const val = server[key];
          msgs.push(`${key}: ${Array.isArray(val) ? val.join(", ") : val}`);
        }
        setError(msgs.join(" / "));
      } else {
        setError(String(server));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e?.preventDefault();
    resetMessages();
    if (!loginForm.username?.trim())
      return setError("Email or username is required.");
    if (!loginForm.password) return setError("Password is required.");

    setLoading(true);
    try {
      await ensureCsrf();
      const csrfToken = readCsrfTokenFromCookie();
      const headers = csrfToken
        ? {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };

      const payload = {
        username: loginForm.username.trim(),
        password: loginForm.password,
      };
      const res = await axios.post(`${API_ROOT}/auth/login/`, payload, {
        headers,
        withCredentials: true,
      });

      const userId = res?.data?.id ?? null;
      const username = res?.data?.username ?? loginForm.username.trim();
      const email = res?.data?.email ?? null;

      window.dispatchEvent(
        new CustomEvent("authUpdated", {
          detail: { id: userId, username, email },
        })
      );
      navigate(next || "/");
    } catch (err) {
      console.error("Login error:", err);
      const server = err?.response?.data ?? err?.message ?? "Login failed.";
      if (typeof server === "object" && server !== null) {
        const msgs = [];
        for (const key of Object.keys(server)) {
          const val = server[key];
          msgs.push(`${key}: ${Array.isArray(val) ? val.join(", ") : val}`);
        }
        setError(msgs.join(" / "));
      } else {
        setError(String(server));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      {/* Auth Card */}
      <div className="w-[550px] min-h-[650px] bg-white rounded-2xl p-10 shadow-2xl flex flex-col justify-center">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => {
              setTab("login");
              resetMessages();
            }}
            className={`flex-1 py-3 font-semibold ${
              tab === "login"
                ? "bg-[#2f4f4f] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => {
              setTab("register");
              resetMessages();
            }}
            className={`flex-1 py-3 font-semibold ${
              tab === "register"
                ? "bg-[#2f4f4f] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-md font-bold mb-1">
                Email id
              </label>
              <input
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((s) => ({ ...s, username: e.target.value }))
                }
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email or username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-md font-bold mb-1">Password</label>
              <div className="relative">
                <input
                  type={loginForm.showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLoginForm((s) => ({
                      ...s,
                      showPassword: !s.showPassword,
                    }))
                  }
                  className="absolute right-3 top-3 text-sm text-gray-600"
                >
                  {loginForm.showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

           <div className="flex justify-end mt-2">
  <a
    href="#"
    className="text-sm text-red-500 hover:underline"
  >
    Forgot Password?
  </a>
</div>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2f4f4f] text-white py-3 rounded-lg hover:bg-[#253d3d] transition"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="text-center text-sm text-gray-500">Or</div>
      <button
  type="button"
  className="w-full border px-4 py-3 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-3"
>
  <span>Continue with Google</span>
   <img src={googleLogo} alt="Google" className="w-5 h-5" />
</button>


            <p className="text-sm text-center">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-red-600"
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-md font-bold mb-1">Username</label>
              <input
                value={regForm.username}
                onChange={(e) =>
                  setRegForm((s) => ({ ...s, username: e.target.value }))
                }
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-md font-bold mb-1">Email</label>
              <input
                type="email"
                value={regForm.email}
                onChange={(e) =>
                  setRegForm((s) => ({ ...s, email: e.target.value }))
                }
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-md font-bold mb-1">Password</label>
              <div className="relative">
                <input
                  type={regForm.showPassword ? "text" : "password"}
                  value={regForm.password}
                  onChange={(e) =>
                    setRegForm((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRegForm((s) => ({
                      ...s,
                      showPassword: !s.showPassword,
                    }))
                  }
                  className="absolute right-3 top-3 text-sm text-gray-600"
                >
                  {regForm.showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-md font-bold mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={regForm.confirm_password}
                onChange={(e) =>
                  setRegForm((s) => ({
                    ...s,
                    confirm_password: e.target.value,
                  }))
                }
                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center gap-2 text-md">
              <input
                type="checkbox"
                checked={regForm.agree}
                onChange={(e) =>
                  setRegForm((s) => ({ ...s, agree: e.target.checked }))
                }
              />
              <span>
                I have read and agreed to the Terms and Conditions and Privacy
                Policy
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2f4f4f] text-white py-3 rounded-lg hover:bg-[#253d3d] transition"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </div>

      {modalOpen && (
        <Modal title="Account Created" onClose={() => setModalOpen(false)}>
          <p className="mb-4">{modalMessage}</p>
          <div className="text-center">
            <button
              onClick={() => setModalOpen(false)}
              className="bg-[#2f4f4f] text-white px-6 py-2 rounded"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
