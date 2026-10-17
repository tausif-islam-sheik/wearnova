-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Listing_quantity_idx" ON "Listing"("quantity");

-- "quantity" means units still available to buy, so listings that are already sold or held
-- by a checkout have none left. Active and deactivated listings keep the default of 1.
UPDATE "Listing" SET "quantity" = 0 WHERE "status" IN ('sold', 'reserved');
