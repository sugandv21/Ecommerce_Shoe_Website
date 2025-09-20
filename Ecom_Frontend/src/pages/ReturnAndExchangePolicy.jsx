import React from "react";
import { Link } from "react-router-dom";
import {
  RefreshCcw,
  ClipboardList,
  CreditCard,
  ShoppingBag,
  Ban,
  Mail,
} from "lucide-react";

export default function ReturnAndExchangePolicy() {
  const sections = [
    {
      title: "Eligibility",
      text: "Returns and exchanges are accepted within 30 days if items are unused and in original packaging with tags.",
      icon: ClipboardList,
    },
    {
      title: "How to Return",
      text: "Request a return via your account or email returns@stepupshoe.example. Include order details; we’ll send instructions and labels.",
      icon: RefreshCcw,
    },
    {
      title: "Refunds",
      text: "Refunds go back to the original payment method within 5–10 business days after inspection. Shipping fees may be deducted unless the return is due to our error.",
      icon: CreditCard,
    },
    {
      title: "Exchanges",
      text: "For size or color swaps, place a new order and return the original item. Assisted exchanges are available on request.",
      icon: ShoppingBag,
    },
    {
      title: "Non-Returnable Items",
      text: "Heavily worn items or products damaged by misuse are not eligible for return.",
      icon: Ban,
    },
    {
      title: "Contact",
      text: "For questions, email returns@stepupshoe.example.",
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Return & Exchange Policy</h1>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Hassle-free returns and exchanges designed for your satisfaction.
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
