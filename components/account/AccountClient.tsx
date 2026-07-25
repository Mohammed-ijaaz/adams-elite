"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user?.email) {
        router.push("/login");
        return;
      }

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      setEmail(data.user.email);
      setIsAdmin(data.user.email === adminEmail);

      localStorage.setItem(
        "adams-elite-user",
        JSON.stringify({
          email: data.user.email,
          role: data.user.email === adminEmail ? "admin" : "customer",
        })
      );

      window.dispatchEvent(new Event("auth-updated"));
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem("adams-elite-user");
    window.dispatchEvent(new Event("auth-updated"));

    router.push("/");
  };

  return (
    <section className="min-h-screen bg-[#FFFAF3] px-6 py-20 md:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
          Account
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          My Account
        </h1>

        <div className="mt-10 rounded-[34px] border border-[#B87333]/15 bg-white/70 p-8 shadow-sm backdrop-blur-2xl">
          <p className="text-sm text-stone-500">Logged in as</p>

          <h2 className="mt-2 text-2xl font-semibold text-stone-950">
            {email || "Loading..."}
          </h2>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="rounded-full bg-stone-950 px-7 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#B87333]"
            >
              Continue Shopping
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-stone-950 px-7 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
              >
                Admin Dashboard
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="rounded-full border border-red-200 px-7 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-red-600 transition hover:bg-red-600 hover:text-white"
            >
              Logout
            </button>
          </div>

          {!isAdmin && (
            <p className="mt-6 text-sm leading-6 text-stone-600">
              This is a customer account. Admin tools are hidden here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}