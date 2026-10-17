import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help | Selling",
  description: "Learn how to list items, set prices, and ship orders.",
};

export default function HelpSellingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/help"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="size-3.5" />
        Back to Help Center
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-4">Selling on Wearnova</h1>

      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Getting Started</h2>
          <p>
            Listing an item is easy. Take clear photos, write an accurate description, and set a fair price.
            Once your item sells, you&apos;ll receive a shipping label and simply drop it off at the carrier.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Tips for Great Listings</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use natural lighting for your photos</li>
            <li>Include measurements and detailed condition notes</li>
            <li>Price competitively by checking similar listings</li>
            <li>Respond to buyer questions promptly</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Fees &amp; Payouts</h2>
          <p>
            We charge a small commission on each sale to keep the platform running. Payouts are processed
            within 2 business days after the buyer receives their order.
          </p>
        </section>
      </div>
    </div>
  );
}
