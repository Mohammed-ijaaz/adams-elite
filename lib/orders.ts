import { Order } from "@/data/orders";
import { supabaseAdmin } from "./supabase-admin";

const orderSelect =
  "id, created_at, completed_at, customer_name, customer_phone, customer_address, notes, items, total, status, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, payment_amount, tracking_token, status_history";

function mapOrder(order: any): Order {
  return {
    id: order.id,
    createdAt: order.created_at,
    completedAt: order.completed_at || null,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerAddress: order.customer_address || "",
    notes: order.notes || "",
    items: order.items || [],
    total: Number(order.total),
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

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(orderSelect)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error.message);
    return [];
  }

  return data.map(mapOrder);
}

export async function getActiveOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(orderSelect)
    .in("status", ["new", "confirmed", "packed"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active orders:", error.message);
    return [];
  }

  return data.map(mapOrder);
}

export async function getOrderById(id: number): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(orderSelect)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapOrder(data);
}

export async function getOrderByTrackingToken(
  trackingToken: string
): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(orderSelect)
    .eq("tracking_token", trackingToken)
    .single();

  if (error || !data) {
    return null;
  }

  return mapOrder(data);
}