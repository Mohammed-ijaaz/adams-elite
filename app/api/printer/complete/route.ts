import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isPrinterRequestAuthorized } from "@/lib/printer-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPrinterRequestAuthorized(request)) {
    return NextResponse.json(
      { message: "Printer authentication failed." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const jobId = Number(body.jobId || 0);
  const success = Boolean(body.success);
  const errorMessage = String(body.error || "").slice(0, 1000);

  if (!jobId) {
    return NextResponse.json(
      { message: "Valid print job ID is required." },
      { status: 400 }
    );
  }

  const update = success
    ? {
        status: "printed",
        printed_at: new Date().toISOString(),
        claimed_at: null,
        error: null,
      }
    : {
        status: "failed",
        claimed_at: null,
        error: errorMessage || "Printer reported an unknown error.",
      };

  const { data, error } = await supabaseAdmin
    .from("print_jobs")
    .update(update)
    .eq("id", jobId)
    .select("id, status, printed_at, error")
    .single();

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ job: data });
}
