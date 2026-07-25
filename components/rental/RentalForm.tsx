"use client";

import Image from "next/image";
import { useState } from "react";
import { Product } from "@/data/products";

const idProofTypes = ["Aadhar", "PAN Card", "Driving License", "Voter ID"];

interface RentalFormProps {
  product: Product;
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

export default function RentalForm({ product }: RentalFormProps) {
  const [rentDate, setRentDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [idProofType, setIdProofType] = useState(idProofTypes[0]);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofPreview, setIdProofPreview] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rentalAmount = product.rentalPrice || 0;
  const advanceAmount = product.advanceAmount || 0;

  const handleIdProofChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIdProofFile(file);
    setIdProofPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setRentDate("");
    setReturnDate("");
    setCustomerName("");
    setCustomerPhone("");
    setAlternatePhone("");
    setIdProofType(idProofTypes[0]);
    setIdProofFile(null);
    setIdProofPreview("");
    setNotes("");
  };

  const savePaidRentalOrder = async ({
    paymentResponse,
    razorpayOrderId,
  }: {
    paymentResponse: RazorpayResponse;
    razorpayOrderId: string;
  }) => {
    if (!idProofFile) {
      alert("ID proof image missing.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("productId", String(product.id));
    formData.append("rentDate", rentDate);
    formData.append("returnDate", returnDate);
    formData.append("customerName", customerName);
    formData.append("customerPhone", customerPhone);
    formData.append("alternatePhone", alternatePhone);
    formData.append("idProofType", idProofType);
    formData.append("idProofImage", idProofFile);
    formData.append("notes", notes);
    formData.append("razorpayOrderId", razorpayOrderId);
    formData.append("razorpayPaymentId", paymentResponse.razorpay_payment_id);
    formData.append("razorpaySignature", paymentResponse.razorpay_signature);

    const response = await fetch("/api/rental-orders", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      alert(
        result.message ||
          "Payment done, but rental order could not be saved. Contact shop."
      );
      setIsSubmitting(false);
      return;
    }

    const trackingToken =
      result.rentalOrder?.tracking_token ||
      result.rentalOrder?.trackingToken ||
      "";

    const trackingLink = trackingToken
      ? `${window.location.origin}/track/rental/${trackingToken}`
      : `${window.location.origin}/shop`;

    const shopWhatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

    const whatsappMessage = `
Hi Adams Elite, my rental booking is placed.

Rental ID: #${result.rentalOrder.id}
Payment ID: ${paymentResponse.razorpay_payment_id}

Track My Rental:
${trackingLink}

Product:
${product.name}

Rental Details:
Rent Date: ${rentDate}
Return Date: ${returnDate}
Rental Amount: ₹${rentalAmount}
Advance Paid: ₹${advanceAmount}
Balance Amount: ₹${Math.max(rentalAmount - advanceAmount, 0)}

Customer Details:
Name: ${customerName}
Phone: ${customerPhone}
Alternate Phone: ${alternatePhone || "Not provided"}

ID Proof:
Type: ${idProofType}
Image Link: ${result.idProofUrl || "Saved in admin system"}

Notes:
${notes || "No notes"}
`;

    resetForm();
    setIsSubmitting(false);

    if (shopWhatsappNumber) {
      const whatsappUrl = `https://wa.me/${shopWhatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`;

      window.open(whatsappUrl, "_blank");

      alert(
        "Advance payment successful. WhatsApp will open with your rental tracking link. Tap Send, then your tracking page will open."
      );
    } else {
      alert("Advance payment successful. Your rental tracking page will open.");
    }

    window.location.href = trackingLink;
  };

  const handleRentalPayment = async () => {
    if (
      !rentDate ||
      !returnDate ||
      !customerName ||
      !customerPhone ||
      !idProofFile
    ) {
      alert("Please fill all required rental details.");
      return;
    }

    if (advanceAmount <= 0) {
      alert("Advance amount is missing for this product.");
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

    const response = await fetch("/api/razorpay/create-rental-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Could not start rental payment.");
      setIsSubmitting(false);
      return;
    }

    const razorpayOrderId: string = result.razorpayOrder.id;

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: result.razorpayOrder.amount,
      currency: result.razorpayOrder.currency,
      name: "Adams Elite",
      description: `Rental Advance - ${product.name}`,
      order_id: razorpayOrderId,
      prefill: {
        name: customerName,
        contact: customerPhone,
      },
      notes: {
        product: product.name,
      },
      theme: {
        color: "#B87333",
      },
      modal: {
        ondismiss: () => {
          setIsSubmitting(false);
          alert("Payment cancelled. Rental enquiry not placed.");
        },
      },
      handler: async (paymentResponse) => {
        await savePaidRentalOrder({
          paymentResponse,
          razorpayOrderId,
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
          "Payment failed. Rental enquiry not placed."
      );
      setIsSubmitting(false);
    });

    razorpay.open();
  };

  return (
    <section className="bg-[#FFFAF3] px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-fit rounded-[42px] border border-[#B87333]/15 bg-white/70 p-5 shadow-sm backdrop-blur-2xl">
          <div className="relative h-[420px] overflow-hidden rounded-[34px] bg-stone-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B87333]">
              Rental Product
            </p>

            <h1 className="font-heading mt-3 text-4xl font-semibold text-stone-950">
              {product.name}
            </h1>

            <div className="mt-5 grid gap-3 rounded-[28px] bg-[#F7F1E8] p-5 text-sm text-stone-700">
              <div className="flex justify-between">
                <span>Rental Amount</span>
                <span className="font-semibold text-stone-950">
                  ₹{rentalAmount}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Advance Amount</span>
                <span className="font-semibold text-stone-950">
                  ₹{advanceAmount}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Balance</span>
                <span className="font-semibold text-stone-950">
                  ₹{Math.max(rentalAmount - advanceAmount, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[42px] border border-[#B87333]/15 bg-white/70 p-6 shadow-sm backdrop-blur-2xl md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#B87333]">
            Rental Form
          </p>

          <h2 className="font-heading mt-4 text-5xl font-semibold text-stone-950">
            Complete Rental Details
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-stone-700">
                Rent Date *
              </label>
              <input
                value={rentDate}
                onChange={(event) => setRentDate(event.target.value)}
                type="date"
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Return Date *
              </label>
              <input
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                type="date"
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Name *
              </label>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Phone Number *
              </label>
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Alternate Number
              </label>
              <input
                value={alternatePhone}
                onChange={(event) => setAlternatePhone(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                placeholder="Alternate phone number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                ID Proof Type *
              </label>
              <select
                value={idProofType}
                onChange={(event) => setIdProofType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
              >
                {idProofTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-stone-700">
                Upload ID Proof Image *
              </label>
              <input
                onChange={handleIdProofChange}
                type="file"
                accept="image/*"
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3"
              />

              {idProofPreview && (
                <div className="relative mt-4 h-56 overflow-hidden rounded-2xl bg-stone-100">
                  <Image
                    src={idProofPreview}
                    alt="ID proof preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-stone-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-[#B87333]"
                placeholder="Any special request..."
              />
            </div>
          </div>

          <div className="mt-8 rounded-[28px] bg-[#F7F1E8] p-5">
            <div className="flex justify-between text-sm text-stone-700">
              <span>Rental Amount</span>
              <span className="font-semibold text-stone-950">
                ₹{rentalAmount}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-stone-700">
              <span>Advance Payable Now</span>
              <span className="font-semibold text-stone-950">
                ₹{advanceAmount}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-stone-700">
              <span>Balance Later</span>
              <span className="font-semibold text-stone-950">
                ₹{Math.max(rentalAmount - advanceAmount, 0)}
              </span>
            </div>
          </div>

          <button
            onClick={handleRentalPayment}
            disabled={isSubmitting}
            className="mt-8 w-full rounded-full bg-stone-950 px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#B87333] disabled:bg-stone-400"
          >
            {isSubmitting
              ? "Opening Payment..."
              : `Pay Advance ₹${advanceAmount} & Submit Rental`}
          </button>

          <p className="mt-4 text-center text-xs leading-6 text-stone-500">
            After payment, WhatsApp will open with your rental tracking link.
            Tap Send to keep the tracking link in your WhatsApp chat.
          </p>
        </div>
      </div>
    </section>
  );
}