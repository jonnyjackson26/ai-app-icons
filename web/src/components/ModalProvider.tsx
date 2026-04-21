"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AuthModal from "./AuthModal";
import BillingModal from "./BillingModal";

type AuthReason = "sign-in" | "quota";
type BillingIntent = "default" | "success" | "canceled";

interface ModalContextValue {
  openAuth: (reason?: AuthReason) => void;
  closeAuth: () => void;
  openBilling: (intent?: BillingIntent) => void;
  closeBilling: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModals(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModals must be used inside <ModalProvider>");
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<AuthReason>("sign-in");
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingIntent, setBillingIntent] = useState<BillingIntent>("default");

  const openAuth = useCallback((reason: AuthReason = "sign-in") => {
    setAuthReason(reason);
    setAuthOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const openBilling = useCallback((intent: BillingIntent = "default") => {
    setBillingIntent(intent);
    setBillingOpen(true);
  }, []);
  const closeBilling = useCallback(() => setBillingOpen(false), []);

  const value = useMemo(
    () => ({ openAuth, closeAuth, openBilling, closeBilling }),
    [openAuth, closeAuth, openBilling, closeBilling],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AuthModal open={authOpen} onClose={closeAuth} reason={authReason} />
      <BillingModal
        open={billingOpen}
        onClose={closeBilling}
        intent={billingIntent}
      />
    </ModalContext.Provider>
  );
}
