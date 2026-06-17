import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PRICE_PRO = Deno.env.get("STRIPE_PRO_PRICE_ID") ?? "";
const PRICE_BOOST = Deno.env.get("STRIPE_BOOST_PRICE_ID") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { type, service_id, return_url } = await req.json() as {
      type: "pro" | "boost";
      service_id?: string;
      return_url: string;
    };

    if (!type || !return_url) {
      return new Response(JSON.stringify({ error: "Missing type or return_url" }), { status: 400, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .single();

    let customerId: string = profile?.stripe_customer_id ?? "";
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const successUrl = `${return_url}?checkout=success&type=${type}`;
    const cancelUrl = `${return_url}?checkout=cancelled`;

    if (type === "pro") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: PRICE_PRO, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { type: "pro", user_id: user.id },
        subscription_data: { metadata: { type: "pro", user_id: user.id } },
        payment_method_types: ["card"],
        locale: "pt-BR",
      });
      return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (type === "boost") {
      if (!service_id) return new Response(JSON.stringify({ error: "service_id required for boost" }), { status: 400, headers: corsHeaders });
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        line_items: [{ price: PRICE_BOOST, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { type: "boost", user_id: user.id, service_id },
        payment_intent_data: { metadata: { type: "boost", user_id: user.id, service_id } },
        payment_method_types: ["card"],
        locale: "pt-BR",
      });
      return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
