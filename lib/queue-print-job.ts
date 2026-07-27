import { supabaseAdmin } from "./supabase-admin";

type PrintJobType = "order" | "rental";

export async function queuePrintJob(
  jobType: PrintJobType,
  recordId: number
) {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("print_jobs").upsert(
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
  );

  if (error) {
    console.error(
      `Could not queue ${jobType} #${recordId} for automatic printing:`,
      error.message
    );

    return false;
  }

  return true;
}
