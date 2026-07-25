"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Order } from "@/data/orders";

function getTodayIndia() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function getYesterdayIndia() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return yesterday.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function getCurrentMonthIndia() {
  const today = getTodayIndia();

  return today.slice(0, 7);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminOrderHistory() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayIndia());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIndia());
  const [mode, setMode] = useState<"date" | "month">("date");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";

      const { data } = await supabase.auth.getUser();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (!data.user?.email || data.user.email !== adminEmail || !token) {
        router.push("/admin-login");
        return;
      }

      setAccessToken(token);
      setChecking(false);
      await loadOrders(token, "date", selectedDate, selectedMonth);
    };

    checkAdmin();
  }, [router]);

  const loadOrders = async (
    token = accessToken,
    selectedMode = mode,
    dateValue = selectedDate,
    monthValue = selectedMonth
  ) => {
    if (!token) return;

    setLoading(true);

    const query =
      selectedMode === "month"
        ? `month=${encodeURIComponent(monthValue)}`
        : `date=${encodeURIComponent(dateValue)}`;

    const response = await fetch(`/api/admin/orders/history?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      alert(result.message || "Could not load order history.");
      return;
    }

    setOrders(result.orders || []);
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

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
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-stone-600 underline"
          >
            ← Back to Active Orders
          </Link>

          <Link
            href="/admin"
            className="text-sm font-medium text-stone-600 underline"
          >
            Admin Dashboard
          </Link>
        </div>

        <p className="mt-8 text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Order History
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Delivered / Cancelled Bills
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          Open a date or month to see completed orders and print old bills.
        </p>

        <div className="mt-8 rounded-[34px] bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="text-sm font-medium text-stone-700">
                Select Date
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setMode("date");
                }}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Select Month
              </label>

              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setMode("month");
                }}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => loadOrders()}
                disabled={loading}
                className="w-full rounded-full bg-stone-950 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
              >
                {loading ? "Loading..." : mode === "month" ? "Load Month" : "Load Date"}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => {
                const today = getTodayIndia();
                setSelectedDate(today);
                setMode("date");
                loadOrders(accessToken, "date", today, selectedMonth);
              }}
              className="rounded-full border border-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
            >
              Today
            </button>

            <button
              onClick={() => {
                const yesterday = getYesterdayIndia();
                setSelectedDate(yesterday);
                setMode("date");
                loadOrders(accessToken, "date", yesterday, selectedMonth);
              }}
              className="rounded-full border border-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
            >
              Yesterday
            </button>

            <button
              onClick={() => {
                const month = getCurrentMonthIndia();
                setSelectedMonth(month);
                setMode("month");
                loadOrders(accessToken, "month", selectedDate, month);
              }}
              className="rounded-full border border-[#B87333] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#B87333] transition hover:bg-[#B87333] hover:text-white"
            >
              This Month
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[34px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-950">
                {mode === "month"
                  ? `Month: ${selectedMonth}`
                  : `Date: ${selectedDate}`}
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                {orders.length} completed order(s)
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F1E8] px-5 py-3">
              <p className="text-sm text-stone-500">Total Value</p>
              <p className="text-2xl font-semibold text-stone-950">
                ₹{totalAmount}
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="mt-8 rounded-[28px] bg-[#F7F1E8] p-10 text-center">
              <h3 className="text-2xl font-semibold text-stone-950">
                No completed orders found
              </h3>

              <p className="mt-3 text-stone-600">
                Delivered and cancelled orders will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {orders.map((order) => {
                const trackingLink = order.trackingToken
                  ? `${window.location.origin}/track/order/${order.trackingToken}`
                  : "";

                return (
                  <div
                    key={order.id}
                    className="rounded-[28px] border border-stone-100 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#B87333]">
                          Order #{order.id}
                        </p>

                        <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                          {order.customerName}
                        </h3>

                        <div className="mt-3 space-y-1 text-sm text-stone-600">
                          <p>Phone: {order.customerPhone}</p>

                          <p>
                            Status:{" "}
                            <span
                              className={`font-semibold uppercase ${
                                order.status === "cancelled"
                                  ? "text-red-700"
                                  : "text-green-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </p>

                          <p>Order Placed: {formatDateTime(order.createdAt)}</p>

                          <p>
                            Completed On: {formatDateTime(order.completedAt)}
                          </p>

                          <p>
                            Payment ID:{" "}
                            <span className="break-all font-medium text-stone-950">
                              {order.razorpayPaymentId || "Not available"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="min-w-56">
                        <Link
                          href={`/admin/orders/${order.id}/bill`}
                          className="block rounded-full bg-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#B87333]"
                        >
                          Print Bill
                        </Link>

                        <Link
                          href={`/admin/orders/${order.id}/qr-slip`}
                          className="mt-3 block rounded-full bg-[#B87333] px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-950"
                        >
                          Print QR Slip
                        </Link>

                        {trackingLink && (
                          <a
                            href={trackingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 block rounded-full border border-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
                          >
                            Track Page
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F7F1E8] p-5">
                      <h4 className="font-semibold text-stone-950">
                        Products
                      </h4>

                      <div className="mt-4 space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={`${order.id}-${item.id}`}
                            className="flex justify-between gap-4 text-sm text-stone-700"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>

                            <span className="font-semibold text-stone-950">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 border-t border-stone-300 pt-4">
                        <div className="flex justify-between text-lg font-semibold text-stone-950">
                          <span>Total</span>
                          <span>₹{order.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}