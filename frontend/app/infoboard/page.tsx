import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infoboard",
  description: "News, guides, and inspiration from the Wearnova community.",
};

const articles = [
  {
    title: "Spring Fashion Trends 2026",
    excerpt: "Discover the top pre-loved fashion trends for the spring season.",
    date: "June 15, 2026",
  },
  {
    title: "How to Authenticate Designer Pieces",
    excerpt: "Learn the key details to look for when buying pre-owned luxury items.",
    date: "May 28, 2026",
  },
  {
    title: "Sustainable Fashion: Why Pre-Loved Matters",
    excerpt: "The environmental impact of second-hand shopping and how it helps the planet.",
    date: "May 10, 2026",
  },
  {
    title: "Seller Spotlight: Top Sellers of the Month",
    excerpt: "Meet our community members who are making second-hand fashion thrive.",
    date: "April 22, 2026",
  },
  {
    title: "Capsule Wardrobe Guide",
    excerpt: "Build a versatile wardrobe with fewer, better pieces from our marketplace.",
    date: "April 5, 2026",
  },
  {
    title: "Shipping Tips for Sellers",
    excerpt: "Best practices for packaging and shipping items to keep buyers happy.",
    date: "March 18, 2026",
  },
];

export default function InfoboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Infoboard</h1>
      <p className="text-muted-foreground mb-10">
        Stories, guides, and updates from the Wearnova community.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.title} className="transition-colors hover:bg-muted/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
              <h2 className="text-base font-semibold text-foreground mb-1">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground">{article.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
