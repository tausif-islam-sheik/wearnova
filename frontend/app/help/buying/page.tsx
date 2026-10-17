import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help | Buying",
  description: "Everything you need to know about purchasing on Wearnova.",
};

export default function HelpBuyingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/help"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="size-3.5" />
        Back to Help Center
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-4">Buying on Wearnova</h1>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">How to Buy</h2>
          <p>
            Browse listings, use filters to narrow down your search, and when you find something you love,
            simply purchase it. Your payment is held securely until you confirm receipt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Shipping &amp; Returns</h2>
          <p>
            Shipping costs and times vary by seller. Check the listing for details. If an item doesn&apos;t
            match its description, you&apos;re covered by our Buyer Protection policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Secure Payments</h2>
          <p>
            All transactions are processed securely. Your payment information is never shared with sellers.
            We&apos;ll release funds to the seller only after you confirm the item has arrived.
          </p>
        </section>
      </div>
    </div>
  );
}
