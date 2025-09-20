import React from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  DollarSign,
  Clock,
  Package,
  FileText,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

export default function TermsOfExchange() {
  const sections = [
    {
      icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
      title: "Exchange Terms",
      content:
        "Exchanges are processed once we receive the original item and confirm it meets our return criteria. Exchange availability depends on stock.",
    },
    {
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      title: "Fees & Price Differences",
      content:
        "If the replacement item has a different price, we will charge or refund the difference. Shipping fees for exchanges may apply unless the exchange is due to our error.",
    },
    {
      icon: <Clock className="w-5 h-5 text-emerald-600" />,
      title: "Processing Time",
      content:
        "Exchanges are processed within 3–7 business days after we receive the returned item. You will be notified by email when the new item ships.",
    },
    {
      icon: <Package className="w-5 h-5 text-emerald-600" />,
      title: "Availability",
      content:
        "We cannot guarantee stock for exchanges. If the preferred replacement is unavailable we will offer alternatives or a refund.",
    },
    {
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      title: "How to Request an Exchange",
      content: (
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Contact{" "}
            <a
              href="mailto:returns@stepupshoe.example"
              className="text-emerald-700 underline"
            >
              returns@stepupshoe.example
            </a>{" "}
            or use your account returns portal.
          </li>
          <li>
            Specify the desired replacement size/color and your order number.
          </li>
          <li>Follow the instructions we send for shipping the original item back.</li>
        </ol>
      ),
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      title: "Exceptions",
      content:
        "Promotional items, final sale items and items damaged after delivery may be excluded from exchanges. See the Return & Exchange Policy for details.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-emerald-700" /> Terms of Exchange
          </h1>
          <p className="mt-2 text-gray-600">
            Terms governing exchanges, availability, and costs.
          </p>
        </header>

        <section className="space-y-8 text-gray-700">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                {section.icon} {section.title}
              </h2>
              <div className="text-gray-700">{section.content}</div>
            </div>
          ))}
        </section>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to StepUp Shoe
          </Link>
        </div>
      </div>
    </main>
  );
}
