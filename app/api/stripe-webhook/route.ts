import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutSessionCompleted = event.data.object;
      // Then define and call a function to handle the event checkout.session.completed
      console.log("Checkout session completed:", checkoutSessionCompleted);

      const userId = checkoutSessionCompleted.client_reference_id;
      const customerEmail = checkoutSessionCompleted.customer_details?.email;

      if (!userId) {
        console.error("User ID not found in checkout session.");
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
      }

      const supabase = await createServerSupabase();

      const { error } = await supabase
        .from("profiles")
        .update({ plan: "pro", upgraded_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: "Error updating user profile" }, { status: 500 });
      }

      console.log(`User ${userId} upgraded to Pro.`);

      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 });
}
