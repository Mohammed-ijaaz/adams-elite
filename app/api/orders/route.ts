import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { queuePrintJob } from "@/lib/queue-print-job";

export const runtime = "nodejs";

interface OrderItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  gstPercent?: number;
  stockQuantity?: number;
}

function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("Razorpay secret key is missing.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
}

async function getRazorpayOrder(razorpayOrderId: string) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are missing.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${razorpayOrderId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.description || "Could not verify Razorpay order."
    );
  }

  return result;
}

export async function POST(request: Request) {
  const body = await request.json();

  const customerName = body.customerName;
  const customerPhone = body.customerPhone;
  const customerAddress = body.customerAddress || "";
  const notes = body.notes || "";
  const incomingItems: OrderItem[] = body.items || [];

  const razorpayOrderId = String(body.razorpayOrderId || "");
  const razorpayPaymentId = String(body.razorpayPaymentId || "");
  const razorpaySignature = String(body.razorpaySignature || "");

  if (
    !customerName ||
    !customerPhone ||
    incomingItems.length === 0 ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    return NextResponse.json(
      { message: "Customer, cart and payment details are required." },
      { status: 400 }
    );
  }

  const signatureValid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!signatureValid) {
    return NextResponse.json(
      { message: "Payment verification failed. Order not placed." },
      { status: 400 }
    );
  }

  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("razorpay_payment_id", razorpayPaymentId)
    .maybeSingle();

  if (existingOrder) {
    return NextResponse.json(
      { message: "This payment is already used for another order." },
      { status: 400 }
    );
  }

  const finalItems: OrderItem[] = [];

  for (const item of incomingItems) {
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
        { message: `${item.name} is not available anymore.` },
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

    finalItems.push({
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

  const total = finalItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const expectedAmountInPaise = Math.round(total * 100);

  try {
    const razorpayOrder = await getRazorpayOrder(razorpayOrderId);

    if (Number(razorpayOrder.amount) !== expectedAmountInPaise) {
      return NextResponse.json(
        { message: "Payment amount does not match order amount." },
        { status: 400 }
      );
    }

    if (Number(razorpayOrder.amount_paid || 0) < expectedAmountInPaise) {
      return NextResponse.json(
        { message: "Payment is not fully completed yet." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not verify payment amount.",
      },
      { status: 500 }
    );
  }

  const orderPlacedTime = new Date().toISOString();

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      notes,
      items: finalItems,
      total,
      status: "new",
      status_history: {
        new: orderPlacedTime,
      },
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      payment_status: "paid",
      payment_amount: total,
    })
    .select(
      "id, created_at, customer_name, customer_phone, total, status, tracking_token"
    )
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  for (const item of finalItems) {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("stock_quantity")
      .eq("id", item.id)
      .single();

    const currentStock = Number(product?.stock_quantity || 0);
    const newStock = Math.max(currentStock - item.quantity, 0);

    await supabaseAdmin
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", item.id);
  }

  const printQueued = await queuePrintJob("order", Number(order.id));

  return NextResponse.json({ order, printQueued });
}