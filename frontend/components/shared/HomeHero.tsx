import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative bg-surface-muted overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20 flex items-center">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            Ready to declutter your closet?
          </h1>
          <p className="text-foreground-muted text-base mb-6">
            Buy and sell pre-loved fashion, electronics, home goods, and more.
            Safe, easy, and secure transactions.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/sell">
              <Button className="bg-brand-primary text-white hover:bg-brand-primary-hover px-6">
                Sell now
              </Button>
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-brand-primary hover:underline font-medium"
            >
              Learn how it works
            </Link>
          </div>
        </div>
      </div>
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-muted via-surface-muted/80 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-brand-primary/5 to-transparent" />
    </section>
  );
}
