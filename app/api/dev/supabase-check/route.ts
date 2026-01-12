import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// Simple diagnostic endpoint to check Supabase connectivity, table existence,
// and basic insert/delete permissions using the anon key.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase env not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)" }, { status: 400 });
  }

  try {
    // 1) Try a lightweight select to check table exists and read permissions
    const selectRes = await supabase.from("chats").select("id").limit(1);
    if (selectRes.error) {
      return NextResponse.json({ ok: false, stage: "select", error: selectRes.error }, { status: 200 });
    }

    // 2) Try an insert & delete round-trip to test write permissions (cleanup afterwards)
    const testRow = {
      messages: [{ type: "text", text: "dev-check" }],
      model: "dev-check",
    } as any;

    const insertRes = await supabase.from("chats").insert(testRow).select().single();
    if (insertRes.error) {
      return NextResponse.json({ ok: false, stage: "insert", error: insertRes.error }, { status: 200 });
    }

    // Cleanup inserted row if possible
    try {
      const insertedId = insertRes.data?.id;
      if (insertedId) {
        await supabase.from("chats").delete().eq("id", insertedId);
      }
    } catch (cleanupErr) {
      // Non-fatal; log and return success but warn
      return NextResponse.json({ ok: true, stage: "insert", warning: "inserted but failed cleanup", cleanupError: String(cleanupErr) }, { status: 200 });
    }

    return NextResponse.json({ ok: true, stage: "all", select: selectRes.data || [], insert: insertRes.data || null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
