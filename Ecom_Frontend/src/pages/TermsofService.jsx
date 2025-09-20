import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  UserCheck,
  ShoppingCart,
  CreditCard,
  Truck,
  Shield,
  Ban,
  AlertTriangle,
  Scale,
  RefreshCw,
  Mail,
} from "lucide-react";

export default function TermsOfService() {
  const sections = [
    {
      title: "1. Using Our Service",
      text: "You must be at least 16 years old to make purchases. Provide accurate account and payment information and keep it up to date. You are responsible for activity on your account and must keep your password secure.",
      icon: UserCheck,
    },
    {
      title: "2. Orders & Pricing",
      text: "All orders are subject to product availability and confirmation of the order price. We may refuse or cancel orders for any reason. Prices are shown in the currency displayed on the site and include applicable taxes unless stated otherwise.",
      icon: ShoppingCart,
    },
    {
      title: "3. Payment",
      text: "Payment must be made at the time of order using the available payment methods. We do not store full card numbers or CVV — only non-sensitive metadata or gateway tokens in accordance with PCI best practices.",
      icon: CreditCard,
    },
    {
      title: "4. Shipping, Returns & Exchanges",
      text: "Shipping, returns and exchange terms are described in our Shipping Policy and Return & Exchange Policy. Please review those pages for timelines, costs and instructions.",
      icon: Truck,
    },
    {
      title: "5. Intellectual Property",
      text: "All content on this site (text, graphics, logos, images, and code) is owned by StepUp Shoe or licensors and is protected by intellectual property laws. You may not reproduce or use our content without prior written permission except for personal, non-commercial purposes.",
      icon: Shield,
    },
    {
      title: "6. Prohibited Conduct",
      text: "You agree not to misuse the service (including hacking, scraping, or transmitting malicious content) or to interfere with other users' access. Violations may result in account suspension or legal action.",
      icon: Ban,
    },
    {
      title: "7. Disclaimers & Limitation of Liability",
      text: "Our service is provided 'as-is'. While we make reasonable efforts to ensure accuracy, we cannot guarantee error-free content. StepUp Shoe and its affiliates are not liable for indirect or consequential damages arising from use of the site.",
      icon: AlertTriangle,
    },
    {
      title: "8. Governing Law",
      text: "These Terms are governed by the laws of the jurisdiction where StepUp Shoe operates. Any disputes will be subject to the competent courts in that jurisdiction unless otherwise required by applicable law.",
      icon: Scale,
    },
    {
      title: "9. Changes to These Terms",
      text: "We may update these Terms occasionally. We'll post changes on this page with an updated effective date. Continued use after changes means you accept the new Terms.",
      icon: RefreshCw,
    },
    {
      title: "10. Contact",
      text: "Questions about these Terms? Contact us at support@stepupshoe.example.",
      icon: Mail,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-8">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Effective date:{" "}
            <time dateTime="2025-09-20">September 20, 2025</time>
          </p>
        </header>

        {/* Content */}
        <section className="p-8 space-y-6 text-gray-700">
          <p className="leading-relaxed">
            Welcome to StepUp Shoe. These Terms of Service ("Terms") govern your
            access to and use of our website, products and services. By
            accessing or using our services you agree to these Terms. If you do
            not agree, please do not use our services.
          </p>

          {sections.map(({ title, text, icon: Icon }, i) => (
            <div
              key={i}
              className="flex items-start gap-4 border-l-4 border-emerald-500 bg-gray-50 rounded-md py-4 px-5"
            >
              <Icon className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed">{text}</p>
              </div>
            </div>
          ))}

          {/* Footer link */}
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
