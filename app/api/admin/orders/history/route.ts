import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const orderSelect =
  "id, created_at, completed_at, customer_name, customer_phone, customer_address, notes, items, total, status, razorpay_order_id, razorpay_payment_id, payment_status, payment_amount, tracking_token, status_history";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.replace("Bearer ", "").trim();
}

async function checkAdmin(request: Request) {
  const token = getBearerToken(request);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!token) {
    return {
      ok: false,
      message: "Admin session missing. Please login again.",
    };
  }

  if (!adminEmail) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_ADMIN_EMAIL missing in .env.local.",
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user?.email) {
    return {
      ok: false,
      message: "Admin session expired. Please login again.",
    };
  }

  if (data.user.email !== adminEmail) {
    return {
      ok: false,
      message: "This email is not allowed as admin.",
    };
  }

  return {
    ok: true,
    email: data.user.email,
  };
}

function mapOrder(order: any) {
  return {
    id: order.id,
    createdAt: order.created_at,
    completedAt: order.completed_at,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerAddress: order.customer_address || "",
    notes: order.notes || "",
    items: order.items || [],
    total: Number(order.total || 0),
    status: order.status || "",
    razorpayOrderId: order.razorpay_order_id || "",
    razorpayPaymentId: order.razorpay_payment_id || "",
    paymentStatus: order.payment_status || "paid",
    paymentAmount: Number(order.payment_amount || order.total || 0),
    trackingToken: order.tracking_token || "",
    statusHistory: order.status_history || {},
  };
}

function getIstDateRange(date: string) {
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getIstMonthRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  const startMonth = `${yearText}-${monthText}-01`;

  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;

  const nextMonthText = String(nextMonth).padStart(2, "0");
  const endMonth = `${nextYear}-${nextMonthText}-01`;

  const start = new Date(`${startMonth}T00:00:00+05:30`);
  const end = new Date(`${endMonth}T00:00:00+05:30`);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function GET(request: Request) {
  const adminCheck = await checkAdmin(request);

  if (!adminCheck.ok) {
    return NextResponse.json(
      { message: adminCheck.message },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");

  let range;

  if (month) {
    range = getIstMonthRange(month);
  } else {
    const selectedDate =
      date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    range = getIstDateRange(selectedDate);
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(orderSelect)
    .in("status", ["delivered", "cancelled"])
    .gte("completed_at", range.start)
    .lt("completed_at", range.end)
    .order("completed_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    orders: (data || []).map(mapOrder),
  });
}