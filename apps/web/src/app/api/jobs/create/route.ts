import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { enqueueJob } from "@/lib/workerClient";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Require a logged-in session user
    const sessionUser = requireUser();

    const sb = supabaseAdmin();

    // Always use the session user id (don’t trust body.userId)
    const userId = sessionUser.id;

    // Fetch user
    const { data: user, error: uErr } = await sb
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (uErr) throw new Error(uErr.message);
    if (!user) throw new Error("User not found");

    if (!user.raw_folder_id || !user.docs_folder_id) {
      throw new Error("Please save RAW + DOCS folder IDs first");
    }

    // Create job
    const { data: job, error: jErr } = await sb
      .from("jobs")
      .insert({
        org_id: user.org_id,
        user_id: user.id,
        status: "queued",
        message: "Queued",
        raw_folder_id: user.raw_folder_id,
        docs_folder_id: user.docs_folder_id,
      })
      .select("*")
      .single();

    if (jErr) throw new Error(jErr.message);
    if (!job) throw new Error("Failed to create job");

    // Tell worker to run this job
    await enqueueJob({ jobId: job.id });

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 400 }
    );
  }
}
