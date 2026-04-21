import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export const PRICES = {
  pro: process.env.STRIPE_PRICE_PRO,
} as const;

export const TIER_BY_PRICE: Record<string, string> = Object.fromEntries(
  Object.entries(PRICES)
    .filter(([, id]) => !!id)
    .map(([tier, id]) => [id!, tier]),
);
