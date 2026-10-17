import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the Wearnova marketplace.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Acceptance of Terms</h2>
          <p>
            By using Wearnova, you agree to these terms. If you do not agree, please do not use our
            platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">User Responsibilities</h2>
          <p>
            You are responsible for the accuracy of your listings, compliance with applicable laws, and
            maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Prohibited Items</h2>
          <p>
            Counterfeit goods, illegal items, and items that violate intellectual property rights are
            strictly prohibited on Wearnova.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Limitation of Liability</h2>
          <p>
            Wearnova acts as a marketplace platform and is not liable for disputes between buyers
            and sellers. We provide tools to resolve issues but do not guarantee outcomes.
          </p>
        </section>
      </div>
    </div>
  );
}
