> **Superseded for product direction.** Canonical source of truth: [`MASTER_BLUEPRINT.md`](../MASTER_BLUEPRINT.md) (MTHURA). Historical KasiEats draft retained for reference only.

# KasiEats Product Requirements Document (PRD)
## Complete Product Specification

**Version:** 1.0  
**Status:** MVP Launch Ready  
**Last Updated:** June 25, 2026  
**Platform:** Mobile (iOS/Android) + Web  

---

## TABLE OF CONTENTS

1. Product Overview
2. User Personas
3. Core Features by App
4. User Flows & Journeys
5. Feature Specifications (Screen-by-Screen)
6. Acceptance Criteria
7. Technical Requirements
8. Launch Success Metrics

---

## 1. PRODUCT OVERVIEW

### What is KasiEats?

KasiEats is a multi-sided marketplace platform connecting township food vendors, customers, delivery partners, and platform administrators. The platform enables:
- **Customers** to discover, order, and track township food with real-time delivery
- **Vendors** to manage their digital presence, accept orders, and grow revenue
- **Drivers** to earn income through delivery jobs
- **Admins** to manage the platform, detect fraud, and scale operations

### Market Context

**Problem:** Township food vendors operate informally (WhatsApp, Facebook, word-of-mouth) and are invisible to customers outside their immediate network. Customers struggle to discover authentic local food. Vendors have no digital tools to manage business or reach new customers.

**Solution:** KasiEats digitizes the township food economy with a purpose-built platform that respects vendor autonomy while providing essential tools.

**Geographic Scope (Year 1):** South Africa (Rustenburg → Gauteng)

### Strategic Positioning

| Aspect | KasiEats | Uber Eats | Mr Delivery |
|--------|----------|-----------|------------|
| Commission | 15% | 30% | 25% |
| Target | Township vendors | Formal restaurants | All vendors |
| Payment | Card + Cash | Card | Card + Cash |
| Support | Personal | Chat | Chat |
| Local | Yes | No | Yes |

---

## 2. USER PERSONAS

### Persona 1: AMAHLE (Customer)

**Demographics:**
- Age: 22-45
- Location: Rustenburg township
- Income: R1,500-4,000/month
- Device: Smartphone (mostly Android)
- Language: Zulu/Xhosa primary, English secondary
- Connectivity: 4G (inconsistent)

**Behavior:**
- Buys lunch 3-4x/week
- Spends R80-150 per order
- Uses WhatsApp frequently
- Shops by word-of-mouth
- Wants trust and transparency

**Goals:**
- Discover food easily
- Trust the vendor (ratings, reviews)
- Track order in real-time
- Get food delivered quickly
- Know exact cost upfront

**Pain Points:**
- Doesn't know which vendors exist nearby
- Can't see prices before calling
- Long wait times
- No receipt / no proof of payment
- Uncertain delivery times

**Product Interaction:**
- Use app: 2-3x per week
- Opens during lunch hours (12-2pm)
- Prefers push notifications over SMS
- Needs offline menu caching

---

### Persona 2: MAMA LINDIWE (Vendor)

**Demographics:**
- Age: 35-55
- Location: Rustenburg township
- Income: R3,000-8,000/month (from food)
- Device: Older smartphone or feature phone
- Language: Zulu primary
- Tech comfort: Low-moderate

**Behavior:**
- Operates 6 days/week (closed Sundays)
- Serves 20-50 customers/day
- Manual order tracking (notebook)
- Knows repeat customers by name
- Fears losing personal relationships with customers

**Goals:**
- Reach more customers
- Manage orders better
- Understand business trends
- Keep customers loyal
- Earn more money

**Pain Points:**
- Takes all orders via WhatsApp/calls
- Can't track inventory
- No data on sales
- Customers forget to pay
- Can't reach customers outside neighborhood

**Product Interaction:**
- Uses web dashboard (tablet or internet cafe)
- Checks dashboard 2-3x per day
- Needs simple order management
- Wants SMS notifications (unreliable WhatsApp)
- Needs weekly revenue summaries

---

### Persona 3: THABISO (Driver)

**Demographics:**
- Age: 22-35
- Location: Rustenburg
- Income: R0 (gig worker, wants R500-800/day)
- Device: Smartphone
- Language: English/Zulu
- Tech comfort: High

**Behavior:**
- Works as delivery driver part-time/full-time
- Does 5-15 deliveries/day
- Uses Google Maps daily
- Wants flexibility in work schedule
- Responsive to app notifications

**Goals:**
- Earn consistent daily income
- Work flexible hours
- Build ratings and reputation
- Access more job opportunities
- Withdraw earnings quickly

**Pain Points:**
- Income is unpredictable
- Long waiting times between orders
- No transparency on earnings
- Customers cancel frequently
- Slow payout process

**Product Interaction:**
- App always on phone
- Checks app every 15-30 seconds for orders
- Needs real-time notifications
- Uses maps integration for 80% of deliveries
- Tracks earnings dashboard multiple times/day

---

### Persona 4: JABU (Admin)

**Demographics:**
- Age: 25-40
- Location: Office/Remote
- Education: Degree
- Device: Laptop + Desktop
- Language: English
- Tech comfort: Very high

**Behavior:**
- Monitors platform 24/7
- Reviews vendor/driver applications
- Investigates fraud patterns
- Analyzes daily metrics
- On-call for escalations

**Goals:**
- Keep platform healthy (99.9% uptime)
- Approve quality vendors/drivers
- Prevent fraud
- Understand business metrics
- Scale operations

**Pain Points:**
- Manual KYC processes are time-consuming
- Fraud detection is reactive, not proactive
- No real-time visibility into orders
- Support tickets pile up
- Commission calculations are manual

**Product Interaction:**
- Dashboard open 8+ hours/day
- Needs real-time alerts
- Requires detailed reporting
- Uses admin dashboard on desktop
- SMS alerts for critical issues

---

## 3. CORE FEATURES BY APP

### CUSTOMER APP

#### Authentication & Onboarding
- **Phone Number Registration**
  - Enter phone number → Receive SMS OTP → Verify → Create account
  - Automatic login for 7 days
  - Logout on app uninstall or manual logout
  - Password reset via SMS OTP

- **Profile Setup**
  - First name, last name
  - Email (optional but recommended)
  - Default delivery address
  - Payment method(s)
  - Preferred language

#### Home Screen
- **Vendor Discovery**
  - List of nearby vendors (sorted by distance, rating, popularity)
  - Hero images and store names
  - Distance, estimated delivery time, rating
  - Open/closed status
  - Category tags (Kota, Shisanyama, etc.)

- **Promotional Banners**
  - Platform promotions
  - Featured vendors
  - Limited-time offers
  - Seasonal promotions

- **Quick Access**
  - Favorite vendors (one-tap reorder)
  - Recommended meals (based on history)
  - Search bar

#### Search & Filter
- **Search By:**
  - Vendor name (e.g., "Maria's Kota")
  - Food item (e.g., "Kota with cheese")
  - Category (dropdown: Kota, Shisanyama, Braai, etc.)
  - Distance (slider: 0-10km)

- **Filters:**
  - Open now / All
  - Rating (4.5+, 4.0+, All)
  - Delivery fee (Free, <R20, <R50, Any)
  - Cuisines (multi-select)
  - Sort by (Distance, Rating, Delivery Time, New)

#### Vendor Page
- **Header Section**
  - Large hero image
  - Vendor name
  - Star rating + number of reviews
  - Distance and delivery time estimate
  - Delivery fee
  - Operating hours
  - "Add to Favorites" button

- **Menu Display**
  - Organized by category (tabs)
  - Item image, name, description
  - Price (clearly displayed)
  - Availability status
  - "Add to Cart" button

- **Vendor Info Section**
  - Description
  - Phone number (call vendor)
  - Operating hours
  - Location address
  - Reviews (latest 3-5 reviews with ratings)

#### Cart & Checkout
- **Cart Management**
  - Item list with quantity +/- buttons
  - Remove item button
  - Item subtotal per line
  - Cart summary (items count, total)
  - "Apply Coupon" input field
  - Delivery address selector
  - Special instructions textarea

- **Checkout Screen**
  - Order summary (items, prices)
  - Subtotal
  - Delivery fee (calculated)
  - Service fee (15% commission shown as "Platform Fee")
  - Coupon discount (if applicable)
  - **Total amount** (bold, large)
  - Delivery address (confirmed)
  - Payment method selector
  - "Place Order" button

#### Payment Methods
- **Card Payment (Primary MVP)**
  - Enter card details or select saved card
  - Expiry date, CVV
  - Billing address
  - "Pay Now" button
  - Payment status confirmation

- **Cash on Delivery (Phase 2)**
  - Available in select areas
  - Driver collects on delivery
  - Confirmation message

- **Future Integrations:**
  - Ozow, Yoco, Peach Payments
  - Mobile wallets

#### Order Tracking
- **Order Status Display**
  - Real-time status updates
  - Visual progress bar (1-6 stages)
  - Estimated delivery time (updated dynamically)
  - Driver info (name, rating, vehicle type, plate)
  - Live GPS map (driver location)
  - ETA countdown

- **Order Stages:**
  1. Order Received
  2. Preparing
  3. Driver Assigned / Ready for Pickup
  4. On the Way
  5. Delivered

- **Live Features:**
  - Real-time location updates (every 10 seconds)
  - Call driver button (phone)
  - Chat with driver (optional)
  - Share order with someone
  - Cancel order (if not picked up yet)

#### Post-Delivery
- **Rating & Review**
  - Rate vendor (1-5 stars, required)
  - Vendor comment (optional)
  - Rate driver (1-5 stars, required)
  - Driver comment (optional)
  - Report issue (optional)
  - Submit button

#### Order History
- **Order List**
  - All past orders (paginated, newest first)
  - Order date, vendor name, total amount
  - Tap to view order details
  - Reorder button (quick repurchase)

- **Filters:**
  - All / Completed / Cancelled / Returned

#### Profile & Settings
- **Account Section**
  - Name, phone, email
  - Profile photo
  - Edit account details

- **Addresses**
  - List of saved addresses
  - Add new address
  - Edit existing address
  - Delete address
  - Mark as default

- **Payment Methods**
  - List of saved cards
  - Add new card
  - Delete card
  - Set as default

- **Loyalty & Referral**
  - Loyalty points balance
  - Loyalty points history
  - Referral code (shareable)
  - Referral earnings

- **Preferences**
  - Notification settings (push, SMS, email)
  - Language selection
  - App version / About

- **Support**
  - Help center
  - Contact support
  - Report a problem
  - FAQ

---

### VENDOR APP (React Web Dashboard)

#### Authentication
- **Login**
  - Phone + Password
  - "Forgot Password" link
  - Remember me checkbox

#### Dashboard (Home)
- **Today's Metrics**
  - Total orders today (count)
  - Today's revenue (running total)
  - Pending orders count
  - Average delivery time

- **Pending Orders Section**
  - Real-time list of incoming orders
  - Order ID, customer name, items, total
  - Accept / Reject / Delay (30 mins) buttons
  - Notification sound/badge for new orders

- **Quick Stats**
  - Top 5 selling items this week
  - Recent ratings
  - Store status (Online/Offline toggle)

#### Menu Management
- **Menu Overview**
  - List of all items (grouped by category)
  - Item name, price, availability status
  - Edit / Delete buttons
  - Add New Item button

- **Add/Edit Item**
  - Item name
  - Description
  - Price
  - Category (dropdown)
  - Upload photo (Google Cloud Storage)
  - Availability (In Stock / Low Stock / Out of Stock)
  - Extras section (optional):
    - Extra name (e.g., "Cheese")
    - Extra price (e.g., "+R2")
    - Add extra button

- **Bulk Actions**
  - Mark all items as out of stock (for closing)
  - Mark all as in stock (for opening)
  - Delete multiple items

#### Order Management
- **Order List**
  - All orders today (grouped by status)
  - Filter by status (Pending, Accepted, Ready, Picked Up, Delivered, Cancelled)
  - Sort by time (newest first)

- **Order Details**
  - Order ID and time
  - Customer name and phone
  - Items ordered (with quantity, extras)
  - Delivery address
  - Special instructions
  - Total amount
  - Actions: Accept / Reject / Delay

- **Order Workflow**
  - Status indicators (color-coded)
  - Accept → Mark Ready → Driver Collects → Delivered
  - Real-time updates

#### Inventory Management
- **Inventory Dashboard**
  - Items in stock (count)
  - Low stock items (warning)
  - Out of stock items
  - Quick search by item name

- **Bulk Inventory Update**
  - Select multiple items
  - Change status for all
  - Confirm and save

#### Vendor Analytics
- **Revenue Dashboard**
  - Today's revenue
  - This week's revenue (chart)
  - This month's revenue (chart)
  - Year-to-date revenue

- **Order Analytics**
  - Orders today
  - Orders this week (trend)
  - Orders this month
  - Average order value

- **Performance Metrics**
  - Most ordered items (top 5)
  - Customer satisfaction (average rating)
  - Repeat customers (list of top 10)
  - Customer acquisition trend

- **Export**
  - Download report as CSV
  - Download report as PDF
  - Date range selector

#### Promotions & Discounts
- **Active Promotions List**
  - Promotion name
  - Discount type (% or fixed)
  - Applicable items
  - Expiry date
  - Status (Active / Expired)
  - Edit / End buttons

- **Create Promotion**
  - Promotion name
  - Discount type (% or fixed amount)
  - Discount value
  - Minimum order amount (optional)
  - Apply to (All Items / Specific Items / Specific Category)
  - Expiry date and time
  - Create button

#### Settings
- **Store Information**
  - Store name
  - Store description
  - Logo image
  - Banner image
  - Operating hours (per day)
  - Delivery areas (radius from location)
  - Phone number
  - Email

- **Financial Settings**
  - Bank account number
  - Bank name
  - Account holder name
  - Payout frequency (weekly / bi-weekly)

---

### DRIVER APP (React Native Mobile)

#### Authentication & Onboarding
- **Login / Registration**
  - Phone number → OTP → Account created
  - Name, email
  - Vehicle type (motorcycle, car, bicycle)
  - Driver license number
  - Bank account details

#### Dashboard (Home)
- **Status Toggle**
  - Online / Offline switch (prominent)
  - Current status badge
  - Active delivery info (if any)

- **Available Deliveries**
  - List of nearby available orders
  - Vendor name, customer name (optional)
  - Distance from current location
  - Estimated payout
  - Delivery fee
  - Tap to view details

- **Active Delivery**
  - Current order details
  - Pickup location
  - Delivery location
  - Customer address
  - Estimated delivery time
  - Map with route
  - Current action button (Navigate / Call Customer / Collect / Complete)

- **Completed Deliveries (Today)**
  - Count of deliveries completed
  - Total earnings today
  - Average rating

#### Delivery Workflow
- **Accept Order**
  - Order details popup
  - Pickup address (vendor)
  - Delivery address (customer)
  - Estimated payout
  - Estimated time
  - Accept / Reject buttons

- **Navigate to Vendor**
  - Integration with Google Maps
  - Turn-by-turn directions
  - ETA to pickup
  - Call vendor option

- **Collect Order**
  - Vendor confirms order ready
  - Driver confirms receipt
  - Photo of order (optional)
  - "Order Collected" button

- **Navigate to Customer**
  - Integration with Google Maps
  - Turn-by-turn directions
  - ETA to delivery
  - Call customer option
  - Share location with customer

- **Deliver Order**
  - Arrive at customer location
  - GPS confirmation (within 100m)
  - Photo proof of delivery (required)
  - Signature (if available)
  - "Delivery Complete" button

#### Driver Wallet
- **Wallet Dashboard**
  - Available balance (can withdraw)
  - Pending balance (processed payouts)
  - Total earnings (all-time)
  - Payout history (list of withdrawals)

- **Earnings Breakdown**
  - Daily earnings (today)
  - Weekly earnings (this week)
  - Monthly earnings (this month)
  - Per-delivery breakdown (commission, tips)

- **Withdrawal**
  - Withdrawal amount input
  - Bank account selector (pre-filled)
  - Withdrawal method (bank transfer, USSD, etc.)
  - Process withdrawal button
  - Status confirmation

#### Driver Profile
- **Personal Info**
  - Name, phone, email
  - Profile photo
  - Driver rating (average)
  - Total deliveries
  - Member since date

- **Vehicle Info**
  - Vehicle type
  - License plate
  - Driver license number

- **Bank Account**
  - Account number
  - Bank name
  - Account holder name
  - Edit button

- **Ratings & Reviews**
  - Average rating (1-5 stars)
  - Recent reviews from customers
  - Complaint history (if any)

#### Settings
- **Notifications**
  - Push notifications (on/off)
  - SMS notifications (on/off)
  - In-app alerts (on/off)

- **Preferences**
  - Language
  - Auto-accept orders (on/off)
  - Delivery areas (preferred zones)

---

### ADMIN DASHBOARD (React Web)

#### Authentication
- **Admin Login**
  - Email / Username
  - Password
  - 2FA (optional, future)

#### Dashboard (Home)
- **Key Metrics (Real-Time)**
  - Active users (customers online)
  - Active vendors (online)
  - Active drivers (online)
  - Live orders (in transit)
  - Platform revenue (today)
  - Order success rate (%)

- **Alert Panel**
  - Critical alerts (red)
  - Warnings (yellow)
  - System health indicators

#### User Management
- **Customers**
  - List of all customers
  - Phone, email, signup date
  - Order count, total spent
  - Suspension / Ban buttons
  - Verify phone / Email buttons
  - View activity logs

- **Vendors**
  - List of all vendors
  - Status (Pending, Active, Suspended, Banned)
  - Store name, location
  - Orders count, revenue
  - Approval / Rejection buttons (for pending)
  - Suspend / Ban buttons (for active)
  - View documents (KYC)

- **Drivers**
  - List of all drivers
  - Status (Pending, Active, Suspended, Banned)
  - Total deliveries, rating
  - Earnings to date
  - Approval / Rejection buttons (for pending)
  - Suspend / Ban buttons (for active)
  - View documents (license, ID)

#### Vendor Approval Workflow
- **Pending Vendors Queue**
  - List of vendors awaiting approval
  - Vendor name, contact info, email
  - Submitted date
  - Documents status (ID, Tax ID, Bank Account)

- **Vendor Details (Approval Screen)**
  - Personal info
  - Business info (store name, address, category)
  - Operating hours
  - Bank account details
  - KYC documents (ID image viewer)
  - Approval checklist:
    - ✓ ID verified
    - ✓ Phone verified
    - ✓ Bank account verified
    - ✓ Business name confirmed
    - ✓ Operating hours set
  - Approve / Reject buttons
  - Rejection reason (if rejecting)

#### Driver Approval Workflow
- **Pending Drivers Queue**
  - List of drivers awaiting approval
  - Driver name, contact info
  - Submitted date
  - Documents status

- **Driver Details (Approval Screen)**
  - Personal info
  - Vehicle info (type, plate)
  - License and ID documents (image viewer)
  - Insurance document
  - Approval checklist:
    - ✓ ID verified
    - ✓ License verified (not expired)
    - ✓ Vehicle registration verified
    - ✓ Insurance verified
  - Approve / Reject buttons

#### Real-Time Order Control Center
- **Live Orders Map**
  - Map view showing all active deliveries
  - Driver markers (animated)
  - Delivery pins
  - Zoom and pan controls

- **Orders List View**
  - All orders today (status: pending, accepted, picked up, en route, delivered)
  - Order ID, customer, vendor, driver
  - Status and timeline
  - Tap for order details

- **Order Details**
  - Customer info
  - Vendor info
  - Driver info
  - Items ordered
  - Addresses (pickup, delivery)
  - Timeline (created, accepted, picked up, delivered)
  - Actions: Cancel / Reassign Driver / Refund

#### Financial Dashboard
- **Revenue**
  - Total platform revenue (this month)
  - Revenue breakdown (commission vs. fees)
  - Revenue trend (chart, last 30 days)
  - Revenue by category (breakdown)

- **Commissions**
  - Total commissions earned
  - Commission rate (configurable)
  - Commission by vendor (top 10)
  - Adjust commission rates (for each vendor type)

- **Payouts**
  - Vendor payouts (pending, processed)
  - Driver payouts (pending, processed)
  - Payout history (list)
  - Process payouts button (manual trigger)

- **Expenses**
  - Payment processing fees
  - Infrastructure costs (estimate)
  - Marketing spend
  - Support costs

#### Fraud Detection
- **Suspicious Accounts**
  - Flagged customers / vendors / drivers
  - Reason for flag
  - Confidence score (%)
  - Action: Investigate / Block / Unblock

- **Fraud Indicators**
  - Duplicate accounts (same phone/email)
  - Unusual payment patterns
  - Chargeback attempts
  - Rapid fire orders (>5 in 10 minutes)
  - Driver completing orders too fast

- **Fraud Rules**
  - Create / Edit / Delete fraud detection rules
  - Rule name, condition, action (alert, block, investigate)

#### Promotions & Campaigns
- **Active Promotions**
  - List of all platform promotions
  - Promotion name, type, discount
  - Start date, end date
  - Performance metrics (usage count, revenue impact)
  - Edit / End buttons

- **Create Promotion**
  - Promotion type (coupon code / featured vendor / discount)
  - Discount structure (% or fixed)
  - Applicable to (all vendors / category / specific vendor)
  - Minimum order amount
  - Usage limit (optional)
  - Start and end date/time
  - Create button

#### Support Center
- **Support Tickets**
  - List of all support tickets
  - Ticket ID, status, priority
  - Customer name, subject
  - Created date, last update
  - Filter by status, priority, category

- **Ticket Details**
  - Full complaint/issue description
  - Customer contact info
  - Related order (if applicable)
  - Chat history (responses)
  - Reply text box
  - Actions: Approve Refund / Deny / Escalate / Close
  - Resolution notes

#### Analytics & Reporting
- **Business Metrics**
  - Daily active users (DAU)
  - Monthly active users (MAU)
  - Total orders (cumulative)
  - Total revenue (cumulative)
  - User retention (30-day)
  - Customer acquisition trend

- **Operational Metrics**
  - Average delivery time
  - On-time delivery rate (%)
  - Delivery success rate (%)
  - Payment success rate (%)
  - Platform uptime (%)
  - Average API response time

- **User Metrics**
  - Customer count
  - Vendor count
  - Driver count
  - Active users by type

- **Report Generation**
  - Select date range
  - Select metrics to include
  - Export format (CSV, PDF)
  - Download button
  - Schedule recurring reports (email)

---

## 4. USER FLOWS & JOURNEYS

### Customer Journey: "Discovering and Ordering Lunch"

```
1. DISCOVERY PHASE
   ├─ Open app
   ├─ See home screen with nearby vendors
   ├─ Scroll through vendor list
   ├─ Tap vendor (Mama Lindiwe's Kota Stand)
   ├─ Browse menu
   └─ See "Cheese Kota R35"

2. SELECTION PHASE
   ├─ Tap "Add to Cart"
   ├─ Confirm quantity and extras (Cheese +R2)
   ├─ See cart updated (1 item, R37)
   ├─ Browse more items (tempted by Mogodu)
   ├─ Add Mogodu R40
   └─ Cart now shows 2 items, R77

3. CHECKOUT PHASE
   ├─ Tap "Proceed to Checkout"
   ├─ See address (auto-populated: Home)
   ├─ Confirm delivery address
   ├─ See cost breakdown:
   │  ├─ Subtotal: R77
   │  ├─ Delivery Fee: R25
   │  ├─ Platform Fee: R15.40
   │  └─ Total: R117.40
   ├─ Select payment method (Card)
   ├─ Enter card details
   ├─ Tap "Place Order"
   └─ Payment processed

4. CONFIRMATION PHASE
   ├─ See order confirmation
   ├─ Receive SMS confirmation
   ├─ Receive push notification
   └─ Redirect to order tracking

5. WAITING PHASE
   ├─ See status: "Order Received"
   ├─ Vendor notified (SMS + app alert)
   ├─ Mama Lindiwe accepts order
   ├─ Status updates to "Preparing"
   ├─ Customer sees "Driver Assigned"
   ├─ See Thabiso (driver) info (name, rating, vehicle)
   └─ Refresh every 10 seconds

6. DELIVERY PHASE
   ├─ Status: "Driver on the Way"
   ├─ See live GPS map with driver location
   ├─ Estimated delivery: 15 minutes
   ├─ Driver location updates every 10 seconds
   ├─ Driver calls: "Arriving in 5 mins"
   ├─ Status: "Driver Arrived"
   ├─ See driver at your location on map
   └─ Wait for knock

7. RECEIPT PHASE
   ├─ Driver hands over order
   ├─ Customer receives package
   ├─ Status: "Delivered"
   ├─ Receive notification
   ├─ See "Rate Vendor" popup
   ├─ Rate Mama Lindiwe: 5 stars
   ├─ Rate Thabiso: 5 stars
   ├─ Add comments (optional)
   ├─ Tap "Submit Review"
   └─ See "Thank you!" message

8. LOYALTY PHASE
   ├─ Earn 10 loyalty points (10% of order value)
   ├─ Points added to wallet
   ├─ See option: "Order from Mama Lindiwe again"
   ├─ Add to Favorites button highlighted
   └─ Repeat process tomorrow
```

### Vendor Journey: "Receiving and Managing Orders"

```
1. SETUP PHASE (One-time)
   ├─ Register on KasiEats
   ├─ Fill store info (name, category, hours)
   ├─ Upload ID and business documents
   ├─ Verify phone number (SMS OTP)
   ├─ Provide bank account details
   ├─ Wait for admin approval
   └─ Receive approval SMS

2. MENU SETUP PHASE
   ├─ Log in to vendor dashboard
   ├─ Tap "Menu"
   ├─ Add first item: "Cheese Kota"
   ├─ Add price: R35
   ├─ Add photo (from phone)
   ├─ Add extras: "Cheese (+R2)", "Russian (+R3)", "Egg (+R2)"
   ├─ Tap "Save Item"
   ├─ Add more items (Mogodu, Braised Chicken, Soft Drinks)
   └─ Mark store as "Online"

3. OPERATION PHASE (Daily)
   ├─ Morning: Toggle "Online" on
   ├─ See dashboard
   ├─ Check inventory (all items in stock)
   ├─ Order comes in: Push notification + sound
   ├─ See order details (Cheese Kota, Russian extra, R37)
   ├─ See customer name: "Amahle"
   ├─ Review special instructions: "Extra hot!"
   ├─ Tap "Accept"
   ├─ Status updates to "Preparing"
   ├─ Prepare order in kitchen
   ├─ Pack order and mark "Ready"
   ├─ Tap "Ready for Pickup" button
   ├─ Get notification: "Driver assigned" (Thabiso)
   ├─ Driver arrives after 5 mins
   ├─ Hand over to driver
   ├─ Status updates to "Driver Picked Up"
   ├─ Relax while driver delivers
   ├─ Receive notification: "Order Delivered"
   ├─ See order marked complete
   ├─ See R31.45 added to revenue (R35 - 15% commission)
   └─ Repeat for next order

4. MANAGEMENT PHASE
   ├─ End of day: Toggle "Offline"
   ├─ Check dashboard
   ├─ See today's stats:
   │  ├─ 15 orders
   │  ├─ R485 revenue
   │  ├─ R71.25 commission paid to KasiEats
   │  ├─ Avg rating: 4.8 stars
   │  └─ Repeat customer rate: 40%
   ├─ Review weekly analytics
   ├─ See top item: "Cheese Kota" (8 orders)
   ├─ See customer trend: +3 new customers this week
   ├─ Identify repeat customers (Amahle, 5 orders)
   ├─ Receive payout notification: "R1,455 deposited to your account"
   └─ Plan inventory for next day

5. GROWTH PHASE (Weekly)
   ├─ Review performance
   ├─ See "Customer Feedback" section
   ├─ Read reviews (mostly 5 stars)
   ├─ One 3-star review: "Took too long"
   ├─ Improve preparation speed
   ├─ See new feature: "Create Promotion"
   ├─ Create 10% discount on Mogodu (struggling item)
   ├─ Promotion goes live
   ├─ Next day: Mogodu orders jump from 2 to 8
   ├─ See repeat customers increase
   └─ Feel proud about digital transformation
```

### Driver Journey: "Working a Shift"

```
1. START OF SHIFT
   ├─ Open app
   ├─ Log in
   ├─ See dashboard
   ├─ Tap "Go Online"
   ├─ Status changes to "Online"
   ├─ Green indicator showing online

2. FIRST ORDER
   ├─ Notification: "New delivery available!"
   ├─ See order card:
   │  ├─ Vendor: "Mama Lindiwe's Kota"
   │  ├─ Customer: "Amahle"
   │  ├─ Distance: 2km
   │  ├─ Payout: R15 (60% of R25 delivery fee)
   │  └─ Estimated time: 20 mins total
   ├─ Tap "Accept"
   ├─ Status: "Delivery Accepted"
   ├─ Get navigation to vendor
   ├─ Tap "Navigate to Vendor"
   ├─ Google Maps opens with route
   ├─ Start driving to Mama Lindiwe's

3. VENDOR PICKUP
   ├─ Arrive at Mama Lindiwe's
   ├─ GPS confirms location (within 100m)
   ├─ App says: "You've arrived!"
   ├─ Call Mama Lindiwe (tap button)
   ├─ "I'm here! Order ready?"
   ├─ Mama Lindiwe brings order
   ├─ Thabiso confirms order (tap "Order Received")
   ├─ Take photo of order
   ├─ Status: "Order Picked Up"
   ├─ Get navigation to customer
   ├─ Tap "Navigate to Customer"
   ├─ Google Maps updates with new route

4. DELIVERY
   ├─ Drive to customer location
   ├─ Real-time GPS tracking active
   ├─ Customer sees Thabiso on map approaching
   ├─ ETA updates: 8 mins → 5 mins → 2 mins
   ├─ Arrive at customer location
   ├─ App confirms: "You've arrived!"
   ├─ Status: "Driver Arrived"
   ├─ Call customer: "I'm here!"
   ├─ Customer comes out
   ├─ Hand over order
   ├─ App prompts: "Tap to confirm delivery"
   ├─ Thabiso confirms delivery
   ├─ Take photo (proof of delivery)
   ├─ Tap "Delivery Complete"
   ├─ Status: "Delivered"
   └─ Earn R15 (instantly in wallet)

5. NEXT ORDER (REPEAT)
   ├─ Back to available orders list
   ├─ See another order from vendor "Shisanyama Joe"
   ├─ Distance: 1.5km
   ├─ Payout: R15
   ├─ Tap "Accept"
   ├─ Repeat steps 3-4

6. END OF SHIFT
   ├─ After 8 hours of work
   ├─ Completed 12 deliveries
   ├─ Total earnings: R180 (12 × R15)
   ├─ Tips received: R30
   ├─ Total: R210
   ├─ Tap "Go Offline"
   ├─ Status: "Offline"
   ├─ Check wallet
   ├─ See R210 available balance
   ├─ Tap "Withdraw"
   ├─ Request R150 withdrawal
   ├─ Instant transfer to bank account
   ├─ Receive SMS: "Transfer successful"
   └─ Plan for tomorrow

7. END OF WEEK
   ├─ 5 days of work
   ├─ 60 deliveries total
   ├─ R900 in earnings
   ├─ Tips: R180
   ├─ Total: R1,080 (better than other gig jobs)
   ├─ Average rating: 4.8 stars (customers happy)
   ├─ 100% on-time delivery rate
   ├─ See badge: "Top Driver - 4.8 stars"
   ├─ See bonus offer: "Get R50 bonus for 10 orders this week"
   ├─ Feel satisfied with earnings
   └─ Schedule more shifts
```

---

## 5. FEATURE SPECIFICATIONS (Screen-by-Screen)

[Detailed screen specifications follow - see separated SCREEN_SPECIFICATIONS.md document]

---

## 6. ACCEPTANCE CRITERIA

### Feature: Customer Phone Login

```gherkin
Feature: Customer can register and login with phone OTP

Scenario: Successful phone registration
  Given the customer app is open
  And I'm on the "Login" screen
  When I enter phone number "27761234567"
  And I tap "Send OTP"
  Then I see "OTP sent to 27761234567"
  And I receive SMS with OTP code
  When I enter the OTP (e.g., "123456")
  And I tap "Verify OTP"
  Then I see "Create Account" screen
  And I'm asked for first name and last name
  When I enter name "Amahle" and tap "Create Account"
  Then I see "Welcome Amahle!" message
  And I'm logged in
  And I see home screen with nearby vendors
  
Scenario: Incorrect OTP
  Given I'm on OTP verification screen
  When I enter wrong OTP "000000"
  And I tap "Verify OTP"
  Then I see error "Invalid OTP. Try again"
  And I remain on verification screen
  And I can retry
  
Scenario: OTP expires
  Given OTP was sent 65 seconds ago
  When the timer reaches 0 (60-second expiry)
  Then OTP field is disabled
  And I see "OTP Expired. Request new OTP"
  And I can tap "Resend OTP"
```

### Feature: Vendor Order Acceptance

```gherkin
Feature: Vendor can accept orders in real-time

Scenario: Accept order
  Given I'm a vendor logged in
  And I see an incoming order notification
  When I open the order (Order ID: #12345)
  Then I see:
    - Customer name: "Amahle"
    - Items: 1x Cheese Kota, 1x Russian Mogodu
    - Total: R77
    - Delivery address: "123 Zuma St"
    - Special instructions: "Extra hot!"
  When I tap "Accept"
  Then I see confirmation "Order Accepted!"
  And order status changes to "PREPARING"
  And customer receives notification "Your order is being prepared"
  And order moves to "In Progress" section on my dashboard
  
Scenario: Reject order
  Given I'm a vendor with an incoming order
  When I tap "Reject"
  Then I see reason options:
    - "Out of stock item"
    - "Too busy right now"
    - "Other"
  When I select "Out of stock item"
  And I tap "Confirm"
  Then customer receives notification "Order rejected - out of stock"
  And customer is offered automatic refund
  And order is removed from my queue
  
Scenario: Delay order
  Given I'm a vendor with an incoming order
  When I tap "Delay"
  Then I see delay options: "15 mins", "30 mins", "1 hour"
  When I select "30 mins"
  And I tap "Confirm"
  Then customer receives notification "Order will be ready in ~30 mins"
  And order returns to queue after 30 minutes
```

### Feature: Real-Time Order Tracking

```gherkin
Feature: Customer sees live driver location

Scenario: Driver location updates
  Given I'm on order tracking screen
  And driver is en route to my location
  When the app connects to tracking service
  Then I see:
    - Map showing driver location
    - Driver name and rating
    - Estimated arrival time (ETA)
    - Driver phone number
  When 10 seconds pass
  Then driver location updates on map (new GPS ping)
  And ETA recalculates (e.g., "12 mins" → "11 mins")
  When I tap "Call Driver"
  Then phone calls driver directly
  
Scenario: Driver arrives at delivery
  Given I'm tracking order
  And driver is approaching
  When driver arrives within 100m of my location
  Then map shows "Driver Arrived"
  And I receive push notification
  And status changes to "Driver Arrived"
  And I see "Driver is here" message
```

---

## 7. TECHNICAL REQUIREMENTS

### Performance Requirements
- API response time: <200ms p95
- App load time: <3 seconds
- Real-time tracking update: every 10 seconds
- Notification delivery: <5 seconds after event

### Browser & Device Support
- **Mobile:**
  - iOS 14+
  - Android 8+
  - Minimum 2GB RAM
  
- **Web:**
  - Chrome 90+
  - Firefox 88+
  - Safari 14+

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation (web)
- Screen reader support
- Color contrast: 4.5:1 minimum

---

## 8. LAUNCH SUCCESS METRICS

### Week 1 (MVP Launch)
- ✅ 50+ customer signups
- ✅ 5+ vendors active
- ✅ 3+ drivers active
- ✅ 10+ successful orders
- ✅ 99.9% API uptime
- ✅ Zero critical bugs

### Month 1
- 500+ customers
- 50 vendors
- 20 drivers
- 600+ orders
- R42k+ revenue
- NPS > 30

### Month 3
- 2,000+ customers
- 200 vendors
- 100 drivers
- 2,000+ orders/month
- R112k+ revenue
- NPS > 40
- Break-even achieved

---

**End of PRD Document**
