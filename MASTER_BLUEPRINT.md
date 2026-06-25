# KasiEats Master Blueprint v1.0
## The Complete Nervous System

**KasiEats** – Bringing Township Flavour Home

---

## 1. EXECUTIVE SUMMARY

KasiEats is a digital marketplace and logistics platform connecting township food vendors, customers, delivery partners, and platform administrators within a single ecosystem.

The platform digitises the township food economy by providing:
- Food discovery
- Online ordering
- Delivery logistics
- Digital payments
- Business management tools
- Analytics
- Customer retention tools

KasiEats operates as a **multi-sided marketplace** with four user types orchestrated by a central API "nervous system."

---

## 2. THE NERVOUS SYSTEM (CORE ARCHITECTURE)

Everything revolves around **one brain**: the **Central API Gateway**

```
                   CUSTOMER APP
                        |
                        V
                   API GATEWAY
                        |
         -----------------------------------------------
        |           CENTRAL BRAIN (NestJS)             |
        |-----------------------------------------------|
        | • Authentication Engine                      |
        | • User Management Engine                     |
        | • Vendor Engine                              |
        | • Menu Engine                                |
        | • Cart Engine                                |
        | • Order Engine                               |
        | • Pricing Engine                             |
        | • Delivery Engine                            |
        | • Driver Engine                              |
        | • Payment Engine                             |
        | • Notification Engine                        |
        | • Promotion Engine                           |
        | • Loyalty Engine                             |
        | • Review Engine                              |
        | • Analytics Engine                           |
        | • Fraud Engine                               |
        | • Support Engine                             |
        |-----------------------------------------------|
         -----------------------------------------------
              |              |               |
              |              |               |
              V              V               V

          VENDOR APP     DRIVER APP     ADMIN DASHBOARD
        (React Web)    (React Native)    (React Web)
```

### Nervous System Principles

1. **Single Source of Truth** – All state lives in the central API
2. **Event-Driven** – Every action triggers a cascade of automated signals
3. **Real-Time Sync** – WebSocket connections keep all apps synchronized
4. **Stateless Microservices** – Each engine is independently scalable
5. **Asynchronous Processing** – Heavy tasks (notifications, analytics) run async
6. **Fault Tolerance** – Failed events are retried with exponential backoff

---

## 3. USERS

### Customer
**Primary Goal:** Discover, order, and receive food quickly

**Actions:**
- Register (phone/email)
- Login with OTP
- Browse vendors by location
- Search food by name/category
- Place orders
- Pay (EFT, card, cash on delivery)
- Track orders in real-time
- Rate vendor & driver
- Save favorite vendors
- Manage addresses and payment methods
- View order history

### Vendor
**Primary Goal:** Manage business, accept orders, track revenue

**Actions:**
- Register store (KYC verification)
- Create menu with photos
- Manage inventory (in stock/low stock/out of stock)
- Accept or reject orders
- Mark orders as "ready for pickup"
- View daily/weekly/monthly revenue
- Identify repeat customers
- Create promotions
- Track vendor analytics
- Manage operating hours
- Update store information

### Driver
**Primary Goal:** Accept deliveries, earn money, build reputation

**Actions:**
- Register as driver (KYC verification)
- Go online/offline
- View available deliveries
- Accept orders
- Navigate to vendor (Google Maps)
- Collect order
- Navigate to customer
- Deliver order
- Receive payment (cash or app wallet)
- Complete delivery
- View earnings breakdown
- Request payout
- Build delivery history and ratings

### Administrator
**Primary Goal:** Control platform, ensure quality, detect fraud

**Actions:**
- Approve vendors (ID verification, business documents)
- Approve drivers (license, vehicle, ID)
- Manage users (suspend, ban, verify)
- Configure commission rates
- Create platform-wide promotions
- Monitor live orders in real-time
- Track financial metrics (revenue, commissions, fees)
- Detect fraudulent activity
- Handle customer support escalations
- Generate analytics reports
- Monitor system health

---

## 4. CUSTOMER APP

### 4.1 Authentication Module

**Features:**
- Phone number login (OTP via SMS)
- Email login (password)
- Social login (future: Google, Facebook)
- OTP verification (60 seconds expiry)
- Password reset
- Session management (JWT)
- Logout

**Flow:**
```
User enters phone → SMS OTP sent → OTP verified → User logged in
```

### 4.2 Home Screen

**Display:**
- Nearby vendors (sorted by distance, rating)
- Promotional banners
- Popular stores (trending this week)
- Recommended meals (based on order history)
- Quick access to favorites
- Search bar

### 4.3 Search Engine

**Search by:**
- Vendor name
- Food item
- Category (Kota, Shisanyama, Braai, Home Meals, Chicken, Mogodu, Burgers, Desserts, Drinks)
- Distance
- Rating
- Price range

**Filters:**
- Open now / by distance / by rating / by delivery fee

### 4.4 Vendor Page

**Display:**
- Vendor hero image
- Store name, rating (stars), number of reviews
- Delivery time estimate
- Distance from customer
- Operating hours
- Menu organized by category
- Photos of dishes
- Description of vendor
- Delivery fee

### 4.5 Cart Module

**Functions:**
- Add items with quantity
- Remove items
- Adjust quantity with +/- buttons
- View cart summary (item count, total)
- Apply coupon code
- View delivery fee breakdown
- Proceed to checkout

### 4.6 Checkout & Payment

**Display:**
- Items summary with prices
- Delivery fee
- Service fee (platform commission)
- Coupon discount (if applied)
- **Total amount**

**Payment Options:**
- Card (EFT) – Primary in MVP
- Ozow
- Yoco
- Cash on Delivery (selected locations)

**Delivery Address:**
- Current location (auto-populated via GPS)
- Saved addresses
- Add new address
- Delivery instructions (special notes)

### 4.7 Live Order Tracking

**Order Statuses (Linear Flow):**
```
1. Order Received (Vendor notified)
   ↓
2. Vendor Preparing (Customer sees "Preparing your order")
   ↓
3. Driver Assigned (Customer sees driver name + rating)
   ↓
4. Driver Collecting (Customer sees "Driver on the way to collect")
   ↓
5. Driver En Route (Live GPS tracking visible)
   ↓
6. Delivered (Order complete, payment settled)
```

**Real-Time Features:**
- GPS live tracking (driver's location updated every 10 seconds)
- Estimated delivery time (updated dynamically)
- Driver phone number (call driver)
- Chat with driver (optional)
- Order status notifications (push + in-app)

### 4.8 Customer Profile

**Sections:**
- Personal info (name, phone, email)
- Order history (with filters: all, pending, completed, cancelled)
- Saved addresses (add/edit/delete)
- Payment methods (cards on file)
- Favorite vendors (quick reorder)
- Loyalty points balance
- Referral code and earnings
- Settings (notifications, language)
- Support & Help

### 4.9 Rating & Review

**Post-Delivery:**
- Rate vendor (1-5 stars + comment)
- Rate driver (1-5 stars + comment)
- Report issue (if applicable)
- Submit feedback

---

## 5. VENDOR APP (React Web Dashboard)

### 5.1 Vendor Dashboard (Home)

**Real-Time Display:**
- Today's orders count (total, pending, completed, cancelled)
- Today's revenue (running total)
- Pending orders list (with "Accept" / "Reject" / "Delay" buttons)
- Top 5 selling items this week
- Average delivery time

**Quick Actions:**
- View full order list
- Update menu
- View analytics
- Manage promotions
- Go online/offline (pause orders)

### 5.2 Menu Management

**Functions:**
- Add new item
- Upload item photo (Google Cloud Storage)
- Set price
- Add category (Kota, Shisanyama, etc.)
- Add extra options with prices

**Example:**
```
Kota
Price: R25
Category: Kota
Extras:
  - Cheese (+R2)
  - Russian (+R3)
  - Egg (+R2)
  - Chips (+R3)
```

- Mark item as unavailable (in stock / low stock / out of stock)
- Edit or delete items
- Bulk import menu (future: CSV upload)

### 5.3 Order Management

**Order List:**
- Incoming orders (real-time notifications)
- Order details (customer name, items, special requests, delivery address)
- Buttons: Accept / Reject / Delay (30 mins)

**Order Actions:**
- Accept order → system assigns driver
- Reject order → customer refunded
- Delay order → customer notified
- Mark "Ready for Pickup" → driver is notified to collect
- View full order details with delivery address

### 5.4 Inventory Management

**Track:**
- In stock items
- Low stock items (warning)
- Out of stock items (hidden from customer view)
- Quantity remaining for each item

**Bulk Actions:**
- Mark multiple items as out of stock
- Restock all items

### 5.5 Vendor Analytics

**Metrics Displayed:**
- Daily revenue
- Weekly revenue (7-day trend chart)
- Monthly revenue (cumulative)
- Number of orders (daily, weekly, monthly)
- Most ordered items
- Repeat customers (customer name + order count)
- Average rating
- Customer acquisition trend

**Export:**
- Download reports as CSV or PDF

### 5.6 Promotions & Discounts

**Functions:**
- Create discount (% off or fixed amount)
- Set expiry date
- Apply to specific items or all items
- View active promotions
- End promotion early
- Analyze promotion performance

---

## 6. DRIVER APP (React Native)

### 6.1 Driver Dashboard

**Display:**
- Current status (Online / Offline)
- Available deliveries (list of nearby orders)
- In-progress delivery
- Completed deliveries (today, week, month)
- Earnings summary (today, week, month)

### 6.2 Driver Workflow

**Statuses:**
```
1. Offline
   ↓ (User taps "Go Online")
2. Online (waiting for orders)
   ↓ (Order available, driver pings "Accept")
3. Accepted (driver assigned to order)
   ↓ (Driver navigates to vendor)
4. Collecting (driver at vendor, picking up order)
   ↓ (Driver taps "Order Collected")
5. En Route (driver navigating to customer)
   ↓ (Driver arrives at customer location)
6. Delivering (driver has arrived)
   ↓ (Driver taps "Complete Delivery" + takes photo)
7. Completed (delivery done, payment received)
```

**Key Features:**
- Driver accepts/rejects available orders
- Navigation to vendor (Google Maps)
- Navigation to customer (Google Maps)
- Estimated time of arrival (ETA) updates in real-time
- Customer chat (optional)
- Photo proof of delivery (uploaded to Google Cloud Storage)
- Payment collection (cash or wallet top-up)
- Delivery history (all completed orders)

### 6.3 Navigation

**Uses:** Google Maps API
- Route optimization
- Real-time traffic
- ETA calculation
- Turn-by-turn directions

### 6.4 Driver Wallet

**Display:**
- Available balance (earned but not yet withdrawn)
- Pending payouts (payouts being processed)
- Withdrawal history
- Transaction details

**Actions:**
- Request payout to bank account
- View commission breakdown per delivery

---

## 7. ADMIN DASHBOARD (React Web)

### 7.1 User Management

**Manage:**
- Customers (view, suspend, ban, verify phone)
- Vendors (view, approve, suspend, ban)
- Drivers (view, approve, suspend, ban)

**Actions:**
- View user profiles
- Verify user documents (ID, business registration, driver license)
- Suspend account (temporary restriction)
- Ban account (permanent removal)
- Send messages to users
- View user activity logs

### 7.2 Vendor Approval Workflow

**Verification Checklist:**
- ✓ ID document uploaded and verified
- ✓ Phone number verified (SMS OTP)
- ✓ Bank account details verified (Instant EFT test)
- ✓ Business name and address confirmed
- ✓ Menu category selected
- ✓ Operating hours set
- ✓ Tax compliance (VAT number if applicable)

**Actions:**
- Approve vendor → store goes live
- Reject vendor → reason sent to vendor
- Request additional documents
- View vendor onboarding progress

### 7.3 Driver Approval Workflow

**Verification Checklist:**
- ✓ ID document verified
- ✓ Driver license (valid, not expired)
- ✓ Vehicle registration document
- ✓ Insurance document (Third-party or comprehensive)
- ✓ Phone number verified
- ✓ Background check (optional, future)

**Actions:**
- Approve driver → driver goes live
- Reject driver → reason sent to driver
- Request additional documents
- Suspend driver (after complaints)

### 7.4 Order Control Center

**Display:**
- Live orders map (all active deliveries)
- Order list (all pending, in-transit, completed today)
- Order details (customer, vendor, driver, items, address)
- Order timeline (created → accepted → ready → collected → delivered)

**Actions:**
- Cancel order (if needed for support)
- Reassign driver (if current driver has issue)
- View delivery route
- Refund order (if issue)

### 7.5 Financial Dashboard

**Track:**
- **Total Revenue** (cumulative platform commission)
- **Commission Breakdown** (% from orders, delivery fees)
- **Vendor Payouts** (amount paid to vendors, pending payouts)
- **Driver Earnings** (amount earned by drivers, pending payouts)
- **Platform Profit** (commission - payout costs)

**Metrics:**
- Daily revenue graph
- Weekly revenue trend
- Monthly revenue forecast
- Commission rate by vendor category

**Actions:**
- Configure commission rates (% per transaction)
- Configure delivery fees (flat or distance-based)
- Process payouts to vendors and drivers
- View transaction history

### 7.6 Promotions & Campaigns

**Create:**
- **Coupons** (discount codes, usage limits, expiry)
- **Platform Promotions** (featured vendors, seasonal discounts)
- **Referral Bonuses** (sign-up incentives)

**Manage:**
- View active promotions
- View promotion performance (usage, revenue impact)
- End promotion early
- Duplicate successful promotions

### 7.7 Support Center

**Manage:**
- **Complaints** (customer complaints about vendor/driver)
- **Refunds** (process refunds for orders)
- **Escalations** (urgent support issues)
- **Chat History** (view conversations)

**Actions:**
- Respond to complaints
- Approve/deny refund requests
- Escalate to senior support
- Ban vendor/driver if repeated complaints
- Generate support metrics (avg resolution time)

### 7.8 Fraud Detection

**Detect:**
- **Duplicate Accounts** (same phone/email registered multiple times)
- **Fake Orders** (orders from suspicious accounts)
- **Chargebacks** (payment fraud)
- **Suspicious Transactions** (unusually large orders, rapid fire orders)
- **Unusual Patterns** (driver completing too many orders too fast)

**Actions:**
- Flag suspicious account
- Investigate transaction
- Block account (temporary)
- Ban account (permanent)
- Generate fraud report

### 7.9 Analytics & Reporting

**Dashboard Metrics:**
- **Daily Active Users** (customers, vendors, drivers)
- **Orders** (daily orders, average basket size, order frequency)
- **Delivery Performance** (avg delivery time, on-time %)
- **Customer Retention** (repeat customer %, churn rate)
- **Vendor Performance** (orders per vendor, revenue per vendor)
- **Driver Performance** (deliveries per driver, rating, earnings)
- **Platform Health** (uptime, payment success rate, support response time)

**Export:**
- Download reports as CSV or PDF
- Schedule automated reports

---

## 8. DATABASE DESIGN

### Core Tables

**Users**
```sql
id, email, phone, password_hash, user_type (customer|vendor|driver|admin),
auth_provider (phone|email|google), phone_verified, email_verified,
created_at, updated_at, deleted_at
```

**Customers**
```sql
id, user_id, first_name, last_name, preferred_language,
total_orders, total_spent, last_order_at, loyalty_points, created_at
```

**Vendors**
```sql
id, user_id, store_name, store_description, phone, email,
address, lat, lng (PostGIS), logo_url, banner_url,
operating_hours (JSON: {monday: {open: "08:00", close: "18:00"}}),
commission_rate, bank_account, tax_id,
status (pending_approval|active|suspended|banned),
created_at, updated_at
```

**Drivers**
```sql
id, user_id, first_name, last_name, phone, email,
vehicle_type (motorcycle|car|bicycle), license_number, vehicle_plate,
id_document_url, license_url, insurance_url,
current_location (lat, lng), current_lat_lng_updated_at,
status (pending_approval|active|suspended|banned|offline),
total_deliveries, total_earnings, rating, created_at, updated_at
```

**Addresses**
```sql
id, customer_id, label (home|work|other), address, apt_number,
lat, lng (PostGIS), is_default, created_at
```

**Menus**
```sql
id, vendor_id, category (Kota|Shisanyama|Braai|etc), created_at, updated_at
```

**MenuItems**
```sql
id, menu_id, vendor_id, name, description, price, image_url,
is_available, category, created_at, updated_at
```

**MenuItemExtras**
```sql
id, menu_item_id, name (Cheese|Russian|Egg), price, created_at
```

**Orders**
```sql
id, customer_id, vendor_id, driver_id (nullable if not yet assigned),
total_amount, delivery_fee, service_fee, discount,
subtotal, payment_method (card|cash|ozow|yoco),
status (pending|paid|preparing|ready|picked_up|en_route|delivered|cancelled|refunded),
delivery_address, delivery_lat, delivery_lng, special_instructions,
created_at, vendor_accepted_at, driver_assigned_at, 
driver_collected_at, delivered_at
```

**OrderItems**
```sql
id, order_id, menu_item_id, quantity, price_per_item,
extras (JSON: [{name: "Cheese", price: 2}]),
subtotal, created_at
```

**Payments**
```sql
id, order_id, amount, payment_method, gateway (ozow|yoco|peach),
transaction_reference, status (pending|success|failed|refunded),
created_at, settled_at
```

**Transactions**
```sql
id, order_id, payment_id, amount, transaction_type (order|refund|payout),
from_user_id, to_user_id, status, created_at
```

**Deliveries**
```sql
id, order_id, driver_id, pickup_address, delivery_address,
pickup_lat, pickup_lng, delivery_lat, delivery_lng,
assigned_at, picked_up_at, delivered_at, delivery_photo_url,
status (assigned|picked_up|en_route|delivered|cancelled), created_at
```

**Reviews**
```sql
id, order_id, reviewer_id, reviewer_type (customer),
reviewee_id, reviewee_type (vendor|driver),
rating (1-5), comment, created_at
```

**Promotions**
```sql
id, admin_id, code, discount_type (percentage|fixed), discount_value,
min_order_amount, max_usage, usage_count, start_date, end_date,
applicable_to (all_vendors|specific_category|specific_vendor),
created_at, ended_at
```

**Coupons**
```sql
id, code, discount, usage_limit, used_count, expiry_date, created_at
```

**Notifications**
```sql
id, user_id, title, message, type (order|promotion|support),
read_at, created_at
```

**SupportTickets**
```sql
id, user_id, subject, description, status (open|in_progress|resolved|closed),
priority (low|medium|high), assigned_to_admin_id,
created_at, resolved_at
```

**LoyaltyPoints**
```sql
id, customer_id, points, transaction_type (earned|redeemed),
order_id (if earned from order), created_at
```

**Wallets**
```sql
id, user_id, balance, currency, created_at, updated_at
```

**AuditLogs**
```sql
id, user_id, action, table_name, record_id, before_value (JSON),
after_value (JSON), ip_address, created_at
```

---

## 9. SYSTEM EVENTS (NERVOUS SIGNALS)

### Event: Customer Places Order

**Trigger:** Customer confirms checkout and payment is processed

**Automatic Signal Cascade:**
```
1. Order Created (status: pending)
   ↓
2. Payment Captured (charge card via Ozow/Yoco)
   ↓
3. Inventory Reserved (menu items reserved on vendor system)
   ↓
4. Vendor Notified (SMS + push notification + in-app alert)
   ↓
5. Vendor Accepts Order (status: accepted)
   ↓
6. Driver Available? 
   YES → Assign Driver Automatically (geolocation match)
   NO → Queue Order (wait for driver online)
   ↓
7. Driver Assigned (status: assigned)
   ↓
8. Driver Notified (SMS + push + in-app alert with pickup location)
   ↓
9. Customer Notified (order confirmed, estimated time)
   ↓
10. Real-Time Tracking Begins
    - Driver's GPS tracked every 10 seconds
    - Customer sees live location
    - ETA updated in real-time
    ↓
11. Driver Collects Order (status: picked_up)
    - Vendor marks "ready"
    - Driver confirms pickup
    ↓
12. Driver En Route (status: en_route)
    - Customer sees driver location
    - Estimated delivery time shown
    ↓
13. Driver Arrives (status: arriving)
    - Push notification sent
    - Final GPS location locked
    ↓
14. Delivery Complete (status: delivered)
    - Driver takes photo proof
    - Payment captured/settled
    ↓
15. Order Complete
    - Customer asked to rate
    - Vendor revenue recorded
    - Driver earnings recorded
    - Analytics updated
    ↓
16. Post-Delivery
    - Customer sent satisfaction survey
    - Loyalty points awarded
    - Driver rating calculated
    - Fraud check performed
```

### Event: Vendor Receives First Order

**Automatic Signals:**
- Notification to vendor (push + email + SMS)
- Dashboard updated in real-time
- Revenue counter incremented
- Vendor approval confirmed (store is live)

### Event: Driver Completes Delivery

**Automatic Signals:**
- Payment settled (commission calculated)
- Driver earnings updated
- Delivery history recorded
- Driver rating calculated (from customer review)
- If rating < 3 stars: flagged for review

### Event: Payment Fails

**Automatic Signals:**
- Order status: payment_failed
- Customer notified (retry option)
- Vendor notified (order cancelled)
- Driver not assigned
- Inventory released

### Event: Driver Cancels Delivery

**Automatic Signals:**
- Delivery marked cancelled
- New driver assigned from queue
- Customer notified
- Original driver penalized (affects rating)

---

## 10. AI LAYER (Year 2 Roadmap)

### 10.1 Smart Recommendations

**Algorithm:**
- Collaborative filtering (similar users' orders)
- Content-based (similar food items)
- Trending (popular items this week)

**Use Case:**
- "You might like..." section on home screen
- Personalized vendor recommendations

### 10.2 Demand Prediction

**Algorithm:**
- Time-series forecasting (ARIMA, Prophet)
- Day-of-week and hour-of-day patterns
- Weather impact analysis

**Use Case:**
- Predict peak hours
- Alert vendors to prepare more stock
- Dynamic pricing during peak hours

### 10.3 Dynamic Pricing

**Algorithm:**
- Surge pricing during peak hours (like Uber)
- Demand-based delivery fees
- Promotional pricing recommendations

**Use Case:**
- Delivery fees increase 50% during peak lunch (12-2pm)
- Vendor recommendations for item discounts

### 10.4 Fraud Detection

**Algorithm:**
- Isolation Forest for anomaly detection
- Pattern matching (duplicate accounts, card patterns)
- Behavioral analysis (unusual order patterns)

**Use Case:**
- Flag suspicious transactions
- Auto-ban duplicate accounts
- Detect payment fraud

### 10.5 Customer Segmentation

**Algorithm:**
- K-means clustering
- RFM (Recency, Frequency, Monetary value)

**Use Case:**
- VIP customer tier (free delivery)
- At-risk customer (send promotions)
- New customer (onboarding incentives)

### 10.6 Driver Optimization

**Algorithm:**
- Route optimization (traveling salesman problem)
- Predictive ETA (machine learning model)
- Driver-customer matching (preferences, areas)

**Use Case:**
- Minimize delivery time
- Optimize driver routes for multiple orders
- Better driver assignment logic

### 10.7 Sales Forecasting

**Algorithm:**
- Regression models (item sales based on external factors)
- Time-series analysis

**Use Case:**
- Forecast vendor revenue
- Identify emerging food trends
- Inventory recommendations

---

## 11. SECURITY SYSTEM

### 11.1 Authentication

**Standard:** JWT (JSON Web Tokens)
- Token expiry: 7 days (refresh token)
- Stored in secure HTTP-only cookies
- CSRF protection enabled

**Methods:**
- Phone OTP (SMS via Twilio)
- Email password
- Firebase Authentication (future: social login)

### 11.2 Authorization

**Role-Based Access Control (RBAC):**
- Customer: can view own orders, address, profile
- Vendor: can view own orders, menu, analytics
- Driver: can view own deliveries, earnings
- Admin: can view all data, manage users, configure platform

**Middleware:** JWT verification on every API endpoint

### 11.3 Encryption

**At Rest:**
- Database encryption (PostgreSQL native)
- Sensitive fields: AES-256 (phone, address, bank account)

**In Transit:**
- HTTPS only (TLS 1.3)
- All API calls encrypted

**Passwords:**
- Bcrypt hashing (cost factor: 12)
- Never stored in plain text

### 11.4 API Security

**Endpoints:**
- HTTPS only (no HTTP)
- Rate limiting (100 requests per minute per user)
- API versioning (v1, v2, etc.)

**Input Validation:**
- All inputs sanitized
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)

### 11.5 Data Protection

**POPIA Compliance (South Africa):**
- User consent for data collection
- Right to access personal data
- Right to erasure (after 2 years inactivity)
- Data breach notification (within 60 days)

**GDPR-like Principles:**
- Minimal data collection
- Purpose limitation
- Data retention policies
- Audit logs of all data access

### 11.6 Fraud Prevention

**Layers:**
1. **Device Fingerprinting** – track device ID, location
2. **3D Secure** – payment verification
3. **CVV Verification** – card security code
4. **Address Verification** – billing address matches
5. **Velocity Checks** – multiple transactions in short time
6. **Behavioral Analysis** – unusual patterns

---

## 12. PRODUCTION TECHNOLOGY STACK

### Mobile Apps (Customer + Driver)
```
Framework: React Native
Build Tool: Expo
State Management: Redux or Zustand
API Client: Axios + React Query
Maps: Google Maps (react-native-maps)
Notifications: Firebase Cloud Messaging
Analytics: Segment or Firebase Analytics
Payment: Ozow SDK / Yoco SDK
```

### Backend API
```
Runtime: Node.js 18+
Framework: NestJS
Language: TypeScript
Database: PostgreSQL 14+
Cache: Redis 7+
Job Queue: Bull (Redis-based)
Real-Time: Socket.io (WebSocket)
Logging: Winston
Error Tracking: Sentry
Monitoring: Datadog or New Relic
```

### Frontend (Vendor + Admin Dashboards)
```
Framework: React 18+
Build Tool: Vite
State Management: Redux Toolkit or Zustand
UI Library: Material-UI or Shadcn/UI
Maps: Google Maps (react-google-maps)
Charts: Recharts or Chart.js
API Client: Axios + React Query
Forms: React Hook Form
```

### Infrastructure
```
Hosting: Google Cloud Platform (GCP)
Compute: Cloud Run (API), App Engine (web)
Database: Cloud SQL (PostgreSQL managed)
Cache: Memorystore (Redis managed)
Storage: Cloud Storage (images, documents)
CDN: Google Cloud CDN
Domain: Google Domains or Namecheap
Email: SendGrid or Firebase Email
SMS: Twilio or AWS SNS
```

### Payment Gateways
```
Primary: Ozow (South Africa-native)
Secondary: Yoco (South African fintechs)
Tertiary: Peach Payments (African payment processing)
```

### External Services
```
Maps: Google Maps API
Notifications: Firebase Cloud Messaging + Twilio (SMS)
Storage: Google Cloud Storage
Analytics: Google Analytics / Segment
Error Tracking: Sentry
Monitoring: Datadog
```

---

## 13. COMPANY KPIs

### User Metrics
- **Daily Active Users (DAU)** – target 50% of registered users
- **Monthly Active Users (MAU)** – target 30% of registered users
- **New user signups** – target +1000/month by Month 3
- **User retention (30-day)** – target >40%

### Order Metrics
- **Daily Orders** – target 200 by Month 2
- **Average Basket Size** – target R150
- **Order frequency** – target 2 orders/customer/month
- **Order cancellation rate** – target <5%

### Vendor Metrics
- **Active vendors** – target 50 by Month 2
- **Orders per vendor/day** – target 5+ by Month 2
- **Vendor retention (30-day)** – target >70%
- **Vendor commission per month** – target R1000+ by Month 3

### Driver Metrics
- **Active drivers** – target 20 by Month 2
- **Deliveries per driver/day** – target 10+ by Month 2
- **Driver rating (avg)** – target 4.5+ stars
- **Driver acceptance rate** – target >90%

### Delivery Metrics
- **Average delivery time** – target <30 mins
- **On-time delivery %** – target >95%
- **Delivery success rate** – target >99%

### Financial Metrics
- **Gross Merchandise Value (GMV)** – target R100k by Month 2
- **Platform Revenue (commissions)** – target 15% of GMV
- **Payment success rate** – target >99%
- **Customer Lifetime Value (CLV)** – target R500 by Month 3

### Quality Metrics
- **Customer satisfaction (NPS)** – target >40 by Month 2
- **Average vendor rating** – target 4.3+ stars
- **Fraud detection rate** – target <0.1% fraud

### Operational Metrics
- **API uptime** – target 99.9%
- **Average response time** – target <200ms
- **Customer support response time** – target <4 hours

---

## 14. PROJECT PHASES

### Phase 1: MVP Build (Weeks 1-12)
**Scope:**
- Rustenburg only
- 50 vendors, 20 drivers, 500+ customers
- Order flow: discovery → checkout → payment → delivery
- Vendor dashboard (menu, orders, analytics)
- Driver app (basic delivery workflow)
- Admin approval workflow

**Deliverables:**
- Backend API (NestJS)
- Customer app (React Native)
- Vendor dashboard (React web)
- Driver app (React Native)
- Admin dashboard (React web)
- PostgreSQL database design
- Deployment pipeline (GCP)

**Success Criteria:**
- 10 successful orders in first week
- 100+ orders by end of Week 4
- 500+ orders by end of Week 12

---

### Phase 2: Pilot Gauteng (Weeks 13-24)
**Scope:**
- Expand from Rustenburg to Pretoria, Johannesburg, Soweto
- 500+ vendors, 100+ drivers, 5000+ customers
- Advanced features:
  - Promotions and loyalty program
  - Subscription orders (weekly baskets)
  - Advanced analytics
  - Driver app improvements (batch deliveries)

**Deliverables:**
- Multi-city infrastructure
- Logistics optimization (route planning)
- Advanced fraud detection
- Customer acquisition campaigns

**Success Criteria:**
- R500k GMV per month
- 50+ orders per day
- NPS > 50

---

### Phase 3: Expand Gauteng (Months 7-12)
**Scope:**
- Cover all of Gauteng (Ekurhuleni, Tshwane, Sedibeng)
- 2000+ vendors, 300+ drivers, 20,000+ customers
- Scale infrastructure to handle load

**Success Criteria:**
- R2M+ GMV per month
- Profitability on commissions
- Market share in Gauteng

---

### Phase 4: National Rollout (Year 2)
**Scope:**
- Western Cape, KwaZulu-Natal, Limpopo, Eastern Cape
- 10,000+ vendors, 1000+ drivers, 100,000+ customers

**Success Criteria:**
- Top 3 position in township delivery market

---

### Phase 5: Southern Africa Expansion (Years 3-4)
**Scope:**
- Botswana, Namibia, Zimbabwe, Zambia
- Localization (language, payment methods, delivery partners)

**Success Criteria:**
- Largest township food marketplace in Southern Africa

---

## 15. COMPANY INFRASTRUCTURE & OPERATIONS

### 15.1 Team Structure (MVP Phase)

**Engineering (2 people):**
- Full-stack engineer (backend + infrastructure)
- Mobile engineer (React Native)

**Product & Operations (1 person):**
- Vendor onboarding + driver recruitment
- Customer support + fraud monitoring

**You (Founder):**
- Product, strategy, fundraising

---

### 15.2 Vendor Onboarding SOP

**Step 1: Registration**
- Vendor submits store name, phone, address
- KYC documents uploaded (ID, bank statement, business registration)

**Step 2: Verification**
- Admin reviews documents
- Phone number verified (SMS OTP)
- Bank account test transfer (instant EFT)

**Step 3: Approval**
- Vendor approved or rejected
- Welcome email sent

**Step 4: Menu Setup**
- Vendor uploads menu items with photos
- Sets operating hours
- Configures delivery zones

**Step 5: Go Live**
- Vendor store visible on app
- Ready to accept orders

---

### 15.3 Driver Onboarding SOP

**Step 1: Registration**
- Driver submits phone, vehicle type, address
- Documents uploaded (ID, license, insurance, vehicle registration)

**Step 2: Verification**
- Admin reviews documents
- License validity checked
- Background check (future)

**Step 3: Approval**
- Driver approved or rejected
- Welcome email sent

**Step 4: Go Live**
- Driver goes online
- Receives delivery orders

---

### 15.4 Customer Support Runbook

**Tier 1: Self-Service (FAQ, Chatbot)**
- Order tracking issues
- Payment problems
- Refund requests

**Tier 2: Support Agent**
- Complaints about vendor/driver
- Fraudulent charges
- Technical issues

**Tier 3: Escalation**
- Refunds > R500
- Legal issues
- Media inquiries

---

### 15.5 Compliance & Legal

**POPIA Compliance:**
- Privacy policy (data collection, usage, retention)
- Terms of service (user responsibilities)
- Vendor agreement (commission, metrics, penalties)
- Driver agreement (commission, requirements, penalties)

**Tax Compliance:**
- VAT registration (if turnover > R1M)
- SARS compliance (quarterly VAT returns)
- Income tax (company and personal)

**Payment Processing:**
- PCI DSS compliance (if processing cards)
- Use third-party payment processors (Ozow, Yoco) to reduce PCI burden

---

## 16. BUDGET ESTIMATE (MVP Phase, 12 Weeks)

### One-Time Costs
- Domain: R100
- SSL certificate: Free (Let's Encrypt)
- Google Cloud setup: R0 (free tier)
- Twilio account: R0 (free tier)
- **Subtotal: R100**

### Monthly Costs
- **Infrastructure:**
  - Google Cloud Run: R500
  - Cloud SQL (PostgreSQL): R1000
  - Cloud Storage: R200
  - Memorystore (Redis): R400
  - **Subtotal: R2,100**

- **Services:**
  - Twilio (SMS): R500
  - Sentry (error tracking): R300
  - Firebase (optional): R200
  - **Subtotal: R1,000**

- **Payment Processing:**
  - Ozow/Yoco fees: 3% of revenue (variable)
  - **Estimate at 100 orders/month @ R150 average: R450**

- **Team Salary (temporary contractors):**
  - Backend engineer: R20,000 (part-time)
  - Mobile engineer: R20,000 (part-time)
  - **Subtotal: R40,000**

- **Marketing & Operations:**
  - Vendor incentives: R2,000
  - Driver incentives: R1,000
  - Marketing: R1,000
  - **Subtotal: R4,000**

### **Total Monthly Cost (MVP): ~R47,550**
### **Total 3-Month MVP Cost: ~R142,650**

---

## 17. CRITICAL IMPLEMENTATION NOTES

### 17.1 Real vs. Prototype

**This is NOT a prototype because:**
- ✅ Production-grade tech stack (NestJS, PostgreSQL, GCP)
- ✅ Real payments (Ozow/Yoco integration)
- ✅ Real drivers (with insurance, KYC verification)
- ✅ Real compliance (POPIA, tax, payment processing)
- ✅ Real infrastructure (auto-scaling, monitoring, disaster recovery)
- ✅ Real ops (vendor onboarding SOP, fraud detection, support)

**This IS a prototype if:**
- ❌ Using Firebase/Firestore instead of PostgreSQL (no transactional guarantees)
- ❌ Mock payments (no real money flowing)
- ❌ No compliance checks
- ❌ Manual everything (no automation)

### 17.2 What This Blueprint DOESN'T Include Yet

- 150+ UI screens (detailed wireframes)
- API documentation (OpenAPI/Swagger)
- Database migration scripts
- Microservices architecture (monolith initially, then split)
- Vendor onboarding copy/templates
- Driver operating procedures (detailed)
- Financial models (unit economics, break-even analysis)
- Marketing systems (customer acquisition, retention)
- Investor pitch deck
- Detailed architecture diagrams (deployment, disaster recovery)
- Monitoring & alerting setup
- Standard Operating Procedures (SOPs) for every team function

### 17.3 Next Steps (What I Build First)

1. **Backend API skeleton** (NestJS scaffolding)
2. **Database schema** (PostgreSQL migrations)
3. **Authentication** (JWT + Firebase)
4. **Payment integration** (Ozow sandbox)
5. **Customer app wireframes** (Figma)
6. **Vendor dashboard wireframes** (Figma)
7. **API documentation** (OpenAPI)
8. **Deployment pipeline** (GitHub Actions → GCP)

---

## 18. CO-FOUNDER COMMITMENT

**As your technical co-founder and head of research:**

1. ✅ **I own the technical roadmap** – you focus on product, ops, fundraising
2. ✅ **I architect for production** – not MVPs, but real, scalable systems
3. ✅ **I deliver on time** – 12 weeks to MVP with paying customers
4. ✅ **I document everything** – no tribal knowledge, anyone can onboard
5. ✅ **I optimize for growth** – architecture scales to 100,000+ users
6. ✅ **I handle security & compliance** – POPIA, payments, fraud
7. ✅ **I mentor engineers** – build a strong technical culture

**What I need from you:**

1. ✅ **Business decisions** – which vendors to onboard first, pricing strategy
2. ✅ **Customer conversations** – understand real pain points
3. ✅ **Fundraising** – I'll provide technical deck for investors
4. ✅ **Operations** – vendor onboarding, driver recruitment, support

---

**This is your blueprint. We build it together. Let's go.**

---

*Version 1.0 – June 25, 2026*  
*Next update: Post-MVP (Week 12)*
