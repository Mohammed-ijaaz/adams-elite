"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  gstPercent?: number;
  stockQuantity?: number;
}

export default function CartPageClient() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("adams-elite-cart");
    setCartItems(savedCart ? JSON.parse(savedCart) : []);
  }, []);

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("adams-elite-cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const increaseQuantity = (id: number) => {
    const item = cartItems.find((cartItem) => cartItem.id === id);

    if (!item) return;

    const availableStock = item.stockQuantity ?? 999999;

    if (item.quantity >= availableStock) {
      alert(`Only ${availableStock} quantity available.`);
      return;
    }

    const updatedCart = cartItems.map((cartItem) =>
      cartItem.id === id
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    );

    saveCart(updatedCart);
  };

  const decreaseQuantity = (id: number) => {
    const updatedCart = cartItems
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };

  const removeItem = (id: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    saveCart(updatedCart);
  };

  if (cartItems.length === 0) {
    return (
      <section className="bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
            Cart
          </p>

          <h1 className="mt-4 text-5xl font-semibold text-stone-950">
            Your Cart is Empty
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-stone-600">
            Add products from the shop to see them here.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-block rounded-full bg-stone-950 px-8 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333]"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-6 py-20 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Cart
        </p>

        <h1 className="mt-4 text-5xl font-semibold text-stone-950">
          Your Cart
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {cartItems.map((item) => {
              const availableStock = item.stockQuantity ?? 0;
              const stockLimited = availableStock > 0;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm md:flex-row md:items-center"
                >
                  <div className="relative h-32 w-full overflow-hidden rounded-xl bg-stone-100 md:w-32">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-[#B87333]">{item.category}</p>

                    <h2 className="mt-1 text-xl font-semibold text-stone-950">
                      {item.name}
                    </h2>

                    <p className="mt-2 text-stone-600">₹{item.price}</p>

                    <p className="mt-1 text-xs text-stone-500">
                      GST {item.gstPercent || 3}% included
                    </p>

                    {stockLimited && (
                      <p className="mt-1 text-xs text-stone-500">
                        Available stock: {availableStock}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      className="h-9 w-9 rounded-full border border-stone-200"
                    >
                      -
                    </button>

                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseQuantity(item.id)}
                      disabled={stockLimited && item.quantity >= availableStock}
                      className="h-9 w-9 rounded-full border border-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-stone-950">
                      ₹{item.price * item.quantity}
                    </p>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="mt-2 text-sm text-red-600 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-2xl bg-[#F7F1E8] p-6">
            <h2 className="text-2xl font-semibold text-stone-950">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartTotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>Confirmed later</span>
              </div>
            </div>

            <div className="mt-6 border-t border-stone-300 pt-5">
              <div className="flex justify-between text-xl font-semibold text-stone-950">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-full bg-stone-950 px-6 py-4 text-center text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333]"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}