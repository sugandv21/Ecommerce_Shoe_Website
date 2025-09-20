import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function InsideNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { to: "/womens", label: "Womens" },
    { to: "/mens", label: "Mens" },
    { to: "/kids", label: "Kids" },
    { to: "/brands", label: "Brands" },
    { to: "/offers", label: "Offers" },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Hide only the Back button on homepage */}
        {location.pathname !== "/" && (
          <button
            onClick={() => navigate(-1)}
            className="text-xl font-medium flex cursor-pointer items-center hover:text-red-500 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        )}

        {/* Always show StepUp.in */}
        <p className="text-4xl font-medium text-center flex-1">StepUp.in</p>
      </div>

      {/* Black border lines */}
      <div className="border-t border-b border-black py-5">
        <nav
          className="
            max-w-screen-2xl mx-auto px-4 
            flex flex-wrap gap-x-10 gap-y-3 
            justify-center
          "
        >
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `text-sm md:text-lg font-semibold ${
                  isActive ? "text-red-500" : "text-gray-800"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}

