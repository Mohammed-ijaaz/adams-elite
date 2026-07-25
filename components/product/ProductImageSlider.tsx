"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ProductImageSliderProps {
  images: string[];
  alt: string;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

export default function ProductImageSlider({
  images,
  alt,
  autoPlay = false,
  showControls = false,
  className = "",
}: ProductImageSliderProps) {
  const safeImages = images.length > 0 ? images : ["/images/categories/fashion.jpeg"];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!autoPlay || safeImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImage((previous) => (previous + 1) % safeImages.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [autoPlay, safeImages.length]);

  const previousImage = () => {
    setCurrentImage((previous) =>
      previous === 0 ? safeImages.length - 1 : previous - 1
    );
  };

  const nextImage = () => {
    setCurrentImage((previous) => (previous + 1) % safeImages.length);
  };

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      <Image
        src={safeImages[currentImage]}
        alt={alt}
        fill
        unoptimized
        className="object-cover transition duration-700"
      />

      {showControls && safeImages.length > 1 && (
        <>
          <button
            onClick={previousImage}
            className="absolute left-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/50 bg-white/20 px-4 py-3 text-2xl text-white backdrop-blur-xl transition hover:bg-white hover:text-stone-950"
            aria-label="Previous image"
          >
            ‹
          </button>

          <button
            onClick={nextImage}
            className="absolute right-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/50 bg-white/20 px-4 py-3 text-2xl text-white backdrop-blur-xl transition hover:bg-white hover:text-stone-950"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      {safeImages.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {safeImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`h-2.5 w-2.5 rounded-full border border-white/40 transition ${
                currentImage === index ? "bg-[#B87333]" : "bg-white/50"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}