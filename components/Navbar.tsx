"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const mainNavLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Collections", href: "/shop" },
  { name: "Bridal", href: "/shop" },
  { name: "Rentals", href: "/shop" },
  { name: "Perfumes", href: "/shop" },
];

const menuLinks = [
  { name: "Search", href: "/shop" },
  { name: "Cart", href: "/cart" },
  { name: "Contact", href: "#contact" },
  { name: "Login", href: "/login" },
  { name: "Signup", href: "/signup" },
  { name: "Admin Login", href: "/admin-login" },
];

const navBubbleClass =
  "shrink-0 rounded-full border border-[#B87333]/25 bg-white/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-950 shadow-sm backdrop-blur-2xl transition hover:border-[#B87333]/70 hover:bg-[#B87333]/15 hover:text-[#B87333]";

const menuBubbleClass =
  "rounded-3xl border border-white/40 bg-white/35 px-6 py-5 text-sm font-semibold uppercase tracking-[0.18em] text-stone-950 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-3xl transition hover:border-[#B87333]/60 hover:bg-[#B87333]/15 hover:text-[#B87333]";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 rounded-b-[34px] border-b border-[#B87333]/10 px-5 py-3 backdrop-blur-3xl transition-all duration-300 md:px-10 ${
        scrolled
          ? "bg-[#FFFAF3]/35 shadow-[0_16px_45px_rgba(0,0,0,0.10)]"
          : "bg-[#FFFAF3]/70 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo/adams-elite-logo.png"
            alt="Adams Elite Logo"
            width={105}
            height={44}
            priority
          />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="flex gap-2 overflow-x-auto px-2 py-1">
            {mainNavLinks.map((link) => (
              <Link key={link.name} href={link.href} className={navBubbleClass}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((current) => !current)}
          className="shrink-0 rounded-full border border-[#B87333]/25 bg-white/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-stone-950 shadow-sm backdrop-blur-2xl transition hover:bg-[#B87333]/15 hover:text-[#B87333]"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute left-5 right-5 top-full z-50 mt-3 rounded-[34px] border border-white/35 bg-[#FFFAF3]/35 px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-3xl">
          <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            {menuLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={menuBubbleClass}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}