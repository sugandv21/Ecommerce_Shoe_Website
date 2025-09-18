import React, { useEffect, useState } from "react";
import axios from "axios";
import InsideNavbar from "../components/InsideNavbar";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";
const API_SERVER = import.meta.env.VITE_API_SERVER?.replace(/\/+$/, "") || API_URL.replace(/\/api$/, "") || "";

const fixUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${API_SERVER}${url}` : `${API_SERVER}/${url}`;
};

export default function About() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = `${API_URL}/about/`;
    console.log("About: fetching", url);

    axios
      .get(url, { timeout: 10000 })
      .then((res) => {
        console.log("About API response:", res.data);

        const payload = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!payload) {
          setError("No about content available");
          setData(null);
          return;
        }

        payload.images = payload.images || [];
        payload.features = payload.features || [];

        payload.images = payload.images.map((img) => ({
          ...img,
          image: fixUrl(img.image || img.url || img.image_url || ""),
        }));
        payload.overlay_image1 = fixUrl(payload.overlay_image1 || payload.overlay1 || "");
        payload.overlay_image2 = fixUrl(payload.overlay_image2 || payload.overlay2 || "");

        setData(payload);
      })
      .catch((err) => {
        console.error("About fetch error:", err);
        setError("Failed to load about content");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!data) return <div className="text-center py-10">No content</div>;

  return (
    <div className="mx-auto px-6 space-y-16 relative">
      <InsideNavbar />

      <section className="text-center space-y-6 max-w-5xl relative">
        <h2 className="text-3xl font-bold">{data.section1_title || "About Us"}</h2>
        <p className="text-black leading-relaxed whitespace-pre-line mt-4">
          {data.section1_content || "Content coming soon..."}
        </p>

        {data.overlay_image1 && (
          <img
            src={data.overlay_image1}
            alt="overlay 1"
            className="absolute hidden md:block sm:block sm:top-0 sm:right-10 lg:top-[-25%] lg:right-[-32%] sm:h-40 lg:h-[400px] object-cover z-20 "
          />
        )}
        {data.overlay_image2 && (
          <img
            src={data.overlay_image2}
            alt="overlay 2"
            className="absolute hidden sm:block sm:top-0 sm:right-10 lg:top-[15%] lg:right-[-32%] sm:h-40 lg:h-[350px] object-cover z-10 "
          />
        )}

      </section>

      {/* Section 2 */}
      <section className="text-center max-w-5xl space-y-6 mt-24">
        <h3 className="text-2xl font-semibold">{data.section2_title || "Our Mission"}</h3>
        <p className="text-black whitespace-pre-line mt-4">
          {data.section2_content || "Content coming soon..."}
        </p>
      </section>

      {/* Section 3 - Images */}
      <section className="grid grid-cols-1 items-center justify-center md:grid-cols-1 gap-8 mt-12">
        {data.images.length === 0 ? (
          <div className="text-center col-span-1 md:col-span-2">No images available</div>
        ) : (
          data.images.map((img) => (
            <div key={img.id || img.image} className="rounded-full overflow-hidden sm:w-42 sm:h-42 lg:w-72 lg:h-72 mx-auto">
              <img
                src={img.image}
                alt={img.alt_text || `about-${img.id || "img"}`}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ))
        )}
      </section>

      {/* Section 4 - Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center mt-12">
        {data.features.length === 0 ? (
          <div className="col-span-1 md:col-span-3">No features available</div>
        ) : (
          data.features.map((feat, idx) => (
            <div key={feat.id || idx} className="space-y-3">
              <h4 className="text-lg font-semibold">{feat.title || "Feature Title"}</h4>
              <p className="text-black">{feat.text || "Feature description..."}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
