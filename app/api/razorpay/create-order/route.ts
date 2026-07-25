import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface IncomingItem {
  id: number;
  quantity: number;
}

interface ValidatedItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  gstPercent: number;
  stockQuantity: number;
}

async function createRazorpayOrder(amount: number) {
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
      receipt: `AE-${Date.now()}`,
      notes: {
        source: "Adams Elite Website",
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.description || "Could not create Razorpay order.");
  }

  return result;
}

export async function POST(request: Request) {
  const body = await request.json();
  const items: IncomingItem[] = body.items || [];

  if (!items.length) {
    return NextResponse.json(
      { message: "Cart is empty." },
      { status: 400 }
    );
  }

  const validatedItems: ValidatedItem[] = [];

  for (const item of items) {
    const quantity = Number(item.quantity || 0);

    if (!item.id || quantity <= 0) {
      return NextResponse.json(
        { message: "Invalid cart item." },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("id, name, category, price, image, stock_quantity, gst_percent")
      .eq("id", item.id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { message: "One product is not available anymore." },
        { status: 400 }
      );
    }

    const stockQuantity = Number(product.stock_quantity || 0);

    if (stockQuantity <= 0) {
      return NextResponse.json(
        { message: `${product.name} is out of stock.` },
        { status: 400 }
      );
    }

    if (quantity > stockQuantity) {
      return NextResponse.json(
        {
          message: `Only ${stockQuantity} quantity available for ${product.name}.`,
        },
        { status: 400 }
      );
    }

    validatedItems.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      image: product.image,
      quantity,
      gstPercent: Number(product.gst_percent || 3),
      stockQuantity,
    });
  }

  const total = validatedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (total <= 0) {
    return NextResponse.json(
      { message: "Invalid order amount." },
      { status: 400 }
    );
  }

  try {
    const razorpayOrder = await createRazorpayOrder(total);

    return NextResponse.json({
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      items: validatedItems,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not create payment order.",
      },
      { status: 500 }
    );
  }
}