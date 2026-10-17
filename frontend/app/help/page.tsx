import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help with buying, selling, and staying safe on Wearnova.",
};

const topics = [
  { title: "Selling", href: "/help/selling", description: "Learn how to list items, set prices, and ship orders." },
  { title: "Buying", href: "/help/buying", description: "Everything you need to know about purchasing on Wearnova." },
  { title: "Trust and Safety", href: "/help/trust-safety", description: "How we keep our marketplace safe for everyone." },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
      <p className="text-muted-foreground mb-10">
        Find answers to common questions and learn how to get the most out of Wearnova.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <Link key={topic.href} href={topic.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-foreground mb-1">{topic.title}</h2>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
