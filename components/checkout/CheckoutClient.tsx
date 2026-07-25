"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  gstPercent?: number;
  stockQuantity?: number;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailedResponse {
  error?: {
    description?: string;
    reason?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    callback: (response: RazorpayFailedResponse) => void
  ) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

type WindowWithRazorpay = {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
};

function getInclusiveGstAmount(amount: number, gstPercent: number) {
  return amount - amount / (1 + gstPercent / 100);
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutClient() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("adams-elite-cart");
    setCartItems(savedCart ? JSON.parse(savedCart) : []);
  }, []);

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const totalGst = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemAmount = item.price * item.quantity;
      const gstPercent = item.gstPercent || 3;

      return total + getInclusiveGstAmount(itemAmount, gstPercent);
    }, 0);
  }, [cartItems]);

  const getPaidItemsGst = (paidItems: CartItem[]) => {
    return paidItems.reduce((total, item) => {
      const itemAmount = item.price * item.quantity;
      const gstPercent = item.gstPercent || 3;

      return total + getInclusiveGstAmount(itemAmount, gstPercent);
    }, 0);
  };

  const savePaidOrder = async ({
    paymentResponse,
    razorpayOrderId,
    paidItems,
    paidTotal,
  }: {
    paymentResponse: RazorpayResponse;
    razorpayOrderId: string;
    paidItems: CartItem[];
    paidTotal: number;
  }) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerAddress,
        notes,
        items: paidItems,
        total: paidTotal,
        razorpayOrderId,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(
        result.message ||
          "Payment done, but order could not be saved. Contact shop."
      );
      setIsSubmitting(false);
      return;
    }

    const trackingToken =
      result.order?.tracking_token || result.order?.trackingToken || "";

    const trackingLink = trackingToken
      ? `${window.location.origin}/track/order/${trackingToken}`
      : `${window.location.origin}/shop`;

    const paidItemsGst = getPaidItemsGst(paidItems);

    const productLines = paidItems
      .map((item, index) => {
        const gstPercent = item.gstPercent || 3;
        const itemAmount = item.price * item.quantity;
        const itemGst = getInclusiveGstAmount(itemAmount, gstPercent);

        return `${index + 1}. ${item.name} - Qty: ${
          item.quantity
        } - ₹${itemAmount} - GST ${gstPercent}% included: ₹${itemGst.toFixed(
          2
        )}`;
      })
      .join("\n");

    const whatsappMessage = `
Hi Adams Elite, my order is placed.

Order ID: #${result.order.id}
Payment ID: ${paymentResponse.razorpay_payment_id}

Track My Order:
${trackingLink}

Customer Details:
Name: ${customerName}
Phone: ${customerPhone}
Address: ${customerAddress || "Not provided"}

Products:
${productLines}

Total Paid: ₹${paidTotal}
Total GST Included: ₹${paidItemsGst.toFixed(2)}

Notes:
${notes || "No notes"}
`;

    const shopWhatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

    localStorage.removeItem("adams-elite-cart");
    window.dispatchEvent(new Event("cart-updated"));

    setCartItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setNotes("");
    setIsSubmitting(false);

    if (shopWhatsappNumber) {
      const whatsappUrl = `https://wa.me/${shopWhatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`;

      window.open(whatsappUrl, "_blank");

      alert(
        "Payment successful. WhatsApp will open with your tracking link. Tap Send, then your tracking page will open."
      );
    } else {
      alert("Payment successful. Your tracking page will open now.");
    }

    window.location.href = trackingLink;
  };

  const handleRazorpayOrder = async () => {
    if (!customerName || !customerPhone) {
      alert("Please enter your name and phone number.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert("Razorpay Key ID is missing in .env.local");
      return;
    }

    setIsSubmitting(true);

    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      alert("Razorpay could not load. Check internet connection.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cartItems,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Could not start payment.");
      setIsSubmitting(false);
      return;
    }

    const paidItems: CartItem[] = result.items;
    const paidTotal: number = result.total;
    const razorpayOrderId: string = result.razorpayOrder.id;

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: result.razorpayOrder.amount,
      currency: result.razorpayOrder.currency,
      name: "Adams Elite",
      description: "Online Order Payment",
      order_id: razorpayOrderId,
      prefill: {
        name: customerName,
        contact: customerPhone,
      },
      notes: {
        address: customerAddress || "Not provided",
      },
      theme: {
        color: "#B87333",
      },
      modal: {
        ondismiss: () => {
          setIsSubmitting(false);
          alert("Payment cancelled. Order not placed.");
        },
      },
      handler: async (paymentResponse) => {
        await savePaidOrder({
          paymentResponse,
          razorpayOrderId,
          paidItems,
          paidTotal,
        });
      },
    };

    const RazorpayConstructor = (window as unknown as WindowWithRazorpay)
      .Razorpay;

    if (!RazorpayConstructor) {
      alert("Razorpay failed to load.");
      setIsSubmitting(false);
      return;
    }

    const razorpay = new RazorpayConstructor(options);

    razorpay.on("payment.failed", (failedResponse) => {
      alert(
        failedResponse.error?.description ||
          "Payment failed. Order not placed."
      );
      setIsSubmitting(false);
    });

    razorpay.open();
  };

  if (cartItems.length === 0) {
    return (
      <section className="bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
            Checkout
          </p>

          <h1 className="mt-4 text-5xl font-semibold text-stone-950">
            Your Cart is Empty
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-stone-600">
            Add products before checkout.
          </p>

          <Link
            href="/shop"
            className="mt-8 inline-block rounded-full bg-stone-950 px-8 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333]"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-6 py-20 md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#B87333]">
          Checkout
        </p>

        <h1 className="mt-4 text-5xl font-semibold text-stone-950">
          Complete Your Order
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl bg-[#F7F1E8] p-6">
            <h2 className="text-2xl font-semibold text-stone-950">
              Customer Details
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Name
                </label>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Phone Number
                </label>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Address
                </label>
                <textarea
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Delivery address or pickup note"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                  placeholder="Any size, colour, or special request"
                />
              </div>

              <button
                onClick={handleRazorpayOrder}
                disabled={isSubmitting}
                className="w-full rounded-full bg-stone-950 px-6 py-4 text-sm font-medium uppercase tracking-widest text-white transition hover:bg-[#B87333] disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isSubmitting
                  ? "Opening Payment..."
                  : `Pay ₹${cartTotal} & Place Order`}
              </button>

              <p className="text-center text-xs leading-6 text-stone-500">
                After payment, WhatsApp will open with your tracking link. Tap
                Send to keep the tracking link in your WhatsApp chat.
              </p>
            </div>
          </div>

          <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-950">
              Order Summary
            </h2>

            <div className="mt-6 space-y-5">
              {cartItems.map((item) => {
                const gstPercent = item.gstPercent || 3;
                const itemAmount = item.price * item.quantity;
                const itemGst = getInclusiveGstAmount(itemAmount, gstPercent);

                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-stone-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-950">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        Qty: {item.quantity}
                      </p>

                      <p className="mt-1 text-sm text-stone-600">
                        ₹{itemAmount}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        GST {gstPercent}% included: ₹{itemGst.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-t border-stone-200 pt-5">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Total GST Included</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex justify-between text-xl font-semibold text-stone-950">
                <span>Total Payable</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            <p className="mt-5 text-xs leading-6 text-stone-500">
              You can pay using UPI, QR, Google Pay, PhonePe, cards or other
              Razorpay-supported methods.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}