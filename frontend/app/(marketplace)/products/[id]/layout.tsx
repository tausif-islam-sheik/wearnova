import { cache } from "react";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { Listing } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const schemaCondition: Record<string, string> = {
  new_with_tags: "https://schema.org/NewCondition",
  new_without_tags: "https://schema.org/NewCondition",
  very_good: "https://schema.org/UsedCondition",
  good: "https://schema.org/UsedCondition",
  satisfactory: "https://schema.org/UsedCondition",
};

const getListing = cache(async (id: string): Promise<Listing | null> => {
  try {
    const data = await api.get<{ listing?: Listing } & Listing>(`/listings/${id}`);
    const listing = data.listing ?? data;
    return listing?.title ? listing : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };

  const description =
    listing.description ??
    `${listing.title} | available on Wearnova for $${listing.price}.`;
  const images = listing.images?.[0] ? [listing.images[0]] : undefined;

  return {
    title: listing.title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      url: `/products/${id}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description,
      images,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: Params & { children: React.ReactNode }) {
  const { id } = await params;
  const listing = await getListing(id);

  const jsonLd = listing && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images,
    brand: { "@type": "Brand", name: listing.brand },
    ...(listing.color && { color: listing.color }),
    ...(listing.material && { material: listing.material }),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${id}`,
      price: listing.price,
      priceCurrency: "USD",
      itemCondition: schemaCondition[listing.condition],
      availability:
        listing.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // `<` is escaped so listing text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </>
  );
}
