import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const productPermalink = formData.get("product_permalink") as string;
    const saleTimestamp = formData.get("sale_timestamp") as string;
    const refunded = formData.get("refunded") as string;

    console.log("Gumroad ping received:", { email, productPermalink, refunded });

    if (!email) {
      return NextResponse.json({ error: "No email in payload" }, { status: 400 });
    }

    // Handle refunds — downgrade back to free
    if (refunded === "true") {
      await supabase
        .from("profiles")
        .update({ plan: "free" })
        .eq("email", email);

      console.log("Refund processed, downgraded to free:", email);
      return NextResponse.json({ success: true, action: "downgraded" });
    }

    // Upgrade to pro
    const { error } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        upgraded_at: saleTimestamp || new Date().toISOString(),
      })
      .eq("email", email);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to upgrade user" }, { status: 500 });
    }

    console.log("Successfully upgraded to pro:", email);
    return NextResponse.json({ success: true, action: "upgraded" });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}