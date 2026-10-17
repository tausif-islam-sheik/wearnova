import Link from "next/link";
import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how to buy and sell pre-loved items on Wearnova.",
};

const steps = [
  {
    title: "Browse",
    description:
      "Explore thousands of pre-loved fashion items from sellers around the world. Use filters to find exactly what you're looking for.",
  },
  {
    title: "Buy",
    description:
      "Found something you love? Add it to your favorites or purchase it directly. Secure payment processing keeps your transactions safe.",
  },
  {
    title: "Sell",
    description:
      "Clean out your closet and earn money. List your items with photos, set your price, and ship when sold.",
  },
  {
    title: "Enjoy",
    description:
      "Wear your new-to-you pieces with pride. Every purchase gives fashion a second life and reduces waste.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">How It Works</h1>
      <p className="text-muted-foreground mb-10">
        Buying and selling pre-loved fashion on Wearnova is simple.
      </p>

      <div className="space-y-8">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-3">
        <Link href="/search">
          <Button className="bg-brand-primary text-white hover:bg-brand-primary-hover">
            Start browsing
          </Button>
        </Link>
        <Link href="/sell">
          <Button variant="outline">Start selling</Button>
        </Link>
      </div>
    </div>
  );
}
