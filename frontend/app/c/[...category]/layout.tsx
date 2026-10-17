import type { Metadata } from "next";

interface Params {
  params: Promise<{ category: string[] }>;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const name = slugToName(category[category.length - 1] ?? "Category");
  return {
    title: `${name} | Browse the Category`,
    description: `Browse pre-loved ${name.toLowerCase()} items on Wearnova.`,
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
