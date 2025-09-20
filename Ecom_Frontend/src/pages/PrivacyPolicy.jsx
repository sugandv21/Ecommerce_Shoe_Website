import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  User,
  CreditCard,
  Package,
  Activity,
  Lock,
  Settings,
  Share2,
  Mail,
} from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "Information We Collect",
      text: "We collect account info (name, email, phone), payment metadata, order & shipping details, and usage data such as device logs.",
      icon: User,
    },
    {
      title: "How We Use Your Data",
      text: "We use your data to process orders, communicate with you, provide customer support, and improve our services. We never sell your personal data.",
      icon: Activity,
    },
    {
      title: "Security",
      text: "We apply reasonable security measures. Please use strong, unique passwords to help protect your account.",
      icon: Lock,
    },
    {
      title: "Your Rights",
      text: "You may access, update, or delete your personal data by contacting support or using account settings.",
      icon: Settings,
    },
    {
      title: "Third-Party Services",
      text: "We rely on payment gateways, email providers, and shipping partners. Their policies apply when they process your data.",
      icon: Share2,
    },
    {
      title: "Contact",
      text: "For privacy-related concerns, email support@stepupshoe.example.",
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Last updated:{" "}
            <time dateTime="2025-09-20">September 20, 2025</time>
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
