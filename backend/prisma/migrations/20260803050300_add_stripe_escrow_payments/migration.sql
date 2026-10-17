-- AlterEnum (OrderStatus: legacy lowercase values migrated to escrow statuses)
CREATE TYPE "OrderStatus_new" AS ENUM (
  'PENDING_PAYMENT',
  'PAID_ESCROW',
  'SHIPPED',
  'DELIVERED_CONFIRMED',
  'DISPUTED',
  'RELEASED_TO_SELLER',
  'REFUNDED',
  'CANCELLED'
);

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'pending' THEN 'PENDING_PAYMENT'
    WHEN 'paid' THEN 'PAID_ESCROW'
    WHEN 'shipped' THEN 'SHIPPED'
    WHEN 'delivered' THEN 'DELIVERED_CONFIRMED'
    WHEN 'completed' THEN 'RELEASED_TO_SELLER'
    WHEN 'disputed' THEN 'DISPUTED'
    WHEN 'cancelled' THEN 'CANCELLED'
    ELSE 'PENDING_PAYMENT'
  END
)::"OrderStatus_new";

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

DROP TYPE "OrderStatus";

ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- AlterTable (User: Stripe Connect fields)
ALTER TABLE "User" ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable (Order: shippedAt timestamp)
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);

-- CreateTable (Payment escrow ledger)
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "platformFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "sellerPayoutAmount" INTEGER NOT NULL DEFAULT 0,
    "stripeTransferId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "capturedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateTable (PlatformSetting key/value store)
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
