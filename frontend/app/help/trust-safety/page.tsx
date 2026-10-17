import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help | Trust & Safety",
  description: "How Wearnova keeps its marketplace safe for everyone.",
};

export default function TrustSafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/help"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="size-3.5" />
        Back to Help Center
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-4">Trust and Safety</h1>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Our Commitment</h2>
          <p>
            Wearnova is built on trust. We work hard to create a safe marketplace where buyers and
            sellers can transact with confidence.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Buyer Protection</h2>
          <p>
            If an item doesn&apos;t arrive or doesn&apos;t match the listing description, we&apos;ll help
            you get a refund. Our Buyer Protection covers every purchase made on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Community Guidelines</h2>
          <p>
            We expect all users to treat each other with respect. Harassment, fraud, and listing prohibited
            items are not tolerated. Report any concerns to our support team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Data Privacy</h2>
          <p>
            We take your privacy seriously. See our <Link href="/privacy" className="text-brand-primary hover:underline">Privacy Center</Link> and{" "}
            <Link href="/cookies" className="text-brand-primary hover:underline">Cookie Policy</Link> for details on how we handle your data.
          </p>
        </section>
      </div>
    </div>
  );
}
