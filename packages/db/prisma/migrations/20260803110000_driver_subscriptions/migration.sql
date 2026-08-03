-- Migration: driver_subscriptions + EFT proof-of-payment (MTHURA blueprint alignment)
-- - Driver subscriptions (R80/month) mirror the merchant subscription tables.
-- - Food orders adopt the EFT proof-of-payment launch model.

-- ─── Order EFT proof-of-payment fields ───────────────────────────────────────
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eft_reference" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eft_proof_url" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eft_proof_uploaded_at" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eft_verified_at" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eft_verified_by_vendor" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eft_rejection_reason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "delivery_pin" TEXT;

-- New order payment defaults for the EFT launch model
ALTER TABLE "Order" ALTER COLUMN "payment_method" SET DEFAULT 'eft';
ALTER TABLE "Order" ALTER COLUMN "payment_status" SET DEFAULT 'awaiting_proof';

-- Merchant subscription default fee → R150
ALTER TABLE "VendorSubscription" ALTER COLUMN "amount_zar" SET DEFAULT 150;

-- ─── DriverSubscription table ────────────────────────────────────────────────
CREATE TABLE "DriverSubscription" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "amount_zar" DECIMAL(10,2) NOT NULL DEFAULT 80,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "trial_ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "ozow_transaction_id" TEXT,
    "last_payment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverSubscription_pkey" PRIMARY KEY ("id")
);

-- ─── DriverSubscriptionPayment table ─────────────────────────────────────────
CREATE TABLE "DriverSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount_zar" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "gateway" TEXT NOT NULL DEFAULT 'ozow',
    "transaction_reference" TEXT,
    "paid_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "raw_callback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- Indexes for DriverSubscription
CREATE INDEX "DriverSubscription_driver_id_idx" ON "DriverSubscription"("driver_id");
CREATE INDEX "DriverSubscription_status_idx" ON "DriverSubscription"("status");
CREATE INDEX "DriverSubscription_current_period_end_idx" ON "DriverSubscription"("current_period_end");

-- Indexes for DriverSubscriptionPayment
CREATE UNIQUE INDEX "DriverSubscriptionPayment_transaction_reference_key" ON "DriverSubscriptionPayment"("transaction_reference");
CREATE INDEX "DriverSubscriptionPayment_subscription_id_idx" ON "DriverSubscriptionPayment"("subscription_id");
CREATE INDEX "DriverSubscriptionPayment_status_idx" ON "DriverSubscriptionPayment"("status");

-- Foreign keys
ALTER TABLE "DriverSubscription" ADD CONSTRAINT "DriverSubscription_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DriverSubscriptionPayment" ADD CONSTRAINT "DriverSubscriptionPayment_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "DriverSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
