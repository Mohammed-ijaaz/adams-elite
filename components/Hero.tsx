"use client";

import { useEffect, useState } from "react";

const slides = [
  "/images/hero/slide-1.jpeg",
  "/images/hero/slide-2.jpeg",
  "/images/hero/slide-3.jpeg",
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % slides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const previousSlide = () => {
    setCurrentSlide((previous) =>
      previous === 0 ? slides.length - 1 : previous - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((previous) => (previous + 1) % slides.length);
  };

  return (
    <section className="bg-[#FFFAF3] px-4 pb-4 md:px-8 md:pb-8">
      <div
        className="relative flex h-[86vh] items-center justify-center overflow-hidden rounded-[42px] bg-cover bg-center px-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] transition-all duration-700"
        style={{ backgroundImage: `url(${slides[currentSlide]})` }}
      >
        <div className="absolute inset-0 bg-black/30" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />

        <button
          onClick={previousSlide}
          className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/45 bg-white/10 px-4 py-3 text-2xl text-white backdrop-blur-xl transition hover:bg-white/80 hover:text-stone-950 md:block"
          aria-label="Previous slide"
        >
          ‹
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/45 bg-white/10 px-4 py-3 text-2xl text-white backdrop-blur-xl transition hover:bg-white/80 hover:text-stone-950 md:block"
          aria-label="Next slide"
        >
          ›
        </button>

        <div className="relative z-20 max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#F3D2B2] drop-shadow md:text-sm">
            Luxury • Bridal • Rentals
          </p>

          <h1 className="font-heading mt-6 bg-gradient-to-r from-[#7A3E1D] via-[#E0A15A] to-[#7A3E1D] bg-clip-text text-5xl font-semibold leading-tight tracking-tight text-transparent drop-shadow-[0_2px_12px_rgba(184,115,51,0.45)] md:text-7xl">
            Elegance Made
            <br />
            For Every Occasion
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base font-medium leading-8 text-[#FFF3E5] drop-shadow md:text-lg">
            Discover premium fashion jewellery, bridal collections, rentals,
            perfumes, handbags and footwear at Adams Elite.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/shop"
              className="rounded-full border border-white/40 bg-white/20 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_8px_30px_rgba(255,255,255,0.12)] backdrop-blur-2xl transition hover:border-[#B87333]/70 hover:bg-[#B87333]/35 hover:text-white"
            >
              Explore Collection
            </a>

            <a
              href="/shop"
              className="rounded-full border border-white/35 bg-white/10 px-10 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-2xl transition hover:border-[#B87333]/70 hover:bg-[#B87333]/35"
            >
              Bridal Rentals
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 w-3 rounded-full border border-white/40 backdrop-blur transition ${
                currentSlide === index ? "bg-[#B87333]" : "bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}