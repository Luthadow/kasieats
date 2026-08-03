# MTHURA Financial Operations Blueprint v1.0

**Status:** Canonical for all money-related product and engineering decisions  
**Parent:** [`MASTER_BLUEPRINT.md`](../MASTER_BLUEPRINT.md)  
**Company:** Nkanyezi Tech Solutions (Pty) Ltd · Brand: MTHURA

> Every payment, subscription, delivery-fee, refund, and finance UI decision must align with this document.

---

## Financial Philosophy

MTHURA is a **marketplace, not a bank**.

Our role is to:

- Connect customers with local businesses
- Facilitate order management
- Coordinate deliveries
- Manage subscriptions
- Provide business tools

We **do not collect or hold food payment funds** during Phase 1.

This reduces financial risk, simplifies compliance, and builds trust with merchants.

---

## Revenue Streams

MTHURA generates revenue from five core sources.

### 1. Merchant Subscription

Every merchant receives:

- **30-day free trial**
- Full access to the Merchant Operating System

After the trial:

| Plan | Price |
|---|---|
| Standard Merchant Plan | **R350 / month** |

Benefits include: unlimited menu items, unlimited orders, promotions, analytics, customer database, reviews, business reports, marketing tools.

**If a subscription expires:**

- Merchant cannot accept new orders
- Existing orders are completed
- Dashboard remains accessible in **read-only** mode until payment is made
- **Grace period: 7 days** (reminders continue; after grace → inactive)

### 2. Driver Subscription

Delivery partners receive:

- **30-day free trial**

Then:

| Plan | Price |
|---|---|
| Driver Plan | **R100 / month** |

Benefits: delivery opportunities, live navigation, earnings dashboard, performance analytics, support.

**If a subscription expires:**

- Driver becomes unavailable for new deliveries
- Outstanding deliveries must be completed
- Account is paused until payment is received
- **Grace period: 7 days**

### 3. Delivery Margin

The customer pays a delivery fee.

**Example:**

| Line | Amount |
|---|---|
| Food total | R180 |
| Delivery fee | R25 |
| **Customer total** | **R205** |

- Customer pays **R180 + R25** to the merchant via **single EFT** (Phase 1 Model A)
- Food amount stays with the merchant
- Delivery fee is settled by the merchant to MTHURA on a defined cycle (weekly/monthly) per partnership terms

Platform revenue from delivery = **agreed delivery margin**, not a % of food GMV in Phase 1.

### 4. Featured Listings

Merchants may pay for premium placement (home, category, search, collections). Pricing: monthly or campaign-based.

### 5. Advertising

Future: beverage brands, FMCG, local suppliers, community events, promotions.

---

## Food Payment Flow (Phase 1)

```
Customer places order
→ Merchant banking details displayed
→ Customer makes EFT (unique order reference)
→ Customer uploads proof of payment
→ Merchant receives notification
→ Merchant verifies payment
→ Payment confirmed
→ Kitchen starts preparing
→ Driver assigned
→ Delivery completed
```

**At no point does MTHURA receive the food payment.**

### Checkout display (customer)

| Field | Example |
|---|---|
| Merchant | Mama's Kota Palace |
| Bank | FNB |
| Account Number | XXXXXXX |
| Branch Code | XXXXXX |
| Reference | ORDER2031 (unique) |

### Merchant EFT verification UI

Order · Customer · Amount · Proof Uploaded · **[Approve]** / **[Reject]**

When approved → status `PAYMENT_CONFIRMED` → kitchen receives new order to start preparation.

### Merchant responsibility

Confirm funds · Reject invalid proof · Report suspected fraud.  
MTHURA provides tools but **does not make banking decisions**.

---

## Delivery Fee — Operational Model

### Model A (Launch — selected)

Merchant receives **both** food payment and delivery fee in the customer's single EFT.

At end of week/month, merchant settles agreed delivery amounts with MTHURA.

### Model B (Future)

Integrated gateways split food vs delivery automatically.

---

## Subscription Reminders

| Timing | Channel |
|---|---|
| 30 days before expiry | Email |
| 14 days before | Email + Dashboard notification |
| 7 days before | SMS |
| 3 days before | Push notification |
| Expiry day | Final reminder |
| Grace period | **7 days** |
| After grace | Account inactive / paused |

Same process for merchants and drivers.

---

## Refund Policy

| Issue type | Owner |
|---|---|
| Food issues (wrong meal, missing items, quality, cancel after payment) | **Merchant** (they received the funds) |
| Delivery issues (driver behaviour, late, dispute, address) | **MTHURA support** |

---

## Admin Financial Dashboard

Cards: Today's Subscriptions · Today's Revenue · Outstanding Renewals · Drivers Due · Merchants Due · Monthly Revenue · Annual Revenue

---

## Merchant Financial Dashboard

Today's / Weekly / Monthly Sales · Orders · Average Basket · Best Selling Items

---

## Driver Financial Dashboard

Today's Deliveries · Today's / Weekly / Monthly Earnings · Total Distance · Average Tip

---

## Customer Receipts

Every completed order generates a digital receipt (food + delivery + total + merchant + driver + order number). Downloadable PDF / email (future).

---

## Financial Reports (Merchant)

Daily / weekly / monthly sales · VAT-friendly reports · Best-selling products · Customer trends

---

## Fraud Prevention

- Unique order payment reference
- Timestamped proof-of-payment uploads
- Multiple uploads for the same order **blocked**
- Suspicious activity flagged for review
- Audit logs for all payment approvals and rejections

---

## Transition to Phase 2

Integrated gateways later for: instant confirmation, automatic order progression, reduced manual verification, reconciliation, split payments.

---

## Long-Term Financial Strategy

Premium plans · Sponsored ads · Logistics · Business software · Inventory tools · Supplier marketplace · Merchant financing · Insurance partnerships · Analytics subscriptions

---

## Co-Founder Recommendation (Adopted)

1. **Phase 1 food money** goes directly to the merchant via EFT — minimize regulatory complexity, build trust.
2. **Delivery fees:** use **Model A** for launch — single customer payment; merchant settles delivery margin with MTHURA on a defined cycle.

This clear separation ensures merchants retain control of sales revenue while MTHURA focuses on technology, marketplace, and operations for the township economy.
