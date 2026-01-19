import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body.userId || "");
    const rawFolderId = String(body.rawFolderId || "");
    const docsFolderId = String(body.docsFolderId || "");

    if (!userId || !rawFolderId || !docsFolderId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId/rawFolderId/docsFolderId" },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();
    const { error } = await sb
      .from("users")
      .update({ raw_folder_id: rawFolderId, docs_folder_id: docsFolderId })
      .eq("id", userId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
