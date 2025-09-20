import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";

import WomensPage from "./pages/WomensPage";
import MensPage from "./pages/MensPage";
import KidsPage from "./pages/KidsPage";

import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AuthPage from "./pages/AuthPage";
import TrackingPage from "./pages/TrackingPage";
import InsideNavbar from "./components/InsideNavbar";

import Footer from "./components/Footer";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsOfExchange from "./pages/TermsofExchange";
import ReturnAndExchangePolicy from "./pages/ReturnAndExchangePolicy";
import TermsofService from "./pages/TermsofService";
import Offers from "./pages/Offers";
import Brands from "./pages/Brands";

function App() {
  return (
    <Router>
      <div className="relative min-h-screen flex flex-col bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="absolute top-24 left-0 right-0 z-25 px-20">
          <InsideNavbar />
        </div>
        <main className="flex-1 p-6 pt-60">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/womens" element={<WomensPage />} />
            <Route path="/mens" element={<MensPage />} />
            <Route path="/kids" element={<KidsPage />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/brands" element={<Brands />} />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />

            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/blogs" element={<Blog />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/shipping" element={<ShippingPolicy />} />

            <Route path="/termss" element={<TermsOfExchange />} />
            <Route path="/terms" element={<TermsofService />} />
            <Route path="/return" element={<ReturnAndExchangePolicy />} />

            {/* Direct access without ProtectedRoute */}
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
            <Route path="/track-order/:id" element={<TrackingPage />} />
            <Route path="/order-tracking/:id" element={<TrackingPage />} />
            <Route path="/tracking/:id" element={<TrackingPage />} />

            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
