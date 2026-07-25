"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated. Please login again.");
    router.push("/login");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#FFFAF3] px-6 py-20">
      <form
        onSubmit={handleUpdatePassword}
        className="w-full max-w-md rounded-[34px] border border-[#B87333]/15 bg-white/70 p-8 shadow-sm backdrop-blur-2xl"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
          New Password
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Set Password
        </h1>

        <p className="mt-4 text-sm leading-6 text-stone-600">
          Enter your new password below.
        </p>

        <div className="mt-6">
          <label className="text-sm font-medium text-stone-700">
            New Password
          </label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
            placeholder="Minimum 6 characters"
          />
        </div>

        <button
          disabled={isSaving}
          className="mt-6 w-full rounded-full bg-stone-950 px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
        >
          {isSaving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </section>
  );
}