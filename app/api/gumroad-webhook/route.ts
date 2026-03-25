import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const refunded = formData.get("refunded") as string;

    if (!email) {
      return NextResponse.json({ error: "No email in payload" }, { status: 400 });
    }

    if (refunded === "true") {
      await supabase.from("profiles").update({ plan: "free" }).eq("email", email);
      return NextResponse.json({ success: true, action: "downgraded" });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ plan: "pro", upgraded_at: new Date().toISOString() })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ error: "Failed to upgrade user" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "upgraded" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}