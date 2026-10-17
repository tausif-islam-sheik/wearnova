import "dotenv/config";
import { PrismaClient } from "../src/generated/client";

/**
 * Seeds realistic orders on top of the EXISTING users and listings (it never creates or edits
 * either), so it can be run on a database you are already using:
 *
 *   pnpm prisma:seed:orders            add orders (does nothing if orders already exist)
 *   pnpm prisma:seed:orders -- --reset remove every order and its payments, payouts, reviews and
 *                                      disputes first, then seed again
 *
 * `seed.ts` calls it at the end too, so a fresh seed includes orders.
 *
 * What you get (35 orders, spread over ~10 weeks so the charts have a shape):
 *   14 released to the seller  (11 with payouts + reviews, 1 settled dispute)
 *    3 delivery confirmed   5 shipped   5 paid (in escrow)
 *    3 open disputes        2 refunded (1 settled dispute)   3 cancelled
 *
 * Paid orders are attached to listings that are already `sold`, so stock stays consistent
 * (quantity 0, nothing held). Cancelled orders sit on active listings and hold nothing.
 *
 * Not seeded on purpose:
 *  - Pending-payment orders: they expire after 30 minutes by design, so they would not last.
 *  - Shipped orders are 1-3 days old: the escrow scheduler auto-releases shipments older than
 *    ESCROW_AUTO_CONFIRM_DAYS (7), which with real Stripe keys would try a real transfer.
 *
 * The payment ids are placeholders (`pi_seed_…`, `tr_seed_…`); they never exist on Stripe.
 */

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

const DAY = 86_400_000;
const HOUR = 3_600_000;
const FEE_PERCENT = 8; // matches the platform default commission

/** Small deterministic PRNG (mulberry32): the same dataset on every run. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADDRESSES = [
  { street: "412 Maple Avenue", apt: "Apt 3B", city: "Portland", state: "OR", zip: "97205" },
  { street: "88 Harbor Street", apt: null, city: "Boston", state: "MA", zip: "02110" },
  { street: "1905 Sunset Boulevard", apt: "Unit 12", city: "Los Angeles", state: "CA", zip: "90026" },
  { street: "27 Lakeview Drive", apt: null, city: "Chicago", state: "IL", zip: "60614" },
  { street: "640 Pine Ridge Road", apt: null, city: "Denver", state: "CO", zip: "80203" },
  { street: "15 Magnolia Court", apt: "Apt 7", city: "Austin", state: "TX", zip: "78701" },
  { street: "302 Elm Street", apt: null, city: "Seattle", state: "WA", zip: "98101" },
  { street: "73 Riverside Walk", apt: "Floor 4", city: "New York", state: "NY", zip: "10011" },
];

const REVIEW_COMMENTS: Record<number, string[]> = {
  5: [
    "Exactly as described and shipped fast. Would buy from again.",
    "Beautiful condition, packaged really carefully. Thank you!",
    "Great seller, super communicative. Item looks brand new.",
  ],
  4: ["Good item, a little slower to ship than I hoped but all fine.", "Nice piece, matches the photos. Happy overall."],
  3: ["Item was okay but showed a bit more wear than the listing suggested."],
  2: ["Took a long time to arrive and the colour was off from the pictures."],
};

const DISPUTE_DETAILS: Record<string, string[]> = {
  not_received: ["Tracking has not moved for several days and nothing has arrived."],
  not_as_described: ["The stitching is coming apart and the listing said excellent condition."],
  damaged: ["The item arrived with a tear along the seam; the box was crushed."],
};

type PaidStatus = "RELEASED_TO_SELLER" | "DELIVERED_CONFIRMED" | "SHIPPED" | "PAID_ESCROW" | "DISPUTED" | "REFUNDED";

interface Plan {
  status: PaidStatus | "CANCELLED";
  count: number;
  /** Order age range in days. */
  age: [number, number];
}

const PLAN: Plan[] = [
  { status: "RELEASED_TO_SELLER", count: 14, age: [9, 70] },
  { status: "DELIVERED_CONFIRMED", count: 3, age: [5, 8] },
  { status: "SHIPPED", count: 5, age: [2.5, 4] },
  { status: "PAID_ESCROW", count: 5, age: [0.2, 2.5] },
  { status: "DISPUTED", count: 3, age: [4, 12] },
  { status: "REFUNDED", count: 2, age: [14, 35] },
  { status: "CANCELLED", count: 3, age: [1, 20] },
];

/** "STATUS:index" -> promo code, applied only when it actually changes the price. */
const PROMOS: Record<string, string> = {
  "RELEASED_TO_SELLER:1": "WELCOME10",
  "RELEASED_TO_SELLER:4": "SAVE5",
  "RELEASED_TO_SELLER:7": "FREESHIP",
  "RELEASED_TO_SELLER:10": "WELCOME10",
  "DELIVERED_CONFIRMED:0": "WELCOME10",
  "SHIPPED:1": "SAVE5",
  "PAID_ESCROW:2": "FREESHIP",
};

/** Ratings for the first reviewed released orders (the order-0 dispute one is skipped). */
const RATINGS = [5, 5, 4, 5, 3, 5, 4, 5, 2, 5, 4];

export async function seedOrders(
  prisma: PrismaClient,
  opts: { reset?: boolean } = {},
): Promise<{ skipped: boolean; created: number }> {
  const existing = await prisma.order.count();
  if (existing > 0 && !opts.reset) {
    console.log(`  Orders already exist (${existing}); skipping. Use --reset to replace them.`);
    return { skipped: true, created: 0 };
  }

  const rand = makeRng(20261017);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const between = (min: number, max: number) => min + rand() * (max - min);
  const shuffled = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };

  const [buyers, sold, active, admin] = await Promise.all([
    prisma.user.findMany({ where: { role: "user" }, orderBy: { id: "asc" } }),
    prisma.listing.findMany({ where: { status: "sold" }, orderBy: { id: "asc" }, include: { seller: true } }),
    prisma.listing.findMany({ where: { status: "active" }, orderBy: { id: "asc" }, take: 60, include: { seller: true } }),
    prisma.user.findFirst({ where: { role: "admin" } }),
  ]);
  if (buyers.length < 2) throw new Error("Seed users first: at least two regular users are needed.");

  const soldPool = shuffled(sold);
  const activePool = shuffled(active);
  const needSold = PLAN.filter((p) => p.status !== "CANCELLED").reduce((n, p) => n + p.count, 0);
  if (soldPool.length < needSold) {
    console.log(`  Only ${soldPool.length} sold listings (need ${needSold}); seeding fewer orders.`);
  }

  const now = Date.now();
  const stats = { created: 0, byStatus: {} as Record<string, number>, gmv: 0 };
  const promoUses: Record<string, number> = {};
  const reviewedSellers = new Set<string>();

  await prisma.$transaction(
    async (tx: Tx) => {
      if (existing > 0) {
        console.log(`  --reset: removing ${existing} existing orders and everything attached to them...`);
        await tx.dispute.deleteMany();
        await tx.review.deleteMany();
        await tx.transaction.deleteMany();
        await tx.payment.deleteMany();
        await tx.order.deleteMany();
        await tx.promoCode.updateMany({ data: { usedCount: 0 } });
        await tx.user.updateMany({ data: { avgRating: 0, ratingsCount: 0 } });
      }

      let ratingIdx = 0;
      let addr = 0;

      for (const plan of PLAN) {
        for (let i = 0; i < plan.count; i++) {
          const listing = plan.status === "CANCELLED" ? activePool.shift() : soldPool.shift();
          if (!listing) break;

          const buyer = pick(buyers.filter((b) => b.id !== listing.sellerId));
          const address = ADDRESSES[addr++ % ADDRESSES.length]!;

          // ── pricing, in cents so totals add up exactly ──
          const priceC = Math.round(listing.price * 100);
          const express = rand() < 0.25;
          let shippingC = listing.shippingFree ? 0 : express ? 1499 : 599;
          let discountC = 0;
          let promoCode: string | null = null;
          const wanted = PROMOS[`${plan.status}:${i}`];
          if (wanted === "WELCOME10") {
            discountC = Math.round(priceC * 0.1);
            promoCode = wanted;
          } else if (wanted === "SAVE5" && priceC >= 3000) {
            discountC = 500;
            promoCode = wanted;
          } else if (wanted === "FREESHIP" && shippingC > 0) {
            shippingC = 0;
            promoCode = wanted;
          }
          const totalC = priceC - discountC + shippingC;

          // ── timeline ──
          const createdAt = new Date(now - between(plan.age[0], plan.age[1]) * DAY);
          const capturedAt = new Date(createdAt.getTime() + between(5, 40) * 60_000);
          const needsShipping = ["SHIPPED", "DELIVERED_CONFIRMED", "DISPUTED", "RELEASED_TO_SELLER"].includes(plan.status);
          const shippedAt = needsShipping ? new Date(capturedAt.getTime() + between(8, 36) * HOUR) : null;
          const releasedAt =
            plan.status === "RELEASED_TO_SELLER" && shippedAt ? new Date(shippedAt.getTime() + between(3, 6) * DAY) : null;
          const updatedAt =
            releasedAt ?? shippedAt ?? (plan.status === "CANCELLED" ? new Date(createdAt.getTime() + 31 * 60_000) : capturedAt);

          const order = await tx.order.create({
            data: {
              listingId: listing.id,
              buyerId: buyer.id,
              sellerId: listing.sellerId,
              price: priceC / 100,
              quantity: 1,
              shippingCost: shippingC / 100,
              discount: discountC / 100,
              promoCode,
              shippingMethod: express ? "express" : "standard",
              total: totalC / 100,
              status: plan.status,
              shippingAddress: { fullName: buyer.name, ...address, country: "US" },
              shippedAt,
              createdAt,
              updatedAt,
            },
          });
          stats.created++;
          stats.byStatus[plan.status] = (stats.byStatus[plan.status] ?? 0) + 1;
          if (plan.status === "CANCELLED") continue; // never paid, nothing held

          stats.gmv += totalC / 100;
          if (promoCode) promoUses[promoCode] = (promoUses[promoCode] ?? 0) + 1;

          // ── payment (and payout for released orders) ──
          const feeC = Math.round((totalC * FEE_PERCENT) / 100);
          const payoutC = totalC - feeC;
          const transferId = releasedAt ? `tr_seed_${order.id}` : null;
          await tx.payment.create({
            data: {
              orderId: order.id,
              stripePaymentIntentId: `pi_seed_${order.id}`,
              amount: totalC,
              currency: "usd",
              platformFeeAmount: feeC,
              platformFeePercent: FEE_PERCENT,
              sellerPayoutAmount: payoutC,
              stripeTransferId: transferId,
              status: plan.status === "REFUNDED" ? "refunded" : "captured",
              capturedAt,
              releasedAt,
              createdAt,
              updatedAt,
            },
          });

          if (releasedAt && transferId) {
            await tx.transaction.create({
              data: {
                orderId: order.id,
                productName: listing.title,
                buyer: buyer.name,
                gross: totalC / 100,
                fee: feeC / 100,
                net: payoutC / 100,
                status: "completed",
                payout: transferId,
                date: releasedAt,
              },
            });
          }

          // ── disputes: open ones, plus one settled each way ──
          const openDispute = plan.status === "DISPUTED";
          const settledReleased = plan.status === "RELEASED_TO_SELLER" && i === 0;
          const settledRefunded = plan.status === "REFUNDED" && i === 0;
          if (openDispute || settledReleased || settledRefunded) {
            const reason = openDispute ? (["not_received", "not_as_described", "damaged"] as const)[i % 3]! : settledReleased ? "not_received" : "not_as_described";
            const base = shippedAt ?? capturedAt;
            const openedAt = new Date(Math.min(now - HOUR, base.getTime() + 2 * DAY));
            await tx.dispute.create({
              data: {
                orderId: order.id,
                openedById: buyer.id,
                reason,
                details: pick(DISPUTE_DETAILS[reason]!),
                status: openDispute ? "open" : "resolved",
                resolution: openDispute ? null : settledReleased ? "released" : "refunded",
                openedAt,
                resolvedAt: openDispute ? null : new Date(Math.min(now - HOUR, openedAt.getTime() + between(1, 2) * DAY)),
                resolvedById: openDispute ? null : (admin?.id ?? null),
              },
            });
          }

          // ── reviews on most released orders (not the one that went through a dispute) ──
          if (plan.status === "RELEASED_TO_SELLER" && !settledReleased && releasedAt && ratingIdx < RATINGS.length) {
            const rating = RATINGS[ratingIdx++]!;
            await tx.review.create({
              data: {
                orderId: order.id,
                reviewerId: buyer.id,
                revieweeId: listing.sellerId,
                rating,
                comment: pick(REVIEW_COMMENTS[rating]!),
                createdAt: new Date(Math.min(now - HOUR, releasedAt.getTime() + between(1, 5) * DAY)),
              },
            });
            reviewedSellers.add(listing.sellerId);
          }
        }
      }

      // Promo usage and seller ratings follow from what was just created, like the live flow.
      for (const [code, uses] of Object.entries(promoUses)) {
        await tx.promoCode.updateMany({ where: { code }, data: { usedCount: { increment: uses } } });
      }
      for (const sellerId of reviewedSellers) {
        const agg = await tx.review.aggregate({
          where: { revieweeId: sellerId, hidden: false },
          _avg: { rating: true },
          _count: true,
        });
        await tx.user.update({
          where: { id: sellerId },
          data: { avgRating: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingsCount: agg._count },
        });
      }
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  console.log(`  Created ${stats.created} orders ($${Math.round(stats.gmv).toLocaleString()} total value)`);
  console.log("  " + Object.entries(stats.byStatus).map(([s, n]) => `${s}: ${n}`).join("  |  "));
  return { skipped: false, created: stats.created };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  console.log("🧾 Seeding orders...");
  seedOrders(prisma, { reset: process.argv.includes("--reset") })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
