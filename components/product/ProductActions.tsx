"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/lib/supabase";

interface ProductActionsProps {
  product: Product;
}

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  gstPercent: number;
  stockQuantity: number;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      alert("This product is out of stock.");
      return;
    }

    setIsCheckingAuth(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        const redirectTo = `/product/${product.id}`;
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      const savedCart = localStorage.getItem("adams-elite-cart");
      const cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

      const existingItem = cartItems.find((item) => item.id === product.id);

      let updatedCart: CartItem[];

      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          alert(`Only ${product.stockQuantity} quantity available.`);
          return;
        }

        updatedCart = cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [
          ...cartItems,
          {
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
            quantity: 1,
            gstPercent: product.gstPercent || 3,
            stockQuantity: product.stockQuantity,
          },
        ];
      }

      localStorage.setItem("adams-elite-cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cart-updated"));

      alert("Product added to cart.");
    } catch {
      alert("Could not add this product to the cart. Please try again.");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isCheckingAuth}
        className="rounded-full bg-stone-950 px-8 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333] disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isOutOfStock
          ? "Out of Stock"
          : isCheckingAuth
            ? "Checking..."
            : "Add to Cart"}
      </button>

      {product.rentalAvailable && (
        <Link
          href={`/rent/${product.id}`}
          className="rounded-full border border-[#B87333] bg-[#B87333]/10 px-8 py-4 text-center text-sm font-medium uppercase tracking-widest text-[#7A3E1D] transition hover:bg-[#B87333] hover:text-white"
        >
          Rent This Product
        </Link>
      )}

      <button
        type="button"
        className="rounded-full border border-stone-950 px-8 py-4 text-sm font-medium uppercase tracking-widest text-stone-950 transition hover:bg-stone-950 hover:text-white"
      >
        WhatsApp Enquiry
      </button>
    </div>
  );
}
