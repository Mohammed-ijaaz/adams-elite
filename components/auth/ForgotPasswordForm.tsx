"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    setIsSending(true);
    setMessage("");

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setIsSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#FFFAF3] px-6 py-20">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md rounded-[34px] border border-[#B87333]/15 bg-white/70 p-8 shadow-sm backdrop-blur-2xl"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
          Forgot Password
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Reset Password
        </h1>

        <p className="mt-4 text-sm leading-6 text-stone-600">
          Enter your email. We’ll send you a reset link.
        </p>

        <div className="mt-6">
          <label className="text-sm font-medium text-stone-700">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
            placeholder="you@example.com"
          />
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <button
          disabled={isSending}
          className="mt-6 w-full rounded-full bg-stone-950 px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
        >
          {isSending ? "Sending..." : "Send Reset Email"}
        </button>

        <p className="mt-6 text-center text-sm text-stone-600">
          Remember password?{" "}
          <Link href="/login" className="font-medium text-[#B87333]">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}