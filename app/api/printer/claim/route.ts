import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isPrinterRequestAuthorized } from "@/lib/printer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_AFTER_MINUTES = 10;

const orderSelect =
  "id, created_at, customer_name, customer_phone, customer_address, notes, items, total, status, razorpay_order_id, razorpay_payment_id, payment_status, payment_amount";

const rentalSelect =
  "id, created_at, product_name, rent_date, return_date, customer_name, customer_phone, alternate_phone, id_proof_type, rental_amount, advance_amount, notes, status, razorpay_order_id, razorpay_payment_id, payment_status, payment_amount";

async function releaseStaleJobs() {
  const staleBefore = new Date(
    Date.now() - STALE_AFTER_MINUTES * 60 * 1000
  ).toISOString();

  await supabaseAdmin
    .from("print_jobs")
    .update({
      status: "pending",
      claimed_at: null,
      error: "Previous printer attempt timed out and was returned to queue.",
    })
    .eq("status", "printing")
    .lt("claimed_at", staleBefore);
}

async function loadPrintableRecord(jobType: string, recordId: number) {
  if (jobType === "order") {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(orderSelect)
      .eq("id", recordId)
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Order was not found.");
    }

    return data;
  }

  if (jobType === "rental") {
    const { data, error } = await supabaseAdmin
      .from("rental_orders")
      .select(rentalSelect)
      .eq("id", recordId)
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Rental order was not found.");
    }

    return data;
  }

  throw new Error("Unsupported print job type.");
}

export async function POST(request: Request) {
  if (!isPrinterRequestAuthorized(request)) {
    return NextResponse.json(
      { message: "Printer authentication failed." },
      { status: 401 }
    );
  }

  await releaseStaleJobs();

  const { data: candidates, error: fetchError } = await supabaseAdmin
    .from("print_jobs")
    .select("id, job_type, record_id, attempts, requested_at")
    .eq("status", "pending")
    .order("requested_at", { ascending: true })
    .limit(5);

  if (fetchError) {
    return NextResponse.json(
      { message: fetchError.message },
      { status: 500 }
    );
  }

  for (const candidate of candidates || []) {
    const now = new Date().toISOString();
    const nextAttempts = Number(candidate.attempts || 0) + 1;

    const { data: claimedJob, error: claimError } = await supabaseAdmin
      .from("print_jobs")
      .update({
        status: "printing",
        claimed_at: now,
        attempts: nextAttempts,
        error: null,
      })
      .eq("id", candidate.id)
      .eq("status", "pending")
      .select("id, job_type, record_id, attempts, requested_at")
      .maybeSingle();

    if (claimError || !claimedJob) {
      continue;
    }

    try {
      const record = await loadPrintableRecord(
        claimedJob.job_type,
        Number(claimedJob.record_id)
      );

      return NextResponse.json({
        job: {
          id: Number(claimedJob.id),
          type: claimedJob.job_type,
          recordId: Number(claimedJob.record_id),
          attempts: Number(claimedJob.attempts || 0),
          requestedAt: claimedJob.requested_at,
          record,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Printable record not found.";

      await supabaseAdmin
        .from("print_jobs")
        .update({
          status: "failed",
          claimed_at: null,
          error: message,
        })
        .eq("id", claimedJob.id);
    }
  }

  return NextResponse.json({ job: null });
}
