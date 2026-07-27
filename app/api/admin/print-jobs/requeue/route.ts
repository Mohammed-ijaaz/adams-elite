import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const allowedJobTypes = ["order", "rental"];

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

  if (!token || !adminEmail) {
    return false;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  return !error && data.user?.email === adminEmail;
}

export async function POST(request: Request) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json(
      { message: "Admin authentication failed." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const jobType = String(body.jobType || "");
  const recordId = Number(body.recordId || 0);

  if (!allowedJobTypes.includes(jobType) || !recordId) {
    return NextResponse.json(
      { message: "Valid job type and record ID are required." },
      { status: 400 }
    );
  }

  const sourceTable = jobType === "order" ? "orders" : "rental_orders";

  const { data: sourceRecord, error: sourceError } = await supabaseAdmin
    .from(sourceTable)
    .select("id, payment_status")
    .eq("id", recordId)
    .single();

  if (sourceError || !sourceRecord) {
    return NextResponse.json(
      { message: "Paid record was not found." },
      { status: 404 }
    );
  }

  if (sourceRecord.payment_status !== "paid") {
    return NextResponse.json(
      { message: "Only a paid bill can be sent to the automatic printer." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("print_jobs")
    .upsert(
      {
        job_type: jobType,
        record_id: recordId,
        status: "pending",
        requested_at: now,
        claimed_at: null,
        printed_at: null,
        error: null,
      },
      {
        onConflict: "job_type,record_id",
      }
    )
    .select("id, status, requested_at")
    .single();

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ job: data });
}
