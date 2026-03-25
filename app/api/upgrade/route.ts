import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ plan: "pro", upgraded_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      console.error("Upgrade error:", error);
      return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Upgrade error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}