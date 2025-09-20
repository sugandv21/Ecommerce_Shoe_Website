// import React from "react";
// import { NavLink, useNavigate, useLocation } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";

// export default function InsideNavbar() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const items = [
//     { to: "/womens", label: "Womens" },
//     { to: "/mens", label: "Mens" },
//     { to: "/kids", label: "Kids" },
//     { to: "/brands", label: "Brands" },
//     { to: "/offers", label: "Offers" },
//   ];

//   return (
//     <>
//       <div className="flex items-center justify-between gap-2 mb-4">
//         {/* Hide only the Back button on homepage */}
//         {location.pathname !== "/" && (
//           <button
//             onClick={() => navigate(-1)}
//             className="text-xl font-medium flex cursor-pointer items-center hover:text-red-500 transition"
//           >
//             <ArrowLeft className="w-5 h-5 mr-2" /> Back
//           </button>
//         )}

//         {/* Always show StepUp.in */}
//         <p className="text-4xl font-medium text-center flex-1">StepUp.in</p>
//       </div>

//       {/* Black border lines */}
//       <div className="border-t border-b border-black py-5">
//         <nav
//           className="
//             max-w-screen-2xl mx-auto px-4 
//             flex flex-wrap gap-x-10 gap-y-3 
//             justify-center
//           "
//         >
//           {items.map((it) => (
//             <NavLink
//               key={it.to}
//               to={it.to}
//               className={({ isActive }) =>
//                 `text-sm md:text-lg font-semibold ${
//                   isActive ? "text-red-500" : "text-gray-800"
//                 }`
//               }
//             >
//               {it.label}
//             </NavLink>
//           ))}
//         </nav>
//       </div>
//     </>
//   );
// }
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Menu, X } from "lucide-react";

export default function InsideNavbar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // close dropdown on escape and when resizing to small screens
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    function onResize() {
      if (window.innerWidth < 768) setOpenMenu(null);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // prevent document scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [mobileOpen]);

  const items = [
    { to: "/womens", label: "Womens", menuKey: "womens" },
    { to: "/mens", label: "Mens", menuKey: "mens" },
    { to: "/kids", label: "Kids", menuKey: "kids" },
    { to: "/brands", label: "Brands", menuKey: "brands" },
    { to: "/offers", label: "Offers", menuKey: "offers" },
  ];

  const dropdowns = {
    womens: [
      { title: "New Arrivals", links: ["View all"] },
      { title: "Sandals", links: ["View all", "Flat", "Flip Flop", "Slider", "Strappy"] },
      { title: "Trainers", links: ["View all", "Chunky", "Lace Up", "Slip On"] },
      { title: "Canvas", links: ["View all", "Lace Up", "Slip On"] },
      { title: "Shoes", links: ["View all", "Ballerina", "Brogue", "Heel", "Leather", "Party", "School"] },
      { title: "Safety Footwear", links: ["View all"] },
      { title: "Boots", links: ["View all", "Ankle", "Biker", "Heel", "Knee", "Lace up", "Leather"] },
      { title: "Slippers", links: ["View all", "Easy Fasten", "Full", "Moccasin", "Mule", "Slipper Boots"] },
    ],
    mens: [
      { title: "New Arrivals", links: ["View all"] },
      { title: "Sandals", links: ["View all", "Flip Flop", "Mule", "Slider", "Sport"] },
      { title: "Trainers", links: ["View all", "Easy Fasten"] },
      { title: "Canvas", links: ["View all", "Lace Up", "Slip On"] },
      { title: "Shoes", links: ["View all", "Brogue", "Casual", "Easy Fasten", "Leather", "Loafer", "Oxford"] },
      { title: "Safety Footwear", links: ["View all", "Boots", "Shoes", "Steel toe cap", "Trainers"] },
      { title: "Boots", links: ["View all", "Ankle", "Chelsea", "Desert", "Lace up", "Leather", "Pull on"] },
      { title: "Slippers", links: ["View all", "Full", "Moccasin", "Mule"] },
    ],
    kids: [
      { title: "Girls", links: ["View all", "Sandals", "Canvas", "Trainers", "Shoes", "Boots", "Wellies", "Slippers"] },
      { title: "Girls Trending", links: ["Save", "New arrivals", "Character footwear", "Online exclusive", "Back to school"] },
      { title: "Back to school", links: ["View all", "Girls school shoes", "Boys school shoes"] },
      { title: "Canvas", links: ["View all", "Lace Up", "Slip On"] },
      { title: "Boys", links: ["View all", "Sandals", "Canvas", "Trainers", "Shoes", "Boots", "Wellies", "Slippers"] },
      { title: "Safety Footwear", links: ["View all"] },
      { title: "Boys Trending", links: ["Save", "New arrivals", "Character exclusive", "Online exclusive", "Back to school"] },
      { title: "Slippers", links: ["Boys slippers", "Girls slippers"] },
    ],
    brands: [
      { title: "B", links: ["Barbie", "Beckett", "Bluey"] },
      { title: "C", links: ["Comfort Plus", "Comfy steps", "Crocs", "Cushion Walk"] },
      { title: "D", links: ["Disney frozen", "Disney stitch", "Divaz", "Dunlop"] },
      { title: "E", links: ["EarthWorks", "Gabbys Dollhouse"] },
      { title: "H", links: ["Heart", "Heavenly feet", "Hobos", "Hush puppies"] },
      { title: "J", links: ["Jo& Joe", "JuJu"] },
      { title: "K", links: ["Kickers", "Krush"] },
      { title: "L", links: ["Lambretta", "Lilley", "LoL", "Lotus", "Lunar"] },
      { title: "M", links: ["Marco", "Lozzi", "Marvel", "Maya", "grace"] },
      { title: "O", links: ["Original penguin", "Osaga"] },
      { title: "P", links: ["Paw patrol", "Pokemon"] },
      { title: "R", links: ["Red fish", "Red level", "Regatta", "Rieker", "Rocket Dog"] },
      { title: "S", links: ["Skechers", "Soft line", "Softlites", "Spider-man", "Stone creek", "Super mario"] },
      { title: "T", links: ["Totes isotner", "Trespass", "Truffle", "Trux"] },
      { title: "U", links: ["Umbro"] },
      { title: "W", links: ["Walkright", "Wednesday", "Wrangler"] },
      { title: "X", links: ["XL"] },
    ],
    offers: [{ title: "Offers", links: ["SAVE", "Two pairs for thousand", "Clearance Outlet", "Boots Sale", "View all offers"] }],
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4 px-4">
        <button
          onClick={() => navigate(-1)}
          className="text-xl font-medium flex items-center hover:text-red-500 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>

        <p className="text-3xl font-medium text-center flex-1">StepUp.in</p>

        <button className="md:hidden text-gray-700" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop navbar strip */}
      <div className="border-t-2 border-b-2 border-gray-500 py-3 relative hidden md:block">
        <nav className="max-w-screen-2xl mx-auto px-4 flex gap-x-8 justify-center relative">
          {items.map((it) => (
            <div
              key={it.to}
              className="relative"
              onMouseEnter={() => setOpenMenu(it.menuKey)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <NavLink
                to={it.to}
                className={({ isActive }) => `text-base font-medium ${isActive ? "text-red-500" : "text-gray-800"}`}
              >
                {it.label}
              </NavLink>

              {/* -- Desktop Mega-dropdown: centered, constrained, scrollable columns -- */}
              {dropdowns[it.menuKey] && openMenu === it.menuKey && (
                <div
                  role="menu"
                  aria-label={`${it.label} menu`}
                  className="absolute inset-x-0 top-full mt-2 z-50 pointer-events-auto"
                >
                  {/* Centered inner panel whose width matches page content and never grows beyond viewport */}
                  <div className="mx-auto w-full max-w-screen-2xl px-4">
                    <div className="bg-white border rounded-lg shadow-lg p-6">
                      {/* Use flex + overflow-x-auto so columns keep their width but the whole menu won't overflow the viewport */}
                      <div className="flex gap-5 overflow-x-auto py-2">
                        {dropdowns[it.menuKey].map((col, idx) => (
                          <div key={idx} className="min-w-[140px] flex-shrink-0">
                            <h4 className="font-semibold text-gray-900 mb-3">{col.title}</h4>
                            <ul className="space-y-2">
                              {col.links.map((link, i) => (
                                <li key={i}>
                                  <NavLink
                                    to={`${it.to}/${link.toLowerCase().replace(/\s+/g, "-")}`}
                                    className="text-gray-600 hover:text-red-500 text-sm block truncate"
                                  >
                                    {link}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-b border-gray-300">
          <nav className="flex flex-col p-4 space-y-3">
            {items.map((it) => (
              <div key={it.to} className="flex flex-col">
                <div
                  className="flex justify-between items-center"
                  onClick={() => setOpenMenu(openMenu === it.menuKey ? null : it.menuKey)}
                >
                  <NavLink
                    to={it.to}
                    className={({ isActive }) => `text-base font-medium ${isActive ? "text-red-500" : "text-gray-800"}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {it.label}
                  </NavLink>
                  {dropdowns[it.menuKey] &&
                    (openMenu === it.menuKey ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />)}
                </div>

                {dropdowns[it.menuKey] && openMenu === it.menuKey && (
                  <div className="ml-4 mt-2 space-y-2">
                    {dropdowns[it.menuKey].map((col, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-gray-900">{col.title}</h4>
                        <ul className="ml-3 space-y-1">
                          {col.links.map((link, i) => (
                            <li key={i}>
                              <NavLink
                                to={`${it.to}/${link.toLowerCase().replace(/\s+/g, "-")}`}
                                className="text-gray-600 hover:text-red-500 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                {link}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
