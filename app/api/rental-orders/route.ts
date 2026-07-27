import { createHmac, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { queuePrintJob } from "@/lib/queue-print-job";

export const runtime = "nodejs";

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

  const generatedSignature = createHmac("sha256", keySecret)
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

async function uploadIdProof(idProofImage: File) {
  const fileExtension = idProofImage.name.split(".").pop();
  const fileName = `${Date.now()}-${randomUUID()}.${fileExtension}`;
  const filePath = `proofs/${fileName}`;

  const arrayBuffer = await idProofImage.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("id-proofs")
    .upload(filePath, fileBuffer, {
      contentType: idProofImage.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: signedUrlData } = await supabaseAdmin.storage
    .from("id-proofs")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  return {
    filePath,
    signedUrl: signedUrlData?.signedUrl || "",
  };
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const productId = Number(formData.get("productId") || 0);
  const rentDate = String(formData.get("rentDate") || "");
  const returnDate = String(formData.get("returnDate") || "");
  const customerName = String(formData.get("customerName") || "");
  const customerPhone = String(formData.get("customerPhone") || "");
  const alternatePhone = String(formData.get("alternatePhone") || "");
  const idProofType = String(formData.get("idProofType") || "");
  const notes = String(formData.get("notes") || "");
  const idProofImage = formData.get("idProofImage") as File | null;

  const razorpayOrderId = String(formData.get("razorpayOrderId") || "");
  const razorpayPaymentId = String(formData.get("razorpayPaymentId") || "");
  const razorpaySignature = String(formData.get("razorpaySignature") || "");

  if (
    !productId ||
    !rentDate ||
    !returnDate ||
    !customerName ||
    !customerPhone ||
    !idProofType ||
    !idProofImage ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    return NextResponse.json(
      { message: "Required rental/payment details are missing." },
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
      { message: "Payment verification failed. Rental order not placed." },
      { status: 400 }
    );
  }

  const { data: existingRentalOrder } = await supabaseAdmin
    .from("rental_orders")
    .select("id")
    .eq("razorpay_payment_id", razorpayPaymentId)
    .maybeSingle();

  if (existingRentalOrder) {
    return NextResponse.json(
      { message: "This payment is already used for another rental order." },
      { status: 400 }
    );
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, name, image, rental_available, rental_price, advance_amount")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { message: "Rental product not found." },
      { status: 404 }
    );
  }

  if (!product.rental_available) {
    return NextResponse.json(
      { message: "This product is not available for rental." },
      { status: 400 }
    );
  }

  const rentalAmount = Number(product.rental_price || 0);
  const advanceAmount = Number(product.advance_amount || 0);

  if (advanceAmount <= 0) {
    return NextResponse.json(
      { message: "Advance amount is not set for this product." },
      { status: 400 }
    );
  }

  const expectedAmountInPaise = Math.round(advanceAmount * 100);

  try {
    const razorpayOrder = await getRazorpayOrder(razorpayOrderId);

    if (Number(razorpayOrder.amount) !== expectedAmountInPaise) {
      return NextResponse.json(
        { message: "Payment amount does not match advance amount." },
        { status: 400 }
      );
    }

    if (Number(razorpayOrder.amount_paid || 0) < expectedAmountInPaise) {
      return NextResponse.json(
        { message: "Advance payment is not fully completed yet." },
        { status: 400 }
      );
    }

    const uploadedProof = await uploadIdProof(idProofImage);
    const rentalPlacedTime = new Date().toISOString();

    const { data: rentalOrder, error } = await supabaseAdmin
      .from("rental_orders")
      .insert({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image || "",
        rent_date: rentDate,
        return_date: returnDate,
        customer_name: customerName,
        customer_phone: customerPhone,
        alternate_phone: alternatePhone,
        id_proof_type: idProofType,
        id_proof_image: uploadedProof.filePath,
        rental_amount: rentalAmount,
        advance_amount: advanceAmount,
        notes,
        status: "new",
        status_history: {
          new: rentalPlacedTime,
        },
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        payment_status: "paid",
        payment_amount: advanceAmount,
      })
      .select("id, tracking_token")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const printQueued = await queuePrintJob(
      "rental",
      Number(rentalOrder.id)
    );

    return NextResponse.json({
      rentalOrder,
      printQueued,
      idProofUrl: uploadedProof.signedUrl,
      product: {
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
            : "Could not submit rental order.",
      },
      { status: 500 }
    );
  }
}