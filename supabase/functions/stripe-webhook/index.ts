import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { type, user_id, service_id } = session.metadata ?? {};

    if (type === "pro" && user_id) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 31);
      await supabase
        .from("profiles")
        .update({ plan: "pro", plan_expires_at: expiresAt.toISOString() })
        .eq("id", user_id);
    }

    if (type === "boost" && service_id && user_id) {
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 30);
      await supabase
        .from("services")
        .update({ featured_until: featuredUntil.toISOString() })
        .eq("id", service_id)
        .eq("provider_id", user_id);
    }
  }

  // Downgrade on cancellation
  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.status === "canceled" || sub.status === "unpaid") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", sub.customer as string)
        .limit(1);
      if (profiles?.[0]) {
        await supabase
          .from("profiles")
          .update({ plan: "free", plan_expires_at: null })
          .eq("id", profiles[0].id);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
