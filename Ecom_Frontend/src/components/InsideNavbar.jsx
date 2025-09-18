import React from "react";
import { NavLink } from "react-router-dom";

export default function InsideNavbar() {
  const items = [
    { to: "/womens", label: "Womens" },
    { to: "/mens", label: "Mens" },
    { to: "/kids", label: "Kids" },
    { to: "/brands", label: "Brands" },
    { to: "/offers", label: "Offers" },
  ];

  return (
    <div className="border-t border-b py-3">
      <nav
        className="
          max-w-screen-2xl mx-auto px-4 
          flex flex-wrap gap-x-6 gap-y-3 
          justify-center
        "
      >
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `text-sm md:text-base font-medium ${
                isActive ? "text-red-500" : "text-gray-800"
              }`
            }
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
