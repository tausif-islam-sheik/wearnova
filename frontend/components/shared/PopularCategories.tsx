import Link from "next/link";
import { Shirt, Sparkles, Baby, Home, Smartphone, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const popularCategories: {
  name: string;
  slug: string;
  icon: LucideIcon;
}[] = [
  { name: "Women", slug: "women", icon: Gem },
  { name: "Men", slug: "men", icon: Shirt },
  { name: "Designer", slug: "designer", icon: Sparkles },
  { name: "Kids", slug: "kids", icon: Baby },
  { name: "Home", slug: "home", icon: Home },
  { name: "Electronics", slug: "electronics", icon: Smartphone },
];

export function PopularCategories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-lg font-semibold text-foreground mb-5">
        Most popular categories
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {popularCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded bg-brand-primary/10 p-5 text-center transition-all duration-200 hover:bg-brand-primary/20 hover:scale-[1.03] hover:shadow-md text-brand-primary"
          >
            <cat.icon className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-sm font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
