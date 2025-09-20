import React from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  DollarSign,
  MapPin,
  Globe,
  AlertTriangle,
  Mail,
} from "lucide-react";

export default function ShippingPolicy() {
  const sections = [
    {
      title: "Domestic Shipping",
      text: "Orders process in 1–2 business days. Standard shipping takes 3–7 days; express shipping 1–3 days (where available).",
      icon: Truck,
    },
    {
      title: "Shipping Costs",
      text: "Calculated at checkout. Free standard shipping may apply above a minimum order value.",
      icon: DollarSign,
    },
    {
      title: "Order Tracking",
      text: "Tracking details are sent by email once your order ships. Use courier sites or our tracking page.",
      icon: MapPin,
    },
    {
      title: "International Shipping",
      text: "Available in select regions. Duties, taxes, and customs fees are the buyer’s responsibility unless otherwise stated.",
      icon: Globe,
    },
    {
      title: "Delivery Issues",
      text: "If delayed or lost, contact support within 14 days of expected delivery with your order details.",
      icon: AlertTriangle,
    },
    {
      title: "Contact",
      text: "For shipping-related queries, email support@stepupshoe.example.",
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Shipping Policy</h1>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Clear shipping timelines, costs, and tracking for your peace of mind.
          </p>
        </header>

        <section className="p-8 space-y-6 text-gray-700">
          {sections.map(({ title, text, icon: Icon }, i) => (
            <div
              key={i}
              className="flex items-start gap-4 border-l-4 border-emerald-500 bg-gray-50 rounded-md py-4 px-5"
            >
              <Icon className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed">{text}</p>
              </div>
            </div>
          ))}

          <div className="pt-6 border-t text-sm text-gray-500">
            Back to{" "}
            <Link
              to="/"
              className="text-emerald-700 font-medium hover:underline"
            >
              StepUp Shoe
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
