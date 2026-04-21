"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useModals } from "./ModalProvider";

// Reads ?billing=success|canceled from the URL (Stripe redirect targets)
// and opens the billing modal accordingly. Then strips the query param so
// the modal doesn't re-open on refresh/back.
export default function BillingQueryListener() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openBilling } = useModals();

  useEffect(() => {
    const billing = params.get("billing");
    if (billing !== "success" && billing !== "canceled") return;

    openBilling(billing);

    const next = new URLSearchParams(params.toString());
    next.delete("billing");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, openBilling, router, pathname]);

  return null;
}
