import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function createRazorpayOrder(amount: number, productName: string) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are missing in .env.local");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `AE-RENT-${Date.now()}`,
      notes: {
        source: "Adams Elite Rental",
        product: productName,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.description || "Could not create rental payment order."
    );
  }

  return result;
}

export async function POST(request: Request) {
  const body = await request.json();
  const productId = Number(body.productId || 0);

  if (!productId) {
    return NextResponse.json(
      { message: "Product ID is required." },
      { status: 400 }
    );
  }

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("id, name, image, rental_available, rental_price, advance_amount")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return NextResponse.json(
      { message: "Product not found." },
      { status: 404 }
    );
  }

  if (!product.rental_available) {
    return NextResponse.json(
      { message: "This product is not available for rental." },
      { status: 400 }
    );
  }

  const advanceAmount = Number(product.advance_amount || 0);
  const rentalAmount = Number(product.rental_price || 0);

  if (advanceAmount <= 0) {
    return NextResponse.json(
      { message: "Advance amount is not set for this rental product." },
      { status: 400 }
    );
  }

  try {
    const razorpayOrder = await createRazorpayOrder(
      advanceAmount,
      product.name
    );

    return NextResponse.json({
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      product: {
        id: product.id,
        name: product.name,
        image: product.image,
        rentalAmount,
        advanceAmount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not create rental payment order.",
      },
      { status: 500 }
    );
  }
}