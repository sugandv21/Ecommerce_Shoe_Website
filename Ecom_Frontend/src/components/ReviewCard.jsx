import React from "react";
import { Star } from "lucide-react"; 
import user2 from "../assets/images/user1.png";
import user1 from "../assets/images/user2.png";

const ReviewCard = ({ userImg, name, location, title, rating, review }) => {
  return (
    <div className="border rounded-md p-4 mb-6 flex flex-col md:flex-row gap-10 md:items-center">
      {/* Left Section */}
      {/* Left Section */}
<div className="flex flex-col items-center md:items-start">
  <div className="flex items-center gap-3">
    <img
      src={userImg}
      alt={name}
      className="w-14 h-14 rounded-full border"
    />
    <div>
      <p className="font-bold">Reviewed by {name}</p>
      <p className="text-sm">From: {location}</p>
    </div>
  </div>

  <div className="mt-4 space-y-2">
    {["Fit", "Comfort", "Value for Money", "Quality"].map((label) => (
      <div key={label} className="flex items-center gap-2">
        <span className="min-w-[140px] whitespace-nowrap">{label}</span>
        <div className="flex text-yellow-500">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star key={i} size={16} fill="gold" stroke="gold" />
            ))}
        </div>
      </div>
    ))}
  </div>
</div>


      {/* Right Section */}
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Overall rating</span>
          <div className="flex text-yellow-500">
            {Array(rating)
              .fill(0)
              .map((_, i) => (
                <Star key={i} size={16} fill="gold" stroke="gold" />
              ))}
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-700">{review}</p>

        <p className="mt-3 text-sm">
          <span className="font-medium">{name}</span> would recommend this
          product <span className="text-green-600">✔</span>
        </p>
      </div>
    </div>
  );
};

export default function Reviews() {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Reviews:</h2>
      <ReviewCard
        userImg={user1}
        name="Beverley"
        location="Weymouth"
        title="Super Looking"
        rating={5}
        review="Very pleased with the super fast delivery and packaging. Shoes are very good quality and superb See more..."
      />
      <ReviewCard
        userImg={user2}
        name="Beverley"
        location="Weymouth"
        title="Super Looking"
        rating={5}
        review="Very pleased with the super fast delivery and packaging. Shoes are very good quality and superb See more..."
      />
    </div>
  );
}
