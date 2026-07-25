"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const adminCards = [
  {
    title: "Update Items",
    description: "Add, edit and manage products, prices, stock and QR codes.",
    href: "/admin/items",
  },
  {
    title: "Orders",
    description: "View online orders, payment details and tracking links.",
    href: "/admin/orders",
  },
  {
    title: "Order History",
    description: "View delivered and cancelled bills date/month wise.",
    href: "/admin/orders/history",
  },
  {
    title: "Rentals",
    description: "Manage rental bookings, ID proof, payments and tracking.",
    href: "/admin/rentals",
  },
  {
    title: "Categories",
    description: "Add, edit and manage website categories.",
    href: "/admin/categories",
  },
  {
    title: "Stock Scanner",
    description: "Scan Gofrugal QR and reduce website stock after shop sales.",
    href: "/admin/stock-scanner",
  },
];

export default function AdminHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (!data.user?.email || data.user.email !== adminEmail) {
        router.push("/admin-login");
        return;
      }

      setChecking(false);
    };

    checkAdmin();
  }, [router]);

  if (checking) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#F7F1E8] px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#B87333]">
          Checking Admin Access...
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F7F1E8] px-6 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Adams Elite Admin
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Admin Dashboard
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          Manage products, orders, rentals, categories and website stock.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[34px] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-950 transition group-hover:text-[#B87333]">
                    {card.title}
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-stone-600">
                    {card.description}
                  </p>
                </div>

                <span className="mt-8 inline-flex text-sm font-semibold uppercase tracking-[0.2em] text-[#B87333]">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}