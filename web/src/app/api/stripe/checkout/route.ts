import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, PRICES } from "@/lib/stripe";

// POST /api/stripe/checkout { tier: "pro" } → returns Stripe Checkout URL.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const tier = (body?.tier as string) || "pro";
  const priceId = PRICES[tier as keyof typeof PRICES];
  if (!priceId) {
    return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  // Reuse stripe_customer_id if we've seen this user before.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .upsert({ user_id: user.id, stripe_customer_id: customerId });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/billing?status=success`,
    cancel_url: `${siteUrl}/billing?status=canceled`,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id, tier },
    subscription_data: {
      metadata: { supabase_user_id: user.id, tier },
    },
  });

  return NextResponse.json({ url: session.url });
}
