"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface CartItem {
  id: number;
  quantity: number;
}

function getCartCount() {
  if (typeof window === "undefined") return 0;

  const savedCart = localStorage.getItem("adams-elite-cart");

  if (!savedCart) return 0;

  const cartItems: CartItem[] = JSON.parse(savedCart);

  return cartItems.reduce((total, item) => total + item.quantity, 0);
}

export default function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setCount(getCartCount());
    };

    updateCount();

    window.addEventListener("cart-updated", updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("cart-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="rounded-full border border-[#B87333]/25 bg-white/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900 backdrop-blur-xl transition hover:border-[#B87333]/70 hover:bg-[#B87333]/15 hover:text-[#B87333]"
    >
      Cart {count > 0 ? `(${count})` : ""}
    </Link>
  );
}