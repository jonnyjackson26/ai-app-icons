import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AI App Icons",
  description: "Privacy Policy for AI App Icons.",
};

const EFFECTIVE_DATE = "April 22, 2026";
const CONTACT_EMAIL = "support@aiappicons.com";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Effective {EFFECTIVE_DATE}
      </p>

      <p>
        This Privacy Policy explains how AI App Icons (the
        &ldquo;Service&rdquo;) collects, uses, and shares information when you
        use the Service. By using the Service, you agree to the practices
        described here.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following categories of information:</p>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign in, we collect
          your email address and a user identifier via our authentication
          provider (Supabase). If you sign in with Google, we receive basic
          profile information from your Google account.
        </li>
        <li>
          <strong>Content you submit.</strong> Prompts, uploaded images, and
          other inputs you provide in order to generate icons, along with the
          generated output and metadata about each generation (timestamps,
          parameters, model used).
        </li>
        <li>
          <strong>Usage and billing information.</strong> Plan tier, number of
          generations, and events such as successful or failed calls. Payment
          is processed by Stripe; we do not store full payment card numbers.
          Stripe provides us with billing identifiers, subscription status, and
          limited card metadata (e.g., last four digits, brand) needed to
          service your subscription.
        </li>
        <li>
          <strong>Technical information.</strong> Log data such as IP address,
          browser type, device information, and timestamps, collected
          automatically as part of operating the Service.
        </li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>to provide, operate, and maintain the Service, including generating icons in response to your prompts;</li>
        <li>to authenticate you, manage your account, and enforce plan quotas;</li>
        <li>to process payments, manage subscriptions, and send billing-related communications;</li>
        <li>to monitor, debug, and improve the Service and to investigate abuse or violations of our Terms;</li>
        <li>to comply with legal obligations and respond to lawful requests.</li>
      </ul>

      <h2>3. Third-Party Processors</h2>
      <p>
        We share information with service providers who process it on our
        behalf, subject to their own privacy and security commitments:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, and storage.
        </li>
        <li>
          <strong>Stripe</strong> — payment processing and subscription
          management.
        </li>
        <li>
          <strong>AI model providers</strong> — prompts and uploaded images are
          transmitted to our generative AI providers to produce output. These
          providers may process your content under their own terms; we use
          providers that, to our knowledge, do not use API content to train
          their models by default. We cannot, however, guarantee provider
          behavior or retention policies.
        </li>
        <li>
          <strong>Hosting and infrastructure providers</strong> used to run the
          Service.
        </li>
      </ul>
      <p>
        We do not sell your personal information, and we do not share it with
        third parties for their own advertising purposes.
      </p>

      <h2>4. Legal Bases (EEA/UK)</h2>
      <p>
        If you are in the European Economic Area or the United Kingdom, we
        process your information on the following legal bases: performance of
        a contract (to provide the Service), our legitimate interests (to
        operate, secure, and improve the Service), consent (where required),
        and compliance with legal obligations.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain account and content data for as long as your account is
        active, and for a reasonable period afterwards for operational,
        security, and legal purposes. Billing records are retained for the
        period required by applicable tax and accounting laws. You can delete
        specific chats at any time from the sidebar; deleting your account
        (see below) removes your account record and associated content except
        where retention is required by law.
      </p>

      <h2>6. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect
        information, including encryption in transit, access controls, and
        segregated infrastructure. No system is fully secure, however, and we
        cannot guarantee the absolute security of information transmitted to or
        stored by the Service.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        Depending on where you live, you may have the right to access,
        correct, delete, or port your personal information, to object to or
        restrict certain processing, and to withdraw consent. To exercise these
        rights, contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You also have
        the right to lodge a complaint with your local data protection
        authority.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not directed to children under 13, and we do not
        knowingly collect personal information from children under 13. If you
        believe a child has provided us with personal information, contact us
        and we will delete it.
      </p>

      <h2>9. International Transfers</h2>
      <p>
        The Service and our providers may process information in countries
        other than your own, including the United States. Where required, we
        rely on appropriate safeguards such as standard contractual clauses
        for international transfers.
      </p>

      <h2>10. Cookies and Local Storage</h2>
      <p>
        We use cookies and browser local storage strictly to keep you signed
        in, remember UI preferences (such as whether the sidebar is
        collapsed), and secure the Service. We do not use advertising or
        cross-site tracking cookies.
      </p>

      <h2>11. Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make
        material changes, we will update the effective date above and, where
        appropriate, notify you through the Service.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions or requests regarding this Privacy Policy? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
