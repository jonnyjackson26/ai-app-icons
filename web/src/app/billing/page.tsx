import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import BillingActions from "./BillingActions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/billing");

  const admin = createAdminClient();
  const [profileRes, usageRes] = await Promise.all([
    admin
      .from("profiles")
      .select("tier, subscription_status, current_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .single(),
    admin
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
  ]);

  const profile = profileRes.data;
  const usedThisWeek = usageRes.count ?? 0;
  const tier = profile?.tier ?? "free";
  const hasStripeCustomer = !!profile?.stripe_customer_id;

  return (
    <div className="mx-auto w-full max-w-2xl py-10 px-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Billing
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Signed in as {user.email}
      </p>

      <section className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Current plan</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {tier}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Used (7 days)</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {usedThisWeek}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlanCard
          name="Free"
          price="$0"
          features={["5 AI calls / week", "Full wizard access", "Self-host supported"]}
          current={tier === "free"}
        />
        <PlanCard
          name="Pro"
          price="$9.99 / mo"
          features={["100 AI calls / week", "Priority when we scale", "Cancel anytime"]}
          current={tier === "pro"}
          cta={
            tier === "pro" ? null : <BillingActions action="upgrade" tier="pro" />
          }
        />
      </section>

      {hasStripeCustomer && (
        <section className="mt-6">
          <BillingActions action="portal" />
        </section>
      )}

      <section className="mt-10">
        <Link
          href="/billing/cli-keys"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Manage CLI keys →
        </Link>
      </section>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  current,
  cta,
}: {
  name: string;
  price: string;
  features: string[];
  current: boolean;
  cta?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        current
          ? "border-blue-500 dark:border-blue-400"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {name}
        </h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{price}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <div className="mt-4">
        {current ? (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Current plan
          </span>
        ) : (
          cta
        )}
      </div>
    </div>
  );
}
