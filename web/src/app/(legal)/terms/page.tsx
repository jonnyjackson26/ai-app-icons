import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AI App Icons",
  description: "Terms of Service for AI App Icons.",
};

const EFFECTIVE_DATE = "April 22, 2026";
const CONTACT_EMAIL = "me@jonny-jackson.com";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Effective {EFFECTIVE_DATE}
      </p>

      <p>
        Welcome to AI App Icons (the &ldquo;Service&rdquo;). These Terms of
        Service (&ldquo;Terms&rdquo;) govern your access to and use of the
        Service. By using the Service, you agree to these Terms. If you do not
        agree, do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        AI App Icons is a tool that uses artificial intelligence to generate
        mobile application icon assets (including iOS and Android variants)
        based on text prompts and optional image uploads you provide. Generated
        output is delivered as downloadable image files.
      </p>

      <h2>2. Eligibility and Accounts</h2>
      <p>
        You must be at least 13 years old to use the Service. If you are under
        the age of majority in your jurisdiction, you must have permission from
        a parent or legal guardian. You are responsible for maintaining the
        confidentiality of your account credentials and for all activity that
        occurs under your account.
      </p>

      <h2>3. Plans, Billing, and Usage Limits</h2>
      <p>
        The Service offers a free tier with limited AI generations per week, as
        well as paid plans (&ldquo;Pro&rdquo; and &ldquo;Unlimited&rdquo;) with
        higher or unlimited quotas. Paid plans are billed through our
        third-party payment processor, Stripe. By subscribing, you authorize
        recurring charges to your payment method until you cancel.
      </p>
      <ul>
        <li>Prices, quotas, and plan features may change; we will give reasonable notice of material changes to active subscribers.</li>
        <li>Subscriptions renew automatically until cancelled from the Billing screen.</li>
        <li>Except where required by law, fees are non-refundable.</li>
        <li>Unused quota does not roll over between billing periods.</li>
      </ul>

      <h2>4. Your Content</h2>
      <p>
        &ldquo;Your Content&rdquo; means the prompts, images, and other
        materials you submit to the Service. You retain ownership of Your
        Content. You represent and warrant that you have all rights necessary
        to submit Your Content and that it does not infringe any third-party
        rights or violate any law.
      </p>
      <p>
        You grant us a limited, worldwide, non-exclusive license to host,
        store, process, transmit, and display Your Content solely to operate,
        maintain, and improve the Service, and to process it through our
        third-party AI providers in order to generate output for you.
      </p>

      <h2>5. Generated Output</h2>
      <p>
        Subject to your compliance with these Terms and applicable law, you own
        the icon assets the Service generates for you (&ldquo;Output&rdquo;)
        and may use them for commercial purposes, including in applications you
        publish to the App Store, Google Play, or similar marketplaces. Because
        AI models can produce similar or identical results for similar inputs,
        we cannot guarantee that Output is unique to you, and we make no
        representation that Output is free of third-party rights. You are
        responsible for reviewing Output before use and for clearing any
        third-party rights required for your intended use.
      </p>

      <h2>6. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>generate content that infringes intellectual property, publicity, or privacy rights, including trademarks or logos of third parties you are not authorized to use;</li>
        <li>generate unlawful, defamatory, harassing, hateful, sexual content involving minors, or otherwise harmful content;</li>
        <li>attempt to reverse engineer, scrape, or extract the underlying models, prompts, or training data of the Service or its providers;</li>
        <li>circumvent quotas, rate limits, or access controls, including by creating multiple accounts;</li>
        <li>interfere with or disrupt the Service or its infrastructure.</li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <p>
        The Service relies on third-party providers, including Supabase
        (authentication and database), Stripe (payments), and AI model
        providers for generation. Your use of the Service is also subject to
        those providers&rsquo; terms where applicable. We are not responsible
        for the acts or omissions of third-party providers.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        The Service, including its software, design, and branding, is owned by
        us and our licensors and is protected by intellectual property laws.
        Except for the rights expressly granted in these Terms, no rights are
        granted to you.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Service at any time and cancel any paid plan
        from the Billing screen. We may suspend or terminate your access to
        the Service at any time, with or without notice, if we believe you
        have violated these Terms or if we reasonably believe your use poses a
        risk to the Service or other users. Sections that by their nature
        should survive termination will survive, including ownership,
        disclaimers, limitations of liability, and dispute terms.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
        AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
        IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTY ARISING
        OUT OF COURSE OF DEALING OR USAGE OF TRADE. WE DO NOT WARRANT THAT THE
        SERVICE OR OUTPUT WILL MEET YOUR REQUIREMENTS, BE ERROR-FREE, OR BE
        UNINTERRUPTED.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES WILL NOT
        BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
        PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL. OUR
        AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE
        SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR
        THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM AROSE OR (B) USD
        $50.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You will defend, indemnify, and hold us harmless from any claims,
        damages, liabilities, losses, and expenses (including reasonable
        attorneys&rsquo; fees) arising out of or related to (a) Your Content,
        (b) your use of the Output, or (c) your violation of these Terms or
        applicable law.
      </p>

      <h2>13. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material
        changes, we will update the effective date above and, where
        appropriate, notify you through the Service. Your continued use after
        changes take effect constitutes your acceptance of the revised Terms.
      </p>

      <h2>14. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Utah, without
        regard to conflict-of-laws rules. The state and federal courts located
        in Utah will have exclusive jurisdiction over any dispute arising out
        of or relating to these Terms, except that either party may seek
        injunctive relief in any court of competent jurisdiction.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
