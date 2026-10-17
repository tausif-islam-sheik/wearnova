import type { Condition, ListingStatus } from "@/types";

export const conditionTooltips: Record<Condition, string> = {
  new_with_tags: "Item is unworn and has all original tags attached.",
  new_without_tags: "Item is unworn but no longer has original tags.",
  very_good: "Minor signs of wear, in excellent overall condition.",
  good: "Some signs of wear, still in good wearable condition.",
  satisfactory: "Visible signs of wear, fully functional.",
};

export const unavailableMessages: Partial<Record<ListingStatus, string>> = {
  sold: "This item has been sold.",
  reserved: "This item is reserved for another buyer.",
  deactivated: "This listing is no longer available.",
};

export const REPORT_REASONS = [
  "Counterfeit item",
  "Not as described",
  "Damaged item",
  "Inappropriate content",
  "Other",
] as const;

/** What the API expects for each reason label above. */
export const REPORT_REASON_VALUES: Record<(typeof REPORT_REASONS)[number], string> = {
  "Counterfeit item": "counterfeit",
  "Not as described": "not_as_described",
  "Damaged item": "damaged",
  "Inappropriate content": "inappropriate",
  Other: "other",
};

export function brandSlug(brand: string) {
  return brand.replace(/ /g, "-");
}

export function uploadedLabel(dateStr: string): { short: string; exact: string } {
  const date = new Date(dateStr);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const exact = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (days <= 0) return { short: "Today", exact };
  if (days === 1) return { short: "Yesterday", exact };
  if (days < 7) return { short: `${days} days ago`, exact };
  return { short: exact, exact };
}

export function percentOff(price: number, originalPrice?: number): number | null {
  if (originalPrice === undefined || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
