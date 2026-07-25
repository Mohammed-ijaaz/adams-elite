"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user.email !== adminEmail) {
      await supabase.auth.signOut();
      alert("This email is not allowed for admin login.");
      return;
    }

    localStorage.setItem(
      "adams-elite-user",
      JSON.stringify({
        email: data.user.email,
        role: "admin",
      })
    );

    window.dispatchEvent(new Event("auth-updated"));

    router.push("/admin");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#FFFAF3] px-6 py-20">
      <form
        onSubmit={handleAdminLogin}
        className="w-full max-w-md rounded-[34px] border border-[#B87333]/15 bg-white/70 p-8 shadow-sm backdrop-blur-2xl"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
          Admin Login
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Admin Access
        </h1>

        <p className="mt-4 text-sm leading-6 text-stone-600">
          Login with the official Adams Elite admin email.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-stone-700">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              placeholder="Admin password"
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full rounded-full bg-stone-950 px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
          >
            {isLoading ? "Checking..." : "Login as Admin"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          Forgot password?{" "}
          <Link href="/forgot-password" className="font-medium text-[#B87333]">
            Reset here
          </Link>
        </p>
      </form>
    </section>
  );
}