/* ── Brands ── */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoLetter: string;
  productCount: number;
}

export const mockBrands: Brand[] = [
  { id: "br-1", name: "Nike", slug: "nike", logoLetter: "N", productCount: 3 },
  { id: "br-2", name: "Adidas", slug: "adidas", logoLetter: "A", productCount: 2 },
  { id: "br-3", name: "Levi's", slug: "levis", logoLetter: "L", productCount: 2 },
  { id: "br-4", name: "Uniqlo", slug: "uniqlo", logoLetter: "U", productCount: 1 },
  { id: "br-5", name: "Zara", slug: "zara", logoLetter: "Z", productCount: 2 },
  { id: "br-6", name: "H&M", slug: "hm", logoLetter: "H", productCount: 1 },
  { id: "br-7", name: "COS", slug: "cos", logoLetter: "C", productCount: 1 },
  { id: "br-8", name: "Patagonia", slug: "patagonia", logoLetter: "P", productCount: 1 },
  { id: "br-9", name: "The North Face", slug: "the-north-face", logoLetter: "T", productCount: 1 },
  { id: "br-10", name: "Apple", slug: "apple", logoLetter: "A", productCount: 1 },
  { id: "br-11", name: "Samsung", slug: "samsung", logoLetter: "S", productCount: 1 },
  { id: "br-12", name: "Sony", slug: "sony", logoLetter: "S", productCount: 1 },
  { id: "br-13", name: "Nintendo", slug: "nintendo", logoLetter: "N", productCount: 1 },
  { id: "br-14", name: "Louis Vuitton", slug: "louis-vuitton", logoLetter: "L", productCount: 1 },
  { id: "br-15", name: "Gucci", slug: "gucci", logoLetter: "G", productCount: 1 },
  { id: "br-16", name: "Chanel", slug: "chanel", logoLetter: "C", productCount: 1 },
  { id: "br-17", name: "Rolex", slug: "rolex", logoLetter: "R", productCount: 1 },
  { id: "br-18", name: "Acne Studios", slug: "acne-studios", logoLetter: "A", productCount: 1 },
  { id: "br-19", name: "Lululemon", slug: "lululemon", logoLetter: "L", productCount: 1 },
  { id: "br-20", name: "IKEA", slug: "ikea", logoLetter: "I", productCount: 2 },
];

/* ── Transactions ── */
export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  buyer: string;
  gross: number;
  fee: number;
  net: number;
  status: "completed" | "pending" | "refunded";
  payout: string;
  date: string;
}

export const mockTransactions: Transaction[] = [
  { id: "txn-001", productId: "listing-5", productName: "Louis Vuitton Neverfull MM", buyer: "Sophia Chen", gross: 950, fee: 114.70, net: 835.30, status: "completed", payout: "Paid", date: "2026-07-18" },
  { id: "txn-002", productId: "listing-28", productName: "Rolex Datejust 36mm", buyer: "James Okafor", gross: 8500, fee: 1020.70, net: 7479.30, status: "pending", payout: "Pending", date: "2026-07-20" },
  { id: "txn-003", productId: "listing-2", productName: "Nike Air Max 90", buyer: "Emma Larsson", gross: 85, fee: 10.90, net: 74.10, status: "completed", payout: "Paid", date: "2026-07-14" },
  { id: "txn-004", productId: "listing-14", productName: "Nintendo Switch OLED", buyer: "Sophia Chen", gross: 280, fee: 34.30, net: 245.70, status: "completed", payout: "Paid", date: "2026-07-23" },
  { id: "txn-005", productId: "listing-11", productName: "Gucci GG Marmont Bag", buyer: "Yuki Tanaka", gross: 1450, fee: 174.70, net: 1275.30, status: "pending", payout: "Pending", date: "2026-07-24" },
  { id: "txn-006", productId: "listing-20", productName: "Sony WH-1000XM5", buyer: "Marcus Rivera", gross: 220, fee: 27.10, net: 192.90, status: "pending", payout: "Pending", date: "2026-07-25" },
  { id: "txn-007", productId: "listing-4", productName: "Apple AirPods Pro", buyer: "Yuki Tanaka", gross: 140, fee: 17.50, net: 122.50, status: "completed", payout: "Paid", date: "2026-07-13" },
  { id: "txn-008", productId: "listing-9", productName: "Uniqlo Cashmere Jumper", buyer: "Alex Thompson", gross: 55, fee: 7.30, net: 47.70, status: "completed", payout: "Paid", date: "2026-07-24" },
  { id: "txn-009", productId: "listing-29", productName: "Lululemon Align Leggings", buyer: "Emma Larsson", gross: 60, fee: 7.90, net: 52.10, status: "completed", payout: "Paid", date: "2026-07-25" },
  { id: "txn-010", productId: "listing-32", productName: "Brompton C Line Bike", buyer: "Marcus Rivera", gross: 1200, fee: 144.70, net: 1055.30, status: "refunded", payout: "Refunded", date: "2026-07-07" },
];

/* ── Banners (for Settings page) ── */
export interface Banner {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  status: "active";
  order: number;
}

export const mockBanners: Banner[] = [
  { id: "bnr-1", title: "Summer Sale — Up to 60% Off", body: "Discover curated pre-loved fashion at unbeatable prices.", imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80", status: "active", order: 1 },
  { id: "bnr-2", title: "New Arrivals — Designer Edition", body: "The latest luxury finds from top sellers.", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80", status: "active", order: 2 },
  { id: "bnr-3", title: "Sell Your Wardrobe", body: "Turn your unused items into cash. List in minutes.", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80", status: "active", order: 3 },
];

/* ── Helper: generate order short codes ── */
export function shortOrderId(id: string): string {
  const hash = id.replace("ord-", "");
  return `#${hash.slice(0, 8)}`;
}
