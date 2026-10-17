import type { Metadata } from "next";

interface Params {
  params: Promise<{ brand: string }>;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { brand } = await params;
  const name = slugToName(brand);
  return {
    title: `${name} | Shop the Brand`,
    description: `Shop pre-loved ${name} items on Wearnova.`,
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
