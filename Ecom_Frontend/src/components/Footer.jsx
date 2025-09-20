// src/components/Footer.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import facebookIcon from "../assets/images/facebook.png";
import instagramIcon from "../assets/images/instagram.png";
import twitterIcon from "../assets/images/twitter.png";
import metaIcon from "../assets/images/meta.png";

/**
 * Simple accessible modal
 * - open: boolean
 * - title: string
 * - children: content
 * - onClose: fn
 */
function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "dialog"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-w-lg w-full bg-white rounded-md shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#274541] text-white rounded hover:opacity-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

const Footer = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Basic email validation
  function validateEmail(value) {
    if (!value) return "Please enter an email address.";
    // simple regex (good enough for basic validation)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return "Please enter a valid email.";
    return "";
  }

  async function handleSubscribe(e) {
    e?.preventDefault?.();
    setError("");
    const v = email.trim();
    const vErr = validateEmail(v);
    if (vErr) {
      setError(vErr);
      return;
    }

    try {
      // If you later want to call an API, place it here.
      // Simulate success:
      setModalMessage(`Thanks! ${v} has been subscribed to our mailing list.`);
      setModalOpen(true);
      setEmail("");

      // auto-close modal after 4s
      setTimeout(() => {
        setModalOpen(false);
      }, 4000);
    } catch (err) {
      setError("Subscription failed. Try again later.");
    }
  }

  return (
    <>
      <footer className="bg-[#2F4F4F] text-white py-12 px-6 md:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 text-sm">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p className="mb-1">We’d love to hear from you!</p>
            <p className="mb-1">Landline : XXXXXXXXXXXX</p>
            <p className="mb-1">WhatsApp : +91XXXXXXXXXX</p>
            <p className="mb-1">Email : stepup@gmail.com</p>
            <p>
              Address : 2/38, yyyyyyyyyyy <br />
              Tenkasi, Tamilnadu, India.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="list-disc list-outside pl-4 space-y-1">
              <li><Link to="/new" className="hover:underline">New in</Link></li>
              <li><Link to="/womens" className="hover:underline">Women</Link></li>
              <li><Link to="/mens" className="hover:underline">Men</Link></li>
              <li><Link to="/accessories" className="hover:underline">Accessories</Link></li>
              <li><Link to="/heels" className="hover:underline">Heels</Link></li>
              <li><Link to="/about" className="hover:underline">About us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Info</h3>
            <ul className="list-disc list-outside pl-4 space-y-1">
              <li><Link to="/search" className="hover:underline">Search</Link></li>
              <li><Link to="/return" className="hover:underline">Return & Exchange Policy</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
              <li><Link to="/shipping" className="hover:underline">Shipping Policy</Link></li>
              <li><Link to="/blogs" className="hover:underline">Blogs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Social Media</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <img src={facebookIcon} alt="Facebook" className="w-6 h-6 hover:opacity-80" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <img src={instagramIcon} alt="Instagram" className="w-6 h-6 hover:opacity-80" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <img src={twitterIcon} alt="Twitter" className="w-6 h-6 hover:opacity-80" />
              </a>
              <a href="https://meta.com" target="_blank" rel="noopener noreferrer">
                <img src={metaIcon} alt="Meta" className="w-6 h-6 hover:opacity-80" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Let's stay in touch!</h3>
            <p className="mb-4 text-sm">
              Sign up for exclusive offers, original stories, events and more.
            </p>

            <form onSubmit={handleSubscribe} className="max-w-sm">
              <label htmlFor="footer-email" className="block mb-2 text-sm">Email id</label>
              <input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-black rounded-sm mb-2"
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
              {error && <div id="email-error" className="text-yellow-300 text-xs mb-2">{error}</div>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="bg-white text-black px-5 py-2 font-bold rounded-sm hover:bg-gray-300"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      </footer>

      <Modal
        open={modalOpen}
        title="Subscription successful"
        onClose={() => setModalOpen(false)}
      >
        <p className="text-sm text-gray-700">{modalMessage}</p>
      </Modal>
    </>
  );
};

export default Footer;
