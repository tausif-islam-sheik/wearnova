import { ConflictException } from '@nestjs/common';
import type { Prisma } from '@/generated/client';
import type { ListingStatus } from '@/generated/enums';
import type { PrismaService } from '@/prisma/prisma.service';

/**
 * Stock model
 * -----------
 * `Listing.quantity` is the number of units still available to buy. A checkout in progress
 * *holds* units (`Order.unitsHeld`) so two buyers can't pay for the same last item; those units
 * are already subtracted from `quantity`. The listing's `status` is always derived from the two
 * (see `deriveStatus`), never set ad hoc.
 */
type Db = Prisma.TransactionClient;

/**
 * - `deactivated` is an admin decision and is never changed by sales.
 * - stock left            -> `active`
 * - none left, some held  -> `reserved`
 * - none left, none held  -> `sold` (sold out)
 */
export function deriveStatus(input: {
  status: ListingStatus;
  quantity: number;
  holds: number;
}): ListingStatus {
  if (input.status === 'deactivated') return 'deactivated';
  if (input.quantity > 0) return 'active';
  return input.holds > 0 ? 'reserved' : 'sold';
}

/** Units currently held by checkouts that are still awaiting payment. */
export async function countHeldUnits(db: Db, listingId: string): Promise<number> {
  const held = await db.order.aggregate({
    where: { listingId, status: 'PENDING_PAYMENT', unitsHeld: { gt: 0 } },
    _sum: { unitsHeld: true },
  });
  return held._sum.unitsHeld ?? 0;
}

/** Re-derive and store the listing's status from its quantity and held units. */
export async function syncListingStatus(db: Db, listingId: string): Promise<ListingStatus | null> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { status: true, quantity: true },
  });
  if (!listing) return null;
  const next = deriveStatus({
    status: listing.status,
    quantity: listing.quantity,
    holds: await countHeldUnits(db, listingId),
  });
  if (next !== listing.status) {
    await db.listing.update({ where: { id: listingId }, data: { status: next } });
  }
  return next;
}

/**
 * Hold this order's units. Idempotent: an order that already holds its units (the buyer came back
 * to checkout) is left alone. Throws if the stock is gone. Returns true if units were taken now.
 */
export async function reserveUnits(prisma: PrismaService, orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { listingId: true, quantity: true, unitsHeld: true, status: true },
    });
    if (!order) throw new ConflictException('Order not found');
    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictException('This order is not awaiting payment');
    }
    if (order.unitsHeld > 0) return false;

    // Claim the hold first so two parallel calls for the same order can't both decrement.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, unitsHeld: 0 },
      data: { unitsHeld: order.quantity },
    });
    if (claimed.count === 0) return false;

    const taken = await tx.listing.updateMany({
      where: { id: order.listingId, status: 'active', quantity: { gte: order.quantity } },
      data: { quantity: { decrement: order.quantity } },
    });
    // Throwing rolls the claim back with it.
    if (taken.count === 0) throw new ConflictException('This item is no longer available.');

    await syncListingStatus(tx, order.listingId);
    return true;
  });
}

/**
 * Give an order's held units back (payment failed, order cancelled or expired). A no-op if the
 * order holds nothing, so it can never free units that belong to someone else.
 */
export async function releaseUnits(prisma: PrismaService, orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { listingId: true, unitsHeld: true },
    });
    if (!order || order.unitsHeld === 0) return;

    const claimed = await tx.order.updateMany({
      where: { id: orderId, unitsHeld: order.unitsHeld },
      data: { unitsHeld: 0 },
    });
    if (claimed.count === 0) return;

    await tx.listing.update({
      where: { id: order.listingId },
      data: { quantity: { increment: order.unitsHeld } },
    });
    await syncListingStatus(tx, order.listingId);
  });
}

/**
 * Payment succeeded: the held units are now sold. Runs inside the payment transaction.
 * If the order somehow holds nothing, it takes its units now rather than overselling silently.
 */
export async function consumeUnits(
  tx: Db,
  order: { id: string; listingId: string; quantity: number; unitsHeld: number },
): Promise<void> {
  if (order.unitsHeld === 0) {
    await tx.listing.updateMany({
      where: { id: order.listingId, quantity: { gte: order.quantity } },
      data: { quantity: { decrement: order.quantity } },
    });
  }
  await tx.order.update({ where: { id: order.id }, data: { unitsHeld: 0 } });

  const listing = await tx.listing.findUnique({
    where: { id: order.listingId },
    select: { quantity: true },
  });
  if (listing && listing.quantity === 0) {
    // Nothing left to sell: pending orders that never held a unit can no longer be fulfilled.
    await tx.order.updateMany({
      where: {
        listingId: order.listingId,
        id: { not: order.id },
        status: 'PENDING_PAYMENT',
        unitsHeld: 0,
      },
      data: { status: 'CANCELLED' },
    });
  }
  await syncListingStatus(tx, order.listingId);
}
