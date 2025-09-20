import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import giftImg from "../assets/images/gift.png";
import offerImg from "../assets/images/offer.png";

import "swiper/css";
import "swiper/css/pagination";
import "../index.css";
import NewTrending from "../components/NewTrending";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const makeAbsolute = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return (API_URL || "") + url;
  return url;
};

const Home = () => {
  const [banners, setBanners] = useState([]);
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [messageIndex, setMessageIndex] = useState(0);
const messages = [
  {
    text: " Get your first order with free gift",
    text1: "& 50 % offer ",
    className: "text-white bg-[#2F4F4F] border border-black p-4 text-lg",
  },
  {
    text: " Get your first order with free gift",
    text1: "& 50 % offer ",
    className: "text-black bg-white border border-black p-4 text-lg",
  },
];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    axios
      .get(`${API_URL}/banners/`)
      .then((res) => setBanners(res.data.results || []))
      .catch((err) => console.error("Error fetching banners:", err));

    axios
      .get(`${API_URL}/overviews/`)
      .then((res) => {
        const data = res.data.results || [];
        setOverview(data.length > 0 ? data[0] : null);
      })
      .catch((err) => console.error("Error fetching overview:", err));

    axios
      .get(`${API_URL}/categories/`)
      .then((res) => setCategories(res.data.results || []))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  return (
    <div className="w-full">
      <div className="relative w-full h-[400px] md:h-[500px]">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 2000, disableOnInteraction: false }}
          loop={banners.length > 1}
          className="h-full"
        >
          {banners.map((banner, idx) => {
            let textPosClass = "top-6 left-6 md:top-10 md:left-14";
            if (idx === 0) textPosClass = "top-6 left-6 md:top-10 md:left-14";
            if (idx === 1) textPosClass = "top-6 right-6 md:top-10 md:right-14";
            if (idx === 2) textPosClass = "bottom-6 right-6 md:bottom-52 md:right-14";
            if (idx === 3) textPosClass = "bottom-6 left-6 md:bottom-52 md:left-14";

            let buttonPosClass = "bottom-6 left-6 md:bottom-10 md:left-14";
            if (idx === 0) buttonPosClass = "bottom-6 left-6 md:bottom-10 md:left-14";
            if (idx === 1) buttonPosClass = "bottom-6 right-6 md:bottom-20 md:right-36";
            if (idx === 2) buttonPosClass = "top-6 right-6 md:top-96 md:right-14";
            if (idx === 3) buttonPosClass = "top-6 left-6 md:top-80 md:left-14";

            const darkOverlay = idx === 0 || idx === 1 || idx === 3;

            return (
              <SwiperSlide key={banner.id}>
                <div className="relative h-full w-full">
                  <img
                    src={makeAbsolute(banner.image)}
                    alt={banner.alt_text || banner.title || "Banner"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {banner.overlay_text && (
                    <div
                      className={`absolute ${textPosClass} z-20`}
                      style={{ maxWidth: 520 }}
                    >
                      <h2
                        className={`font-bold m-3 text-xl md:text-3xl text-center inline-block px-10 py-2 rounded-xl ${
                          darkOverlay ? "bg-black/60 text-white" : "text-white"
                        }`}
                        aria-hidden={false}
                      >
                        <div
                          className="text-xl font-semibold"
                          dangerouslySetInnerHTML={{ __html: banner.overlay_text }}
                        />
                      </h2>
                    </div>
                  )}

                  {banner.button_text && (
                    <div className={`absolute ${buttonPosClass} z-20`}>
                      <a
                        href={banner.button_link || "#"}
                        className={`inline-block font-semibold px-6 md:px-8 py-3 rounded-md shadow ${
                          darkOverlay ? "bg-white text-black" : "bg-white text-black"
                        }`}
                        aria-label={banner.button_text}
                      >
                        {banner.button_text}
                      </a>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {overview && (
        <div className="text-center max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold mb-4">{overview.title}</h2>
          <p className="text-xl">{overview.description}</p>
        </div>
      )}

      <div className="py-12 px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">What are you looking for?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-20 max-w-7xl mx-auto">
          {categories.length === 0 && (
            <p className="col-span-full text-gray-500">
              No categories available
            </p>
          )}
          {categories.map((cat) => {
            const slug =
              cat.slug || (cat.title || "").toLowerCase().replace(/\s+/g, "-");
            return (
              <Link
                key={cat.id}
                to={`/${slug}`}
                className="block rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={makeAbsolute(cat.image)}
                  alt={cat.title}
                  className="w-[1000px] h-[400px] object-contain"
                  loading="lazy"
                />

                <h3 className="text-xl font-semibold mt-4">{cat.title}</h3>
              </Link>
            );
          })}
        </div>
      </div>

      <NewTrending />

       <div className="relative h-[60px] flex justify-center items-center overflow-hidden">
      {messages.map((msg, idx) => (
        <p
          key={idx}
          className={`${msg.className} absolute w-full text-center transition-opacity duration-700 ${
            idx === messageIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={giftImg}
            alt="gift"
            className="inline-block w-8 h-8 mx-1"
          />
          {msg.text}
          <img
            src={giftImg}
            alt="gift"
            className="inline-block w-8 h-8 mx-1"
          />
           {msg.text1}
          <img
            src={offerImg}
            alt="offer"
            className="inline-block w-8 h-8 mx-1"
          />
        </p>
      ))}
    </div>
    </div>
  );
};

export default Home;
