"use client";

import { useEffect, useState } from "react";
import { Order } from "@/data/orders";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statuses = ["new", "confirmed", "packed", "delivered", "cancelled"];

interface AdminOrdersProps {
  initialOrders: Order[];
}

function formatDateTime(value?: string) {
  if (!value) return "Not updated";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminOrders({ initialOrders }: AdminOrdersProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reprintingId, setReprintingId] = useState<number | null>(null);

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
    };

    checkAdmin();
  }, [router]);

  const updateStatus = async (orderId: number, status: string) => {
    const order = orders.find((item) => item.id === orderId);

    if (!order) return;

    if (order.status === status) return;

    const confirmChange = window.confirm(
      `Are you sure you want to change Order #${orderId} status from "${order.status}" to "${status}"?`
    );

    if (!confirmChange) {
      return;
    }

    setUpdatingId(orderId);

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: orderId,
        status,
      }),
    });

    const result = await response.json();

    setUpdatingId(null);

    if (!response.ok) {
      alert(result.message || "Could not update order.");
      return;
    }

    setOrders(
      orders.map((orderItem) =>
        orderItem.id === orderId
          ? {
              ...orderItem,
              status,
              statusHistory:
                result.order?.status_history || orderItem.statusHistory,
            }
          : orderItem
      )
    );
  };

  const queueAutoPrint = async (orderId: number) => {
    setReprintingId(orderId);

    const response = await fetch("/api/admin/print-jobs/requeue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        jobType: "order",
        recordId: orderId,
      }),
    });

    const result = await response.json();
    setReprintingId(null);

    if (!response.ok) {
      alert(result.message || "Could not send bill to automatic printer.");
      return;
    }

    alert(`Order #${orderId} was sent to the automatic printer queue.`);
  };

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
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="text-sm font-medium text-stone-600 underline"
          >
            ← Back to Admin Dashboard
          </Link>

          <Link
            href="/admin/orders/history"
            className="text-sm font-medium text-[#B87333] underline"
          >
            View Order History →
          </Link>
        </div>

        <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Admin Orders
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Customer Orders
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          View paid checkout orders, tracking links, payment IDs and order
          status.
        </p>

        <div className="mt-10 rounded-[34px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-950">
            Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="mt-8 rounded-[28px] bg-[#F7F1E8] p-10 text-center">
              <h3 className="text-2xl font-semibold text-stone-950">
                No orders yet
              </h3>

              <p className="mt-3 text-stone-600">
                Paid orders will appear here after customers complete payment.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {orders.map((order) => {
                const trackingLink =
                  typeof window !== "undefined" && order.trackingToken
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
                            Address: {order.customerAddress || "Not provided"}
                          </p>

                          <p>
                            Date:{" "}
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-56">
                        <label className="text-sm font-medium text-stone-700">
                          Status
                        </label>

                        <select
                          value={order.status}
                          onChange={(event) =>
                            updateStatus(order.id, event.target.value)
                          }
                          disabled={updatingId === order.id}
                          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <Link
                          href={`/admin/orders/${order.id}/bill`}
                          className="mt-4 block rounded-full bg-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#B87333]"
                        >
                          Print Bill
                        </Link>

                        <button
                          type="button"
                          onClick={() => queueAutoPrint(order.id)}
                          disabled={reprintingId === order.id}
                          className="mt-3 block w-full rounded-full border border-[#B87333] px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#B87333] transition hover:bg-[#B87333] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {reprintingId === order.id
                            ? "Sending..."
                            : "Send to Auto Printer"}
                        </button>

                        <Link
                          href={`/admin/orders/${order.id}/qr-slip`}
                          className="mt-3 block rounded-full bg-[#B87333] px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-950"
                        >
                          Print QR Slip
                        </Link>
                        
                        <a
                          href={`https://wa.me/91${order.customerPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-full border border-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
                        >
                          WhatsApp Customer
                        </a>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                      <div className="rounded-2xl bg-[#F7F1E8] p-5">
                        <h4 className="font-semibold text-stone-950">
                          Products
                        </h4>

                        <div className="mt-4 space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between gap-4 text-sm text-stone-700"
                            >
                              <div>
                                <p>
                                  {item.name} × {item.quantity}
                                </p>

                                <p className="mt-1 text-xs text-stone-500">
                                  GST {item.gstPercent || 3}% included
                                </p>
                              </div>

                              <span>₹{item.price * item.quantity}</span>
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

                      <div className="rounded-2xl border border-[#B87333]/15 bg-white p-5">
                        <h4 className="font-semibold text-stone-950">
                          Payment Details
                        </h4>

                        <div className="mt-4 space-y-2 text-sm text-stone-600">
                          <p>
                            Status:{" "}
                            <span className="font-semibold uppercase text-green-700">
                              {order.paymentStatus || "paid"}
                            </span>
                          </p>

                          <p>
                            Paid Amount:{" "}
                            <span className="font-semibold text-stone-950">
                              ₹{order.paymentAmount || order.total}
                            </span>
                          </p>

                          <p className="break-all">
                            Razorpay Payment ID:{" "}
                            <span className="font-medium text-stone-950">
                              {order.razorpayPaymentId || "Not available"}
                            </span>
                          </p>

                          <p className="break-all">
                            Razorpay Order ID:{" "}
                            <span className="font-medium text-stone-950">
                              {order.razorpayOrderId || "Not available"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#B87333]/15 bg-[#FFFAF3] p-5">
                      <h4 className="font-semibold text-stone-950">
                        Tracking Details
                      </h4>

                      {trackingLink ? (
                        <div className="mt-4 space-y-3 text-sm text-stone-600">
                          <p className="break-all">
                            Link:{" "}
                            <a
                              href={trackingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-[#B87333] underline underline-offset-4"
                            >
                              {trackingLink}
                            </a>
                          </p>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(trackingLink);
                              alert("Tracking link copied.");
                            }}
                            className="rounded-full bg-stone-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#B87333]"
                          >
                            Copy Tracking Link
                          </button>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-red-600">
                          Tracking link not available.
                        </p>
                      )}

                      <div className="mt-5 grid gap-2 text-sm text-stone-600 md:grid-cols-2">
                        <p>
                          Order Placed:{" "}
                          <span className="font-medium text-stone-950">
                            {formatDateTime(
                              order.statusHistory?.new || order.createdAt
                            )}
                          </span>
                        </p>

                        <p>
                          Confirmed:{" "}
                          <span className="font-medium text-stone-950">
                            {formatDateTime(order.statusHistory?.confirmed)}
                          </span>
                        </p>

                        <p>
                          Packed:{" "}
                          <span className="font-medium text-stone-950">
                            {formatDateTime(order.statusHistory?.packed)}
                          </span>
                        </p>

                        <p>
                          Delivered:{" "}
                          <span className="font-medium text-stone-950">
                            {formatDateTime(order.statusHistory?.delivered)}
                          </span>
                        </p>

                        {order.statusHistory?.cancelled && (
                          <p>
                            Cancelled:{" "}
                            <span className="font-medium text-red-700">
                              {formatDateTime(order.statusHistory.cancelled)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-5 rounded-xl border border-stone-100 p-4 text-sm text-stone-600">
                        <span className="font-medium text-stone-950">
                          Notes:
                        </span>{" "}
                        {order.notes}
                      </div>
                    )}
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