import { RentalOrder } from "@/data/rental-orders";
import { supabaseAdmin } from "./supabase-admin";

const rentalOrderSelect =
  "id, created_at, product_id, product_name, product_image, rent_date, return_date, customer_name, customer_phone, alternate_phone, id_proof_type, id_proof_image, rental_amount, advance_amount, notes, status, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, payment_amount, tracking_token, status_history";

async function createIdProofSignedUrl(filePath: string) {
  if (!filePath) return "";

  const { data } = await supabaseAdmin.storage
    .from("id-proofs")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  return data?.signedUrl || "";
}

function mapRentalOrder(order: any, idProofUrl = ""): RentalOrder {
  return {
    id: order.id,
    createdAt: order.created_at,
    productId: order.product_id,
    productName: order.product_name,
    productImage: order.product_image || "",
    rentDate: order.rent_date,
    returnDate: order.return_date,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    alternatePhone: order.alternate_phone || "",
    idProofType: order.id_proof_type,
    idProofImage: order.id_proof_image,
    idProofUrl,
    rentalAmount: Number(order.rental_amount),
    advanceAmount: Number(order.advance_amount),
    notes: order.notes || "",
    status: order.status || "new",
    razorpayOrderId: order.razorpay_order_id || "",
    razorpayPaymentId: order.razorpay_payment_id || "",
    razorpaySignature: order.razorpay_signature || "",
    paymentStatus: order.payment_status || "pending",
    paymentAmount: Number(order.payment_amount || 0),
    trackingToken: order.tracking_token || "",
    statusHistory: order.status_history || {},
  };
}

export async function getRentalOrders(): Promise<RentalOrder[]> {
  const { data, error } = await supabaseAdmin
    .from("rental_orders")
    .select(rentalOrderSelect)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rental orders:", error.message);
    return [];
  }

  const rentalOrders = await Promise.all(
    data.map(async (order) =>
      mapRentalOrder(order, await createIdProofSignedUrl(order.id_proof_image))
    )
  );

  return rentalOrders;
}

export async function getRentalOrderById(
  id: number
): Promise<RentalOrder | null> {
  const { data, error } = await supabaseAdmin
    .from("rental_orders")
    .select(rentalOrderSelect)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapRentalOrder(data, await createIdProofSignedUrl(data.id_proof_image));
}

export async function getRentalOrderByTrackingToken(
  trackingToken: string
): Promise<RentalOrder | null> {
  const { data, error } = await supabaseAdmin
    .from("rental_orders")
    .select(rentalOrderSelect)
    .eq("tracking_token", trackingToken)
    .single();

  if (error || !data) {
    return null;
  }

  return mapRentalOrder(data);
}