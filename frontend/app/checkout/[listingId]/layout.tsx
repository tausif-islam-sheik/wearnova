import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { Listing } from "@/types";

interface Params {
  params: Promise<{ listingId: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { listingId } = await params;
  try {
    const data = await api.get<{ listing?: Listing } & Listing>(`/listings/${listingId}`);
    const listing = data.listing ?? data;
    if (!listing?.title) throw new Error("no listing");
    return {
      title: `Checkout | ${listing.title}`,
      description: `Complete your purchase of ${listing.title} on Wearnova.`,
    };
  } catch {
    return { title: "Checkout" };
  }
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
