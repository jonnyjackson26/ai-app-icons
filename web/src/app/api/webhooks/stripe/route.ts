import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, TIER_BY_PRICE } from "@/lib/stripe";

// Stripe webhook entry. Always reads current truth via subscriptions.retrieve()
// and upserts profiles. Naturally idempotent — no dedup table needed.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set — rejecting event with 503.",
    );
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[stripe-webhook] missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error(
      "[stripe-webhook] signature verification failed:",
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad signature" },
      { status: 400 },
    );
  }

  console.log("[stripe-webhook] event:", event.type, "id:", event.id);

  try {
    await handleEvent(event, stripe);
  } catch (e) {
    console.error("[stripe-webhook] handler failed:", event.type, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  console.log("[stripe-webhook] handled OK:", event.type);
  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event, stripe: Stripe) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.client_reference_id || session.metadata?.supabase_user_id || null;
      if (!userId || !session.subscription || !session.customer) return;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      await upsertFromSubscription(userId, session.customer as string, subscription);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      let userId =
        (subscription.metadata?.supabase_user_id as string | undefined) || null;

      // Fallback: Customer Portal changes don't set metadata. Look up by customer.
      if (!userId) {
        const admin = createAdminClient();
        const { data } = await admin
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        userId = data?.user_id ?? null;
      }
      if (!userId) {
        console.warn(
          "[stripe-webhook] subscription event with no resolvable user_id; customer=%s",
          customerId,
        );
        return;
      }
      await upsertFromSubscription(userId, customerId, subscription);
      return;
    }
    default:
      return;
  }
}

async function upsertFromSubscription(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription,
) {
  const admin = createAdminClient();

  // Determine tier from the first price that matches a known tier.
  let tier = "free";
  for (const item of subscription.items.data) {
    const priceId = item.price.id;
    if (TIER_BY_PRICE[priceId]) {
      tier = TIER_BY_PRICE[priceId];
      break;
    }
  }

  // Canceled / incomplete_expired → revert to free.
  const active =
    subscription.status === "active" || subscription.status === "trialing";
  if (!active) tier = "free";

  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number })
    .current_period_end;

  console.log(
    "[stripe-webhook] upsert profile user=%s tier=%s status=%s",
    userId,
    tier,
    subscription.status,
  );

  const { error } = await admin.from("profiles").upsert(
    {
      user_id: userId,
      tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[stripe-webhook] supabase upsert error:", error);
    throw error;
  }
}
