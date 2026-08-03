-- Migration: vendor_subscriptions
-- KasiEats business model correction: platform collects R350/month vendor subscription only.
-- Orders are facilitated but NOT paid through KasiEats.

-- Update existing orders to use new payment semantics
ALTER TABLE "Order" ALTER COLUMN "payment_method" SET DEFAULT 'pay_vendor_directly';
ALTER TABLE "Order" ALTER COLUMN "payment_status" SET DEFAULT 'not_applicable';

-- Update vendor commission_rate default to 0 (platform takes no commission)
ALTER TABLE "Vendor" ALTER COLUMN "commission_rate" SET DEFAULT 0;

-- Create VendorSubscription table
CREATE TABLE "VendorSubscription" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "amount_zar" DECIMAL(10,2) NOT NULL DEFAULT 350,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "trial_ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "ozow_transaction_id" TEXT,
    "last_payment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSubscription_pkey" PRIMARY KEY ("id")
);

-- Create SubscriptionPayment table
CREATE TABLE "SubscriptionPayment" (
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

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- Indexes for VendorSubscription
CREATE INDEX "VendorSubscription_vendor_id_idx" ON "VendorSubscription"("vendor_id");
CREATE INDEX "VendorSubscription_status_idx" ON "VendorSubscription"("status");
CREATE INDEX "VendorSubscription_current_period_end_idx" ON "VendorSubscription"("current_period_end");

-- Indexes for SubscriptionPayment
CREATE UNIQUE INDEX "SubscriptionPayment_transaction_reference_key" ON "SubscriptionPayment"("transaction_reference");
CREATE INDEX "SubscriptionPayment_subscription_id_idx" ON "SubscriptionPayment"("subscription_id");
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- Foreign keys
ALTER TABLE "VendorSubscription" ADD CONSTRAINT "VendorSubscription_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "VendorSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
