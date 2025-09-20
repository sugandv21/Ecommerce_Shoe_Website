import React, { useEffect, useState } from "react";

export default function CartHeader({
  deliveryText = "Free & Fast arriving by Monday",
  deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  continueHref = "/",
}) {
  const [remaining, setRemaining] = useState(calcRemaining(deadline));

  useEffect(() => {
    const t = setInterval(() => setRemaining(calcRemaining(deadline)), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  return (
    <header className="w-full">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top row */}
        <div className="relative py-6 flex items-center">
          {/* Continue Shopping */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <a
              href={continueHref}
              className="text-lg font-medium text-gray-800 hover:underline"
            >
              Continue Shopping
            </a>
          </div>

        </div>

        {/* Pill banner (fixed max width, centered) */}
        <div className="flex justify-center">
          <div
            className="max-w-5xl w-full bg-white border border-gray-400 rounded-2xl px-6 py-3 shadow-sm text-center"
            style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
          >
            <span className="font-medium">{deliveryText}</span>
            <span className="ml-1">
              Order within{" "}
              <strong>
                {remaining.hours} hours, {remaining.minutes} minutes,
                {remaining.seconds} seconds
              </strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Helpers */
function calcRemaining(deadline) {
  const now = new Date();
  const end = deadline ? new Date(deadline) : new Date();
  let diff = Math.max(0, end.getTime() - now.getTime());

  const hours = Math.floor(diff / (3600 * 1000));
  diff -= hours * 3600 * 1000;
  const minutes = Math.floor(diff / (60 * 1000));
  diff -= minutes * 60 * 1000;
  const seconds = Math.floor(diff / 1000);

  return { hours, minutes, seconds };
}
