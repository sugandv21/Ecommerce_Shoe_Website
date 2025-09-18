import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Cart from "./pages/Cart";

import WomensPage from "./pages/WomensPage";
// import MensPage from "./pages/MensPage";
// import KidsPage from "./pages/KidsPage";
// import BrandsPage from "./pages/BrandsPage";
// import OffersPage from "./pages/OffersPage";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AuthPage from "./pages/AuthPage";
import TrackingPage from "./pages/TrackingPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <main className="flex-1 p-6 pt-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/womens" element={<WomensPage />} />
            {/* <Route path="/mens" element={<MensPage />} />
            <Route path="/kids" element={<KidsPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/offers" element={<OffersPage />} /> */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cart" element={<Cart />} />

            <Route path="/product/:id" element={<ProductDetails />} />            
              <Route path="/checkout" element={<Checkout />} />              
              <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
               <Route path="/auth" element={<AuthPage />} />
                 <Route path="/track-order/:id" element={<TrackingPage />} />
  <Route path="/order-tracking/:id" element={<TrackingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
