import React from "react";

// Import logos from assets/images
import gpayLogo from "../assets/images/gpay.png";
import paypalLogo from "../assets/images/paypal.png";
import clearpayLogo from "../assets/images/clearpay.png";
import klarnaLogo from "../assets/images/klarna.png";

const options = [
  { key: "gpay", label: "G Pay", logo: gpayLogo },
  { key: "paypal", label: "PayPal", logo: paypalLogo },
  { key: "clearpay", label: "Clearpay", logo: clearpayLogo },
  { key: "klarna", label: "Klarna", logo: klarnaLogo },
  { key: "cod", label: "Cash on Delivery", logo: null },
];

export default function PaymentOptions({ value, onChange }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold mb-2 text-center">Express Checkout</h4>
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`flex flex-col items-center justify-center gap-2 border p-4 rounded hover:shadow transition ${
              value === opt.key ? "ring-2 ring-emerald-500" : ""
            }`}
          >
            {/* Logo box (same size for all) */}
            <div className="w-24 h-8 flex items-center justify-center">
              {opt.logo ? (
                <img
                  src={opt.logo}
                  alt={opt.label}
                  className="max-h-4 max-w-full object-contain"
                />
              ) : (
                <div className="text-xs border rounded px-2 py-1">COD</div>
              )}
            </div>
            {/* <div className="text-sm">{opt.label}</div> */}
          </button>
        ))}
      </div>
    </div>
  );
}
