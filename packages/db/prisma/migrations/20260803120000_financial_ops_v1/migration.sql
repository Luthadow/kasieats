-- Financial Ops Blueprint v1 migration
-- Changes:
--   1. VendorSubscription.amount_zar default: 150 → 350 (R350/month)
--   2. DriverSubscription.amount_zar default: 80 → 100 (R100/month)
--   3. Vendor.bank_name column added (nullable String)
--   4. VendorSubscription.grace_ends_at column added (nullable DateTime)
--   5. DriverSubscription.grace_ends_at column added (nullable DateTime)

-- Note: PostgreSQL ALTER COLUMN ... SET DEFAULT only affects NEW rows.
-- Existing subscription rows retain their original amounts.
-- Seed script should be re-run or updated rows updated manually if needed.

-- 1. Update default for VendorSubscription.amount_zar
ALTER TABLE "VendorSubscription" ALTER COLUMN "amount_zar" SET DEFAULT 350;

-- 2. Update default for DriverSubscription.amount_zar
ALTER TABLE "DriverSubscription" ALTER COLUMN "amount_zar" SET DEFAULT 100;

-- 3. Add bank_name to Vendor (idempotent)
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "bank_name" TEXT;

-- 4. Add grace_ends_at to VendorSubscription (idempotent)
ALTER TABLE "VendorSubscription" ADD COLUMN IF NOT EXISTS "grace_ends_at" TIMESTAMP(3);

-- 5. Add grace_ends_at to DriverSubscription (idempotent)
ALTER TABLE "DriverSubscription" ADD COLUMN IF NOT EXISTS "grace_ends_at" TIMESTAMP(3);

-- 6. Indexes for grace_ends_at queries
CREATE INDEX IF NOT EXISTS "VendorSubscription_grace_ends_at_idx" ON "VendorSubscription"("grace_ends_at");
CREATE INDEX IF NOT EXISTS "DriverSubscription_grace_ends_at_idx" ON "DriverSubscription"("grace_ends_at");

-- 7. Backfill grace_ends_at for existing subscriptions that have a current_period_end
--    grace_ends_at = current_period_end + 7 days
UPDATE "VendorSubscription"
SET "grace_ends_at" = "current_period_end" + INTERVAL '7 days'
WHERE "grace_ends_at" IS NULL;

UPDATE "DriverSubscription"
SET "grace_ends_at" = "current_period_end" + INTERVAL '7 days'
WHERE "grace_ends_at" IS NULL;
