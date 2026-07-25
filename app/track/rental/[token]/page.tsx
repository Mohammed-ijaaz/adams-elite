import Link from "next/link";
import { notFound } from "next/navigation";
import { getRentalOrderByTrackingToken } from "@/lib/rental-orders";

interface TrackRentalPageProps {
  params: Promise<{
    token: string;
  }>;
}

const statusSteps = [
  {
    key: "new",
    label: "Rental Placed",
    description: "Your rental booking has been received.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "Your rental booking has been confirmed by our team.",
  },
  {
    key: "collected",
    label: "Collected",
    description: "The rental item has been collected.",
  },
  {
    key: "returned",
    label: "Returned",
    description: "The rental item has been returned.",
  },
];

function formatDateTime(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
}

export default async function TrackRentalPage({
  params,
}: TrackRentalPageProps) {
  const { token } = await params;
  const rentalOrder = await getRentalOrderByTrackingToken(token);

  if (!rentalOrder) {
    notFound();
  }

  const isCancelled = rentalOrder.status === "cancelled";

  return (
    <section className="min-h-screen bg-[#F7F1E8] px-6 py-16 md:px-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-stone-600 underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-8 rounded-[36px] bg-white p-6 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
            Track Rental
          </p>

          <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
            Rental #{rentalOrder.id}
          </h1>

          <div className="mt-6 rounded-3xl bg-[#FFFAF3] p-5">
            <h2 className="text-2xl font-semibold text-stone-950">
              {rentalOrder.productName}
            </h2>

            <div className="mt-5 grid gap-4 text-sm text-stone-700 md:grid-cols-2">
              <p>
                Customer:{" "}
                <span className="font-semibold text-stone-950">
                  {rentalOrder.customerName}
                </span>
              </p>

              <p>
                Phone:{" "}
                <span className="font-semibold text-stone-950">
                  {rentalOrder.customerPhone}
                </span>
              </p>

              <p>
                Rent Date:{" "}
                <span className="font-semibold text-stone-950">
                  {formatDate(rentalOrder.rentDate)}
                </span>
              </p>

              <p>
                Return Date:{" "}
                <span className="font-semibold text-stone-950">
                  {formatDate(rentalOrder.returnDate)}
                </span>
              </p>

              <p>
                Rental Amount:{" "}
                <span className="font-semibold text-stone-950">
                  ₹{rentalOrder.rentalAmount}
                </span>
              </p>

              <p>
                Advance Paid:{" "}
                <span className="font-semibold text-stone-950">
                  ₹{rentalOrder.paymentAmount || rentalOrder.advanceAmount}
                </span>
              </p>

              <p>
                Balance:{" "}
                <span className="font-semibold text-stone-950">
                  ₹
                  {Math.max(
                    rentalOrder.rentalAmount - rentalOrder.advanceAmount,
                    0
                  )}
                </span>
              </p>

              <p>
                Payment:{" "}
                <span className="font-semibold uppercase text-green-700">
                  {rentalOrder.paymentStatus || "paid"}
                </span>
              </p>

              <p>
                Current Status:{" "}
                <span className="font-semibold uppercase text-[#B87333]">
                  {rentalOrder.status}
                </span>
              </p>

              <p>
                Booked On:{" "}
                <span className="font-semibold text-stone-950">
                  {formatDateTime(rentalOrder.createdAt)}
                </span>
              </p>
            </div>
          </div>

          {isCancelled ? (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-2xl font-semibold text-red-700">
                Rental Cancelled
              </h2>

              <p className="mt-2 text-sm text-red-600">
                This rental booking has been cancelled. Please contact Adams
                Elite for more details.
              </p>

              {rentalOrder.statusHistory.cancelled && (
                <p className="mt-4 text-sm font-medium text-red-700">
                  Cancelled on:{" "}
                  {formatDateTime(rentalOrder.statusHistory.cancelled)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-stone-950">
                Rental Timeline
              </h2>

              <div className="mt-6 space-y-5">
                {statusSteps.map((step, index) => {
                  const completed = Boolean(
                    rentalOrder.statusHistory[step.key]
                  );

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                            completed
                              ? "bg-[#B87333] text-white"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {index + 1}
                        </div>

                        {index !== statusSteps.length - 1 && (
                          <div
                            className={`mt-2 h-14 w-[2px] ${
                              completed ? "bg-[#B87333]" : "bg-stone-200"
                            }`}
                          />
                        )}
                      </div>

                      <div className="pb-6">
                        <h3
                          className={`text-lg font-semibold ${
                            completed ? "text-stone-950" : "text-stone-400"
                          }`}
                        >
                          {step.label}
                        </h3>

                        <p className="mt-1 text-sm text-stone-600">
                          {step.description}
                        </p>

                        {completed ? (
                          <p className="mt-2 text-sm font-medium text-[#B87333]">
                            {formatDateTime(
                              rentalOrder.statusHistory[step.key]
                            )}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-stone-400">
                            Pending
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs leading-6 text-stone-500">
            For any changes or urgent help, contact Adams Elite directly.
          </p>
        </div>
      </div>
    </section>
  );
}