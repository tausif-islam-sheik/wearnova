import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Wearnova collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Center</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Information We Collect</h2>
          <p>
            We collect information you provide when creating an account, making a purchase, or listing an item.
            This includes your name, email address, shipping address, and payment information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">How We Use Your Information</h2>
          <p>
            Your information is used to process transactions, provide customer support, improve our platform,
            and send relevant communications. We never sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. All transactions are
            encrypted and your payment details are never stored on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2>
          <p>
            You can access, update, or delete your account data at any time from your settings page.
            Contact us if you need assistance with data portability or have privacy concerns.
          </p>
        </section>
      </div>
    </div>
  );
}
