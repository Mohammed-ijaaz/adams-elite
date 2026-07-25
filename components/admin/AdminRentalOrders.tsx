"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { RentalOrder } from "@/data/rental-orders";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statuses = ["new", "confirmed", "collected", "returned", "cancelled"];

interface AdminRentalOrdersProps {
  initialRentalOrders: RentalOrder[];
}

function formatDateTime(value?: string) {
  if (!value) return "Not updated";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminRentalOrders({
  initialRentalOrders,
}: AdminRentalOrdersProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [rentalOrders, setRentalOrders] = useState(initialRentalOrders);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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

  const updateStatus = async (rentalId: number, status: string) => {
    const rentalOrder = rentalOrders.find((item) => item.id === rentalId);

    if (!rentalOrder) return;

    if (rentalOrder.status === status) return;

    const confirmChange = window.confirm(
      `Are you sure you want to change Rental #${rentalId} status from "${rentalOrder.status}" to "${status}"?`
    );

    if (!confirmChange) {
      return;
    }

    setUpdatingId(rentalId);

    const response = await fetch("/api/admin/rental-orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: rentalId,
        status,
      }),
    });

    const result = await response.json();

    setUpdatingId(null);

    if (!response.ok) {
      alert(result.message || "Could not update rental order.");
      return;
    }

    setRentalOrders(
      rentalOrders.map((orderItem) =>
        orderItem.id === rentalId
          ? {
              ...orderItem,
              status,
              statusHistory:
                result.rentalOrder?.status_history || orderItem.statusHistory,
            }
          : orderItem
      )
    );
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
        <Link
          href="/admin"
          className="mb-8 inline-block text-sm font-medium text-stone-600 underline"
        >
          ← Back to Admin Dashboard
        </Link>

        <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Admin Rentals
        </p>

        <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
          Rental Enquiries
        </h1>

        <p className="mt-5 max-w-2xl text-stone-600">
          View paid rental bookings, tracking links, ID proof, payment IDs and
          rental status.
        </p>

        <div className="mt-10 rounded-[34px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-950">
            Rentals ({rentalOrders.length})
          </h2>

          {rentalOrders.length === 0 ? (
            <div className="mt-8 rounded-[28px] bg-[#F7F1E8] p-10 text-center">
              <h3 className="text-2xl font-semibold text-stone-950">
                No rental enquiries yet
              </h3>

              <p className="mt-3 text-stone-600">
                Paid rental bookings will appear here after customers complete
                advance payment.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {rentalOrders.map((rentalOrder) => {
                const trackingLink =
                  typeof window !== "undefined" && rentalOrder.trackingToken
                    ? `${window.location.origin}/track/rental/${rentalOrder.trackingToken}`
                    : "";

                return (
                  <div
                    key={rentalOrder.id}
                    className="rounded-[28px] border border-stone-100 p-5"
                  >
                    <div className="grid gap-6 lg:grid-cols-[160px_1fr_240px]">
                      <div className="relative h-40 overflow-hidden rounded-2xl bg-stone-100">
                        {rentalOrder.productImage ? (
                          <Image
                            src={rentalOrder.productImage}
                            alt={rentalOrder.productName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-stone-500">
                            No image
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#B87333]">
                          Rental #{rentalOrder.id}
                        </p>

                        <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                          {rentalOrder.productName}
                        </h3>

                        <div className="mt-4 grid gap-2 text-sm text-stone-600 md:grid-cols-2">
                          <p>
                            Customer:{" "}
                            <span className="font-medium text-stone-950">
                              {rentalOrder.customerName}
                            </span>
                          </p>

                          <p>
                            Phone:{" "}
                            <a
                              href={`https://wa.me/91${rentalOrder.customerPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-[#B87333] underline underline-offset-4"
                            >
                              {rentalOrder.customerPhone}
                            </a>
                          </p>

                          <p>
                            Alternate:{" "}
                            {rentalOrder.alternatePhone || "Not provided"}
                          </p>

                          <p>ID Proof: {rentalOrder.idProofType}</p>

                          <p>
                            Rent Date:{" "}
                            {new Date(rentalOrder.rentDate).toLocaleDateString(
                              "en-IN"
                            )}
                          </p>

                          <p>
                            Return Date:{" "}
                            {new Date(
                              rentalOrder.returnDate
                            ).toLocaleDateString("en-IN")}
                          </p>

                          <p>
                            Created:{" "}
                            {new Date(rentalOrder.createdAt).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#F7F1E8] p-4">
                          <div className="flex justify-between text-sm text-stone-700">
                            <span>Rental Amount</span>
                            <span className="font-semibold text-stone-950">
                              ₹{rentalOrder.rentalAmount}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-between text-sm text-stone-700">
                            <span>Advance Amount</span>
                            <span className="font-semibold text-stone-950">
                              ₹{rentalOrder.advanceAmount}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-between text-sm text-stone-700">
                            <span>Balance Amount</span>
                            <span className="font-semibold text-stone-950">
                              ₹
                              {Math.max(
                                rentalOrder.rentalAmount -
                                  rentalOrder.advanceAmount,
                                0
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#B87333]/15 bg-white p-5">
                          <h4 className="font-semibold text-stone-950">
                            Payment Details
                          </h4>

                          <div className="mt-4 space-y-2 text-sm text-stone-600">
                            <p>
                              Status:{" "}
                              <span className="font-semibold uppercase text-green-700">
                                {rentalOrder.paymentStatus || "paid"}
                              </span>
                            </p>

                            <p>
                              Advance Paid:{" "}
                              <span className="font-semibold text-stone-950">
                                ₹
                                {rentalOrder.paymentAmount ||
                                  rentalOrder.advanceAmount}
                              </span>
                            </p>

                            <p className="break-all">
                              Razorpay Payment ID:{" "}
                              <span className="font-medium text-stone-950">
                                {rentalOrder.razorpayPaymentId ||
                                  "Not available"}
                              </span>
                            </p>

                            <p className="break-all">
                              Razorpay Order ID:{" "}
                              <span className="font-medium text-stone-950">
                                {rentalOrder.razorpayOrderId ||
                                  "Not available"}
                              </span>
                            </p>
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
                                  alert("Rental tracking link copied.");
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
                              Rental Placed:{" "}
                              <span className="font-medium text-stone-950">
                                {formatDateTime(
                                  rentalOrder.statusHistory?.new ||
                                    rentalOrder.createdAt
                                )}
                              </span>
                            </p>

                            <p>
                              Confirmed:{" "}
                              <span className="font-medium text-stone-950">
                                {formatDateTime(
                                  rentalOrder.statusHistory?.confirmed
                                )}
                              </span>
                            </p>

                            <p>
                              Collected:{" "}
                              <span className="font-medium text-stone-950">
                                {formatDateTime(
                                  rentalOrder.statusHistory?.collected
                                )}
                              </span>
                            </p>

                            <p>
                              Returned:{" "}
                              <span className="font-medium text-stone-950">
                                {formatDateTime(
                                  rentalOrder.statusHistory?.returned
                                )}
                              </span>
                            </p>

                            {rentalOrder.statusHistory?.cancelled && (
                              <p>
                                Cancelled:{" "}
                                <span className="font-medium text-red-700">
                                  {formatDateTime(
                                    rentalOrder.statusHistory.cancelled
                                  )}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {rentalOrder.notes && (
                          <div className="mt-4 rounded-xl border border-stone-100 p-4 text-sm text-stone-600">
                            <span className="font-medium text-stone-950">
                              Notes:
                            </span>{" "}
                            {rentalOrder.notes}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-stone-700">
                          Status
                        </label>

                        <select
                          value={rentalOrder.status}
                          onChange={(event) =>
                            updateStatus(rentalOrder.id, event.target.value)
                          }
                          disabled={updatingId === rentalOrder.id}
                          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <Link
                          href={`/admin/rentals/${rentalOrder.id}/bill`}
                          className="mt-5 block rounded-full bg-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#B87333]"
                        >
                          Print Bill
                        </Link>

                        {rentalOrder.idProofUrl && (
                          <a
                            href={rentalOrder.idProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 block rounded-full border border-[#B87333] px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#B87333] transition hover:bg-[#B87333] hover:text-white"
                          >
                            View ID Proof
                          </a>
                        )}

                        <a
                          href={`https://wa.me/91${rentalOrder.customerPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block rounded-full border border-stone-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-stone-950 hover:text-white"
                        >
                          WhatsApp Customer
                        </a>
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