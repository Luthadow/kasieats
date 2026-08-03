# MTHURA Master Blueprint
## Single Source of Truth

**Built for the Township Economy**  
Powered by: **Nkanyezi Tech Solutions (Pty) Ltd**

> Every new feature, design decision, API endpoint, database change, or investor presentation must align with this document.

---

## 1. Executive Overview

### What is MTHURA?

MTHURA is a township-first digital commerce platform that connects customers with local businesses through a modern marketplace, delivery network, and business operating system.

MTHURA is **not just a food delivery app**.

Food delivery is the **first vertical**.

Our long-term vision is to become the digital infrastructure for South Africa's township economy.

### Vision

To become Africa's leading digital commerce ecosystem for township businesses.

### Mission

To empower township entrepreneurs through technology by providing digital tools that increase sales, create jobs, and strengthen local economies.

### Tagline

**Built for the Township Economy**

### Company

| Field | Value |
|---|---|
| Legal entity | Nkanyezi Tech Solutions (Pty) Ltd |
| Brand | MTHURA |
| Headquarters | Rustenburg, North West, South Africa |
| Launch market | Rustenburg |

### Expansion Path

Rustenburg → North West → Gauteng → Limpopo → Mpumalanga → Free State → National

---

## 2. Ecosystem

| Surface | Products |
|---|---|
| Customer Platform | Customer Web · Customer Mobile App |
| Merchant Platform | Merchant Web Portal |
| Driver Platform | Driver Web Portal · Driver Mobile App |
| Administration | Admin Operating System |
| Backend | NestJS Enterprise API |
| Database | PostgreSQL |
| Cache | Redis |
| Maps | Google Maps Platform |
| Notifications | Firebase · Email · SMS · WhatsApp |

---

## 3. Marketplace Categories

### Phase 1 — Food (Launch)
Kota · Braai · Shisanyama · Chicken · Burgers · Pap & Meat · Fish · Pizza · Breakfast · Bakery · Desserts · Drinks · Ice Cream · Family Meals · Specials

### Phase 2 — Groceries
Spaza Shops · Fruit & Vegetables · Butcheries · Bakeries · Wholesalers

### Phase 3 — Retail
Fashion · Electronics · Hardware · Beauty · Pharmacy · Pet Stores

### Phase 4 — Services
Electricians · Plumbers · Mechanics · Car Wash · Hair Salons · Barbers · Tutors · Cleaners · Garden Services

---

## 4. Customer Journey

```
Register → Verify OTP → Select Address → Google Maps Location
→ Browse Categories → Browse Vendors → Open Vendor
→ McDonald's-style Ordering → Variants → Add-ons → Special Instructions
→ Add to Cart → Checkout → EFT Payment → Upload Proof
→ Merchant Verification → Kitchen Accepts → Preparing → Ready
→ Driver Assigned → Driver Pickup → Live Tracking → Delivery PIN
→ Order Completed → Review
```

**Launch payment rule:** Customer pays the **vendor via EFT**, uploads proof in-app. Merchant verifies before kitchen starts. MTHURA does **not** process food purchase funds at launch.

---

## 5. Merchant Journey

```
Register → Business Verification → 30-day Trial → Subscription (R150/month)
→ Dashboard → Upload Menu → Variants → Promotions
→ Accept Orders → Verify EFT → Release Order
→ Sales Analytics → Reviews → Reports
```

---

## 6. Driver Journey

```
Register → Identity Verification → Vehicle Registration
→ 16+ years (bicycle delivery allowed)
→ Subscription (R80/month)
→ Receive Jobs → Accept → Navigate → Arrive
→ Merchant Releases Order → Collect → Navigate → Deliver
→ PIN Verification → Receive Earnings
```

---

## 7. Admin Operating System

**Modules:** Dashboard · Live Orders · Vendors · Drivers · Customers · Promotions · Finance · Analytics · Support · Notifications · Reports · Audit Logs · System Settings

**Live Dashboard KPIs:** Today's Orders · Today's Revenue · Drivers Online · Vendors Online · Customers Online · Subscriptions Due · Support Tickets · System Health

---

## 8. Merchant Operating System

**Modules:** Dashboard · Orders · Menu · Promotions · Customers · Analytics · Reviews · Subscription · Settings

**Promotion types:** Percentage Discount · BOGO · Combo Meals · Happy Hour · Payday Specials · Weekend Specials · Student Specials · Daily Specials · Free Delivery · Spend & Save · AI Promotion Suggestions · Promotion Analytics

---

## 9. Driver Dashboard

Today's Deliveries · Current Job · Google Navigation · Earnings · Performance · Ratings · Availability · Safety Centre · Support · Subscription

---

## 10. Customer Dashboard

Home · Search · Categories · Collections · Nearby Vendors · Order History · Saved Vendors · Notifications · Addresses · Account · Support

---

## 11. Payment System

### Launch Version (food orders)

```
Customer → Vendor EFT → Upload Proof → Vendor Verifies
→ Kitchen Starts → PIN Generated → Driver Delivers
```

MTHURA **does not hold or process food purchase money** at launch. EFT happens bank-to-vendor; the platform only stores proof and verification state.

### Platform subscriptions (MTHURA revenue)

| Role | Fee |
|---|---|
| Merchant | **R150 / month** (after 30-day trial) |
| Driver | **R80 / month** |

### Future gateways
Ozow · PayFast · Yoco · Peach Payments · Apple Pay · Google Pay · Cash · Scan to Pay

---

## 12. Delivery Network

| Vehicle | Max distance |
|---|---|
| Bicycle | 3 km |
| Scooter | 8 km |
| Motorcycle | 15 km |
| Car | 25 km |

### Community Pricing
Instead of random surge pricing, MTHURA uses Community Pricing considering: township demand, payday periods, community events, promotions, weather (optional), driver availability, local order volume.

---

## 13. Google Maps

Live Driver Tracking · Customer Tracking · Merchant Tracking · ETA · Distance Matrix · Route Optimization · Address Autocomplete · Geocoding · Reverse Geocoding · Navigation · Driver Heat Maps

---

## 14. Communication

Channels: Email · SMS · Push Notifications · WhatsApp  

Templates for: Customer · Merchant · Driver · Admin · OTP · Welcome · Subscriptions · Promotions · Receipts

---

## 15. Revenue Model

| Stream | Amount / notes |
|---|---|
| Merchant Subscription | **R150/month** |
| Driver Subscription | **R80/month** |
| Featured Listings | Future |
| Advertising | Future |
| Delivery Margin | Future |
| Financial Services | Future |
| Business Software | Future |

---

## 16. Marketing

Homepage Promotions · Featured Vendors · Collections · Trending · Best Rated · Under R50 · Free Delivery · Payday Specials · Township Events · Loyalty Rewards · Referral Programme

---

## 17. Technology Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js · React · TypeScript |
| Backend | NestJS · Node.js |
| Database | PostgreSQL · Prisma ORM |
| Cache | Redis · BullMQ |
| Mobile | React Native · Expo |
| Maps | Google Maps Platform |
| Notifications | Firebase Cloud Messaging |
| Cloud (launch) | Railway |
| Cloud (scale) | Google Cloud / Azure |

---

## 18. Security

JWT Authentication · OTP Verification · Role-Based Access Control · Audit Logs · Encrypted Passwords · HTTPS · Rate Limiting · Cloud Backups · Secure File Storage

---

## 19. AI Features (Future)

Smart Promotions · Demand Forecasting · Delivery Prediction · Vendor Growth Suggestions · Customer Recommendations · Fraud Detection · Business Insights · Demand Heat Maps

---

## 20. Expansion Roadmap

| Phase | Focus |
|---|---|
| 1 — Launch | Food Marketplace · Rustenburg |
| 2 | Groceries · Spaza Shops |
| 3 | Retail Marketplace |
| 4 | Local Services Marketplace |
| 5 | Courier & Parcel Delivery |
| 6 | Financial Services · Merchant Lending · Insurance · Digital Wallet · Supplier Marketplace |

---

## 21. Company Positioning

MTHURA is not simply a food delivery company.

It is a **Township Commerce Platform** designed to digitize and grow the informal economy.

- Every order supports local entrepreneurs.
- Every delivery creates earning opportunities.
- Every merchant gains access to digital tools that help their business grow.

---

## 22. Success Metrics (KPIs)

**Customer:** Registered users · MAU · Order frequency · Average basket value · Retention · NPS  

**Merchant:** Active merchants · Subscription renewal rate · Average monthly merchant revenue · Menu completeness · Promotion participation  

**Driver:** Active partners · Acceptance rate · Average delivery time · Ratings · Earnings per active hour  

**Platform:** GMV · Total orders · Delivery completion rate · Average ETA · Uptime 99.9% · API latency · Support resolution time

---

## 23. Long-Term Vision

Within the next decade, MTHURA aims to become the platform where township communities can:

- Order food
- Buy groceries
- Shop from local retailers
- Access pharmacies
- Book trusted local services
- Send parcels
- Grow small businesses
- Access digital business tools

MTHURA will connect customers, entrepreneurs, delivery partners, and communities through one integrated digital ecosystem.

---

## Final Product Statement

MTHURA is a township-first digital commerce platform powered by **Nkanyezi Tech Solutions (Pty) Ltd**. It empowers local entrepreneurs with modern technology, connects communities through trusted marketplaces and delivery services, and builds the digital infrastructure needed for the growth of South Africa's township economy.

**Built for the Township Economy.**
