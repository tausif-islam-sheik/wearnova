"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Clock,
  Users,
  Pencil,
  Tag,
  Truck,
  CheckCircle,
  Star,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Rating } from "@/components/shared/Rating";
import { cn } from "@/lib/utils";
import { ListingCard } from "@/components/shared/ListingCard";
import { AchievementCard } from "@/components/shared/AchievementCard";
import { FollowButton } from "@/components/shared/FollowButton";
import { useListingStore } from "@/stores/useListingStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { mockUsers, mockReviews } from "@/mocks/users";
import { api } from "@/lib/api";
import type { User, Review } from "@/types";

const AVATAR_COLORS = [
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type Tab = "listings" | "reviews";

export default function SellerPage() {
  const params = useParams();
  const listings = useListingStore((s) => s.listings);
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [apiUser, setApiUser] = useState<User | null | undefined>(undefined);

  const username = (params.username as string) ?? "";
  const displayName = username.replace(/-/g, " ");

  useEffect(() => {
    let cancelled = false;
    setApiUser(undefined);
    api.get<{ users: User[] }>(`/users?search=${encodeURIComponent(displayName)}`)
      .then((res) => {
        if (!cancelled) {
          const match = res.users.find(
            (u) => u.name.toLowerCase() === displayName.toLowerCase()
          );
          setApiUser(match ?? null);
        }
      })
      .catch(() => { if (!cancelled) setApiUser(null); });
    return () => { cancelled = true; };
  }, [displayName]);

  const seller = useMemo(
    () =>
      apiUser ??
      mockUsers.find(
        (u) => u.name.toLowerCase() === displayName.toLowerCase()
      ) ??
      (currentUser?.name.toLowerCase() === displayName.toLowerCase()
        ? currentUser
        : undefined),
    [displayName, currentUser, apiUser]
  );

  const isOwnProfile = currentUser?.name.toLowerCase() === displayName.toLowerCase();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", location: "", avatarUrl: "" });
  const { updateProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewEligibility, setReviewEligibility] = useState<{ eligible: boolean; orderId?: string; reason?: string } | null>(null);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (editing && seller) {
      setEditForm({
        name: seller.name ?? "",
        bio: seller.bio ?? "",
        location: seller.location ?? "",
        avatarUrl: seller.avatarUrl ?? "",
      });
    }
  }, [editing, seller]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const { url } = await api.upload<{ url: string }>("/upload?type=avatar", formData);
      setEditForm((f) => ({ ...f, avatarUrl: url }));
    } catch {
      const localUrl = URL.createObjectURL(file);
      setEditForm((f) => ({ ...f, avatarUrl: localUrl }));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(editForm);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  useEffect(() => {
    if (!seller) return;
    api.get<{ reviews: Review[] }>(`/reviews?sellerId=${seller.id}`)
      .then((res) => setReviews(res.reviews))
      .catch(() => setReviews(mockReviews.filter((r) => r.revieweeId === seller.id)));
  }, [seller]);

  useEffect(() => {
    if (!seller || !currentUser) return;
    setReviewEligibility(null);
    api.get<{ eligible: boolean; orderId?: string; reason?: string }>(
      `/reviews/eligibility?sellerId=${seller.id}`,
    ).then(setReviewEligibility).catch(() => setReviewEligibility(null));
  }, [seller, currentUser]);

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    setNewReviewRating(0);
    setNewReviewComment("");
  };

  const sellerListings = useMemo(
    () =>
      seller
        ? listings.filter(
            (l) => l.sellerId === seller.id && l.status === "active"
          )
        : [],
    [seller, listings]
  );

  const sellerAvgRating = seller?.avgRating ?? 0;
  const sellerRatingsCount = seller?.ratingsCount ?? 0;

  if (apiUser === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold">Seller not found</h1>
        <Link
          href="/"
          className="text-brand-primary hover:underline mt-4 inline-block"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header row */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative size-28 shrink-0 md:size-[180px]">
          <div className={`size-full rounded-full flex items-center justify-center text-4xl font-semibold overflow-hidden ${getAvatarColor(editing ? editForm.name || seller.name : seller.name)}`}>
            {(editing ? editForm.avatarUrl : seller.avatarUrl) ? (
              <Image
                src={(editing ? editForm.avatarUrl : seller.avatarUrl)!}
                alt={seller.name}
                width={140}
                height={140}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="leading-none">
                {seller.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            )}
          </div>
          {editing && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {uploading ? (
                <Loader2 className="size-5 text-white animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Pencil className="size-5 text-white" />
                  <span className="text-[10px] text-white font-medium">Change</span>
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground">{seller.name}</h1>
          <div className="flex items-center gap-1.5 mt-3">
            <Rating rating={seller.avgRating} size="md" />
            <span className="text-sm text-foreground-muted">
              {seller.ratingsCount === 0
                ? "0 reviews"
                : `${seller.ratingsCount} review${seller.ratingsCount !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* About + Verified info — 2 columns */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-name" className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-bio" className="text-xs text-muted-foreground">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-location" className="text-xs text-muted-foreground">Location</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-sm">
                {seller.location && (
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <MapPin className="size-3.5 shrink-0" />
                    <span>{seller.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Clock className="size-3.5 shrink-0" />
                  <span>Last seen {timeAgo(seller.lastSeen)}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Users className="size-3.5 shrink-0" />
                  <span>
                    <Link href={`/seller/${username}/followers`} className="font-medium text-brand-primary hover:underline">
                      {seller.followersCount}
                    </Link>{" "}
                    followers,{" "}
                    <Link href={`/seller/${username}/following`} className="font-medium text-brand-primary hover:underline">
                      {seller.followingCount}
                    </Link>{" "}
                    following
                  </span>
                </div>
              </div>
            )}

            {seller.verifiedMethods.length > 0 && (
              <div className="space-y-1.5 text-sm">
                <p className="text-sm font-medium text-foreground-muted">Verified info:</p>
                {seller.verifiedMethods.map((method) => (
                  <div key={method} className="flex items-center gap-2 text-foreground-muted">
                    <CheckCircle className="size-3.5 shrink-0 text-foreground-muted" strokeWidth={1.5} />
                    <span>{method}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {isOwnProfile ? (
            editing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded gap-1.5"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
                <Button
                  className="rounded gap-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="rounded gap-1.5"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
                Edit profile
              </Button>
            )
          ) : (
            <div className="flex gap-2">
              <FollowButton userId={seller.id} />
            </div>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "listings"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Listings ({sellerListings.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "reviews"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {/* Listings tab */}
      {activeTab === "listings" && (
        <div>
          {/* Achievement cards — only for new sellers with no listings */}
          {!isOwnProfile && sellerListings.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {!seller.badges.includes("frequent_uploads") && (
                <AchievementCard
                  icon={Tag}
                  title="Start a new listing streak!"
                  description="List 5 items in 30 days to earn your Frequent Uploads badge."
                  detail="Active sellers who list regularly get more visibility in search results and earn the Frequent Uploads badge on their profile."
                />
              )}
              {!seller.badges.includes("speedy_shipping") && (
                <AchievementCard
                  icon={Truck}
                  title="Up for the Speedy Shipping challenge?"
                  description="Aim to send items within 24 hours for buyers to see this badge."
                  detail="Sellers who consistently ship within 24 hours earn the Speedy Shipping badge, which builds buyer trust and improves conversion."
                />
              )}
            </div>
          )}

          {sellerListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tag className="size-12 text-brand-primary mb-5" strokeWidth={1.5} />
              <h2 className="text-lg font-bold text-foreground mb-1">
                List items to start selling
              </h2>
              <p className="text-sm text-foreground-muted mb-6">
                Declutter your life. Sell what you no longer need!
              </p>
              <Link href="/sell">
                <Button className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover px-6">
                  List now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sellerListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        <div>
          {/* Leave a review form */}
          {reviewEligibility?.eligible && (
            <div className="mb-8 p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground mb-3">Leave a review</h3>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReviewRating(star)}
                    className="transition-colors"
                  >
                    <Star
                      className={cn(
                        "size-5",
                        star <= newReviewRating
                          ? "fill-rating text-rating"
                          : "text-foreground-faint hover:text-rating/50"
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience (optional)"
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="min-h-[80px] text-sm mb-3"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={newReviewRating === 0 || submittingReview}
                  onClick={async () => {
                    setSubmittingReview(true);
                    try {
                      const review = await api.post<Review>("/reviews", {
                        orderId: reviewEligibility.orderId,
                        rating: newReviewRating,
                        comment: newReviewComment || undefined,
                      });
                      handleReviewSubmitted(review);
                    } catch {
                      // silently fail
                    }
                    setSubmittingReview(false);
                  }}
                  className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover"
                >
                  {submittingReview ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Submit review"
                  )}
                </Button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Star className="size-12 text-foreground-faint mb-5" strokeWidth={1.5} />
              <h2 className="text-lg font-bold text-foreground mb-1">
                No reviews yet
              </h2>
              <p className="text-sm text-foreground-muted">
                This seller hasn&apos;t received any reviews yet.
              </p>
            </div>
          ) : (
            <div>
              {/* Average rating summary */}
              <div className="flex items-center gap-3 mb-6">
                <Rating rating={sellerAvgRating} size="md" />
                <span className="text-lg font-bold text-foreground">
                  {sellerAvgRating.toFixed(1)}
                </span>
                <span className="text-sm text-foreground-muted">
                  ({sellerRatingsCount} review{sellerRatingsCount !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Review list */}
              <div className="space-y-0">
                {reviews.map((review, i) => {
                  const reviewer =
                    (review as Review & { reviewer?: { id: string; name: string; avatarUrl?: string } }).reviewer ??
                    mockUsers.find((u) => u.id === review.reviewerId);
                  const reviewerName = reviewer ? reviewer.name : "Unknown";
                  return (
                    <div key={review.id}>
                      {i > 0 && <Separator />}
                      <div className="py-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColor(reviewerName)}`}>
                            {reviewer
                              ? reviewerName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                              : "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {reviewerName}
                            </p>
                            <div className="flex items-center gap-2">
                              <Rating rating={review.rating} size="sm" />
                              <span className="text-xs text-foreground-muted">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-GB",
                                  { day: "numeric", month: "short", year: "numeric" }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-foreground-muted ml-11">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
