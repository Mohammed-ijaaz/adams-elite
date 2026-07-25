import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByTrackingToken } from "@/lib/orders";

interface TrackOrderPageProps {
  params: Promise<{
    token: string;
  }>;
}

const statusSteps = [
  {
    key: "new",
    label: "Order Placed",
    description: "Your order has been received.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "Your order has been confirmed by our team.",
  },
  {
    key: "packed",
    label: "Packed",
    description: "Your order is packed and ready.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
];

function formatDateTime(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  const { token } = await params;
  const order = await getOrderByTrackingToken(token);

  if (!order) {
    notFound();
  }

  const isCancelled = order.status === "cancelled";

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
            Track Order
          </p>

          <h1 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
            Order #{order.id}
          </h1>

          <div className="mt-6 grid gap-4 rounded-3xl bg-[#FFFAF3] p-5 text-sm text-stone-700 md:grid-cols-2">
            <p>
              Customer:{" "}
              <span className="font-semibold text-stone-950">
                {order.customerName}
              </span>
            </p>

            <p>
              Phone:{" "}
              <span className="font-semibold text-stone-950">
                {order.customerPhone}
              </span>
            </p>

            <p>
              Total Paid:{" "}
              <span className="font-semibold text-stone-950">
                ₹{order.paymentAmount || order.total}
              </span>
            </p>

            <p>
              Payment:{" "}
              <span className="font-semibold uppercase text-green-700">
                {order.paymentStatus || "paid"}
              </span>
            </p>

            <p>
              Current Status:{" "}
              <span className="font-semibold uppercase text-[#B87333]">
                {order.status}
              </span>
            </p>

            <p>
              Ordered On:{" "}
              <span className="font-semibold text-stone-950">
                {formatDateTime(order.createdAt)}
              </span>
            </p>
          </div>

          {isCancelled ? (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-2xl font-semibold text-red-700">
                Order Cancelled
              </h2>

              <p className="mt-2 text-sm text-red-600">
                This order has been cancelled. Please contact Adams Elite for
                more details.
              </p>

              {order.statusHistory.cancelled && (
                <p className="mt-4 text-sm font-medium text-red-700">
                  Cancelled on: {formatDateTime(order.statusHistory.cancelled)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold text-stone-950">
                Order Timeline
              </h2>

              <div className="mt-6 space-y-5">
                {statusSteps.map((step, index) => {
                  const completed = Boolean(order.statusHistory[step.key]);

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
                            {formatDateTime(order.statusHistory[step.key])}
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

          <div className="mt-10 rounded-3xl bg-[#F7F1E8] p-5">
            <h2 className="text-xl font-semibold text-stone-950">
              Products
            </h2>

            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
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

          <p className="mt-8 text-center text-xs leading-6 text-stone-500">
            For any changes or urgent help, contact Adams Elite directly.
          </p>
        </div>
      </div>
    </section>
  );
}