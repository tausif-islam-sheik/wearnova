export type Condition = "new_with_tags" | "new_without_tags" | "very_good" | "good" | "satisfactory";

export type ListingStatus = "active" | "sold" | "reserved" | "deactivated";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID_ESCROW"
  | "SHIPPED"
  | "DELIVERED_CONFIRMED"
  | "DISPUTED"
  | "RELEASED_TO_SELLER"
  | "REFUNDED"
  | "CANCELLED";

export type OfferStatus = "pending" | "accepted" | "declined" | "countered" | "expired";

export type UserRole = "user" | "admin";

export type ReportReason = "counterfeit" | "not_as_described" | "damaged" | "inappropriate" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isPhoneVerified?: boolean;
  avatarUrl?: string;
  bio?: string;
  address?: Address;
  ratingsCount: number;
  avgRating: number;
  itemsSold?: number;
  badges: UserBadge[];
  lastSeen: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  verifiedMethods: string[];
  location?: string;
}

export type UserBadge = "frequent_uploads" | "speedy_shipping" | "top_seller" | "trusted";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  isSuspended: boolean;
  createdAt: string;
  lastSeen?: string;
  listingsCount: number;
  ordersCount: number;
}

export interface Address {
  id?: string;
  label?: string | null;
  fullName?: string;
  phone?: string;
  street: string;
  apt?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

export type ShippingMethodId = "standard" | "express";

export interface ShippingMethodInfo {
  id: ShippingMethodId;
  label: string;
  eta: string;
  price: number;
  enabled: boolean;
  freeEligible: boolean;
}

/** Server-computed order pricing (POST /orders/quote). */
export interface Quote {
  listingId: string;
  quantity: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingMethod: ShippingMethodId;
  shippingLabel: string;
  shippingEta: string;
  promo: { code: string; type: string; description: string } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  subcategories: Category[];
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  brand: string;
  size: string;
  condition: Condition;
  material?: string;
  color?: string;
  pattern?: string;
  images: string[];
  sellerId: string;
  categoryId: string;
  categoryPath: string[];
  likesCount: number;
  uploadedAt: string;
  /** Units still available to buy (the API always sends it; mocks may omit it). */
  quantity?: number;
  status: ListingStatus;
  isPromoted?: boolean;
  shippingFree?: boolean;
  /** Seller's average rating and review count (list endpoint only). */
  sellerRating?: number;
  sellerReviews?: number;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  quantity: number;
  shippingCost: number;
  discount?: number;
  promoCode?: string | null;
  shippingMethod?: ShippingMethodId;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string | null;
  listing?: { id: string; title: string; images: string[]; price: number };
  buyer?: { id: string; name: string; email: string };
  seller?: { id: string; name: string; email: string };
  review?: Review | null;
  payment?: Payment | null;
}

export interface Payment {
  id: string;
  orderId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  platformFeeAmount: number;
  platformFeePercent: number;
  sellerPayoutAmount: number;
  stripeTransferId?: string | null;
  status: "pending" | "captured" | "failed" | "refunded";
  capturedAt?: string | null;
  releasedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: OfferStatus;
  message?: string;
  createdAt: string;
  expiresAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface QuestionAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface QuestionReply {
  id: string;
  author: QuestionAuthor;
  text: string;
  createdAt: string;
}

export interface ProductQuestion {
  id: string;
  author: QuestionAuthor;
  text: string;
  createdAt: string;
  replies: QuestionReply[];
}

export interface Conversation {
  id: string;
  listingId: string;
  participantIds: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: "open" | "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface CartItem {
  listingId: string;
  size?: string;
  title?: string;
  brand?: string;
  price?: number;
  image?: string;
  addedAt: string;
}
