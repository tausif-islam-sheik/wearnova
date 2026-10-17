import Link from "next/link";

const popularBrands = [
  "Nike", "Adidas", "Zara", "H&M", "Levi's", "New Balance",
  "Gucci", "Louis Vuitton", "Prada", "Uniqlo", "COS",
  "The North Face", "Patagonia", "Dr. Martens", "Apple", "Samsung",
];

export function PopularBrands() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="text-lg font-semibold text-foreground mb-5">
        Best selling brands
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {popularBrands.map((brand) => (
          <Link
            key={brand}
            href={`/search?brand=${encodeURIComponent(brand)}`}
            className="rounded border border-brand-primary/30 bg-brand-primary/5 px-4 py-2 text-sm font-medium text-brand-primary transition-all duration-200 hover:bg-brand-primary/15 hover:border-brand-primary/50 hover:shadow-sm"
          >
            {brand}
          </Link>
        ))}
      </div>
    </section>
  );
}
