import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const allowedStatuses = [
  "new",
  "confirmed",
  "collected",
  "returned",
  "cancelled",
];

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

export async function PATCH(request: Request) {
  const adminCheck = await checkAdmin(request);

  if (!adminCheck.ok) {
    return NextResponse.json(
      { message: adminCheck.message },
      { status: 401 }
    );
  }

  const body = await request.json();
  const id = Number(body.id);
  const status = String(body.status || "");

  if (!id || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      { message: "Valid rental order ID and status are required." },
      { status: 400 }
    );
  }

  const { data: existingRentalOrder, error: fetchError } = await supabaseAdmin
    .from("rental_orders")
    .select("id, created_at, status, status_history")
    .eq("id", id)
    .single();

  if (fetchError || !existingRentalOrder) {
    return NextResponse.json(
      { message: "Rental order not found." },
      { status: 404 }
    );
  }

  const oldHistory = existingRentalOrder.status_history || {};

  const newHistory = {
    new: oldHistory.new || existingRentalOrder.created_at,
    ...oldHistory,
    [status]: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("rental_orders")
    .update({
      status,
      status_history: newHistory,
    })
    .eq("id", id)
    .select("id, status, status_history")
    .single();

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ rentalOrder: data });
}