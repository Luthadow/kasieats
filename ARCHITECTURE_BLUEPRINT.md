> **Superseded for product direction.** Canonical source of truth: [`MASTER_BLUEPRINT.md`](./MASTER_BLUEPRINT.md) (MTHURA). Historical KasiEats draft retained for reference only.

# ARCHITECTURE BLUEPRINT
## Volume 4: Technical System Design

**Status:** Production-Ready Foundation  
**Technology:** NestJS, PostgreSQL, React Native, Google Cloud Platform

---

## TABLE OF CONTENTS

1. System Overview
2. Microservices Architecture
3. API Gateway Pattern
4. Event Bus & Message Queue
5. Database Layer
6. Caching Strategy
7. Storage Architecture
8. Real-Time Communication
9. Security Model
10. Monitoring & Observability
11. Deployment Architecture
12. Disaster Recovery

---

## 1. SYSTEM OVERVIEW

### The Nervous System (Revisited)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Customer App (RN)    Vendor Web (React)   Driver App (RN)  │
│  Admin Web (React)    Internal Tools       Analytics         │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT
                           ↓
        ┌──────────────────────────────────────┐
        │      API GATEWAY (Kong/Nginx)        │
        │  • Rate limiting                     │
        │  • Authentication                    │
        │  • Request routing                   │
        │  • Response caching                  │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ↓                                     ↓
   ┌─────────���───────┐            ┌─────────────────┐
   │  SYNCHRONOUS    │            │   ASYNCHRONOUS  │
   │    SERVICES     │            │     SERVICES    │
   └─────────────────┘            └─────────────────┘
        │                                │
   REST Endpoints              Message Queue (RabbitMQ)
        │                                │
   • Auth                        • Email Notifications
   • Vendors                     • SMS Notifications
   • Orders                      • Analytics Events
   • Payments                    • Report Generation
   • Deliveries                  • Fraud Detection
   • Users                       • Batch Payouts
   • Reviews
   • Notifications
        │
        ↓
   ┌──────────────────────────────────────┐
   │      DATA LAYER                      │
   ├──────────────────────────────────────┤
   │                                      │
   │  PostgreSQL 14+ (Primary)            │
   │  • Orders, Users, Vendors            │
   │  • PostGIS for geolocation           │
   │  • Read replicas for analytics       │
   │                                      │
   │  Redis 7+ (Cache & Sessions)         │
   │  • Real-time tracking                │
   │  • Session management                │
   │  • Rate limit counters               │
   │                                      │
   └──────────────────────────────────────┘
```

---

## 2. MICROSERVICES ARCHITECTURE

### Service Decomposition

Each service is independently deployable, scalable, and testable.

#### Service 1: Auth Service
**Responsibility:** User identity and access

```
Endpoints:
  POST /auth/register
  POST /auth/login
  POST /auth/logout
  POST /auth/refresh-token
  POST /auth/verify-otp
  POST /auth/reset-password

Dependencies:
  - PostgreSQL (users table)
  - Firebase Auth (optional)
  - Redis (session management)

Deployment:
  - Cloud Run (auto-scaling)
  - Horizontal: 2-4 instances
```

#### Service 2: Vendor Service
**Responsibility:** Vendor management and analytics

```
Endpoints:
  POST /vendors/register
  GET /vendors
  GET /vendors/{id}
  PATCH /vendors/{id}
  POST /vendors/{id}/menu
  GET /vendors/{id}/orders
  GET /vendors/{id}/analytics

Dependencies:
  - PostgreSQL (vendors, menus, menu_items)
  - Redis (vendor cache, hot vendors)
  - Google Cloud Storage (logos, photos)
  - PostGIS (geospatial queries)

Deployment:
  - Cloud Run (auto-scaling)
  - Horizontal: 2-6 instances
```

#### Service 3: Order Service
**Responsibility:** Order creation, management, status tracking

```
Endpoints:
  POST /orders
  GET /orders/{id}
  PATCH /orders/{id}/status
  GET /orders (customer's orders)
  GET /orders (vendor's orders)
  DELETE /orders/{id} (cancel)

Dependencies:
  - PostgreSQL (orders, order_items)
  - Redis (real-time order status)
  - Payment Service (payment processing)
  - Delivery Service (driver assignment)
  - Message Queue (order notifications)

Deployment:
  - Cloud Run (auto-scaling)
  - Horizontal: 3-10 instances
```

#### Service 4: Payment Service
**Responsibility:** Payment processing and settlement

```
Endpoints:
  POST /payments/initiate
  POST /payments/confirm
  GET /payments/{id}
  POST /payments/{id}/refund
  POST /payments/reconcile (admin)

Dependencies:
  - PostgreSQL (payments, transactions)
  - Ozow API
  - Yoco API
  - Peach Payments API
  - Redis (idempotency keys)

Deployment:
  - Cloud Run (auto-scaling, 2+ instances for redundancy)
```

#### Service 5: Delivery Service
**Responsibility:** Driver assignment, tracking, logistics

```
Endpoints:
  POST /deliveries/{id}/assign-driver
  PATCH /deliveries/{id}/status
  GET /deliveries/{id}/tracking
  POST /deliveries/{id}/proof
  GET /drivers/available

Dependencies:
  - PostgreSQL (deliveries, drivers)
  - Redis (driver location cache, real-time tracking)
  - Google Maps API (routing, ETA)
  - Message Queue (driver notifications)
  - PostGIS (geospatial driver matching)

Deployment:
  - Cloud Run (auto-scaling)
  - Horizontal: 3-8 instances
```

#### Service 6: User Service
**Responsibility:** User profiles, preferences, loyalty

```
Endpoints:
  GET /users/{id}
  PATCH /users/{id}
  POST /users/{id}/addresses
  GET /users/{id}/loyalty-points

Dependencies:
  - PostgreSQL (customers, drivers, addresses)
  - Redis (user preferences cache)

Deployment:
  - Cloud Run (auto-scaling)
```

#### Service 7: Notification Service
**Responsibility:** All notifications (push, SMS, email, in-app)

```
Endpoints:
  POST /notifications/send
  GET /notifications (for user)
  PATCH /notifications/{id}/read

Dependencies:
  - PostgreSQL (notifications table)
  - Firebase Cloud Messaging (push)
  - Twilio (SMS)
  - SendGrid (email)
  - Message Queue (consume events)
  - Redis (notification deduplication)

Deployment:
  - Cloud Run (stateless, 2-4 instances)
```

#### Service 8: Analytics Service
**Responsibility:** Analytics aggregation and reporting

```
Endpoints:
  GET /analytics/dashboard (admin)
  GET /analytics/vendor/{id} (vendor)
  POST /analytics/events (event tracking)
  GET /analytics/reports

Dependencies:
  - PostgreSQL (read replicas for queries)
  - Redis (caching aggregated data)
  - BigQuery (optional, for data warehouse)
  - Message Queue (consume events)

Deployment:
  - Cloud Run (batch processing)
  - Scheduled jobs every 1 hour
```

#### Service 9: Admin Service
**Responsibility:** Platform administration and fraud detection

```
Endpoints:
  POST /admin/vendors/approve
  POST /admin/vendors/suspend
  POST /admin/drivers/approve
  POST /admin/fraud/flag
  GET /admin/dashboard

Dependencies:
  - PostgreSQL (all data)
  - Redis (real-time metrics)
  - Message Queue (audit events)

Deployment:
  - Cloud Run (restricted access)
  - Horizontal: 1-2 instances
```

---

## 3. API GATEWAY PATTERN

### Gateway Responsibilities

```
┌─────────────────────────────────────────────┐
│        API GATEWAY (Kong or Nginx)          │
├─────────────────────────────────────────────┤
│                                             │
│  1. AUTHENTICATION & AUTHORIZATION          │
│     • Verify JWT token                      │
│     • Check user permissions                │
│     • Rate limiting per user                │
│                                             │
│  2. REQUEST ROUTING                         │
│     • Route /auth/* → Auth Service          │
│     • Route /vendors/* → Vendor Service     │
│     • Route /orders/* → Order Service       │
│     • Route /payments/* → Payment Service   │
│     • Route /deliveries/* → Delivery Svc    │
│     • Route /users/* → User Service         │
│     • Route /notifications/* → Notif Svc    │
│     • Route /admin/* → Admin Service        │
│                                             │
│  3. REQUEST TRANSFORMATION                  │
│     • Add user context (user_id, role)      │
│     • Add request ID (tracing)              │
│     • Add timestamp                         │
│     • Validate input schemas                │
│                                             │
│  4. RESPONSE CACHING                        │
│     • Cache GET /vendors (1 hour)           │
│     • Cache GET /vendors/{id} (30 min)      │
│     • Cache GET /menus (15 min)             │
│     • No caching for POST/PATCH/DELETE      │
│                                             │
│  5. RATE LIMITING                           │
│     • 100 req/min per authenticated user    │
│     • 10 req/min per unauthenticated IP     │
│     • 1000 req/min per service internal     │
│                                             │
│  6. ERROR HANDLING & RESPONSE FORMATTING    │
│     • Standardized error responses          │
│     • HTTP status codes                     │
│     • Error logging                         │
│                                             │
└─────────────────────────────────────────────┘
```

### Request Flow Example

```
1. Client sends: POST /orders (with JWT in header)
   ↓
2. Gateway validates JWT
   ↓
3. Gateway extracts user_id, role
   ↓
4. Gateway validates request body schema
   ↓
5. Gateway adds request-id for tracing
   ↓
6. Gateway routes to Order Service
   ↓
7. Order Service processes, returns response
   ↓
8. Gateway formats response
   ↓
9. Gateway returns to client
```

---

## 4. EVENT BUS & MESSAGE QUEUE

### Architecture: RabbitMQ

```
┌──────────────────────────────────────────┐
│         EVENT-DRIVEN FLOW                │
├──────────────────────────────────────────┤
│                                          │
│  PRODUCER EVENTS:                        │
│  ├─ order.created                        │
│  ├─ order.accepted                       │
│  ├─ order.ready_for_pickup               │
│  ├─ order.picked_up                      │
│  ├─ order.delivered                      │
│  ├─ payment.completed                    │
│  ├─ delivery.assigned                    │
│  ├─ driver.rating_changed                │
│  ├─ vendor.suspended                     │
│  └─ ...                                  │
│                                          │
│  MESSAGE QUEUE (RabbitMQ):               │
│  ├─ notifications.queue                  │
│  ├─ analytics.queue                      │
│  ├─ payouts.queue                        │
│  ├─ fraud_detection.queue                │
│  └─ email.queue                          │
│                                          │
│  CONSUMER SERVICES:                      │
│  ├─ Notification Service (send push)     │
│  ├─ Analytics Service (aggregate data)   │
│  ├─ Finance Service (prepare payouts)    │
│  ├─ Fraud Detection Service              │
│  └─ Email Service (send emails)          │
│                                          │
└──────────────────────────────────────────┘
```

### Example Event Flow: Order Delivery

```
1. Driver marks order as "delivered" (PATCH /deliveries/{id}/status)
   ↓
2. Delivery Service validates and updates DB
   ↓
3. Delivery Service emits: order.delivered event
   {
     order_id: "uuid",
     driver_id: "uuid",
     customer_id: "uuid",
     amount: 150,
     timestamp: "2026-06-25T12:30:00Z"
   }
   ↓
4. Event published to RabbitMQ (fanout exchange)
   ↓
5. Multiple consumers react:
   ├─ Notification Service → sends push to customer
   ├─ Notification Service → sends push to vendor
   ├─ Finance Service → creates payout for driver (60%)
   ├─ Finance Service → records commission for platform (40%)
   ├─ Analytics Service → increments delivery count
   ├─ Fraud Detection Service → analyzes pattern
   └─ Email Service → sends receipt email
   ↓
6. All happen asynchronously (in parallel)
   ↓
7. Order marked complete, notifications sent, financials recorded
```

### Advantages of Event-Driven

- **Decoupling:** Services don't need to know about each other
- **Scalability:** Add new consumers without changing producers
- **Reliability:** Retry logic built-in (dead letter queues)
- **Audit Trail:** Every event is logged

---

## 5. DATABASE LAYER

### PostgreSQL Configuration

```sql
-- Primary instance (writes)
-- - Multi-AZ deployment
-- - Daily automated backups
-- - Point-in-time recovery
-- - Monitoring: CPU < 70%, Memory < 80%

-- Read replicas (for analytics, reporting)
-- - 2 read replicas in different zones
-- - Replication lag < 1 second

-- Connection pooling
-- - PgBouncer: 200 connections max
-- - Connection timeout: 30 seconds
```

### PostGIS Configuration

```sql
-- Enable PostGIS extension
CREATE EXTENSION postgis;

-- Spatial indexes for fast location queries
CREATE INDEX idx_vendors_geom ON vendors USING GIST (geolocation);
CREATE INDEX idx_addresses_geom ON addresses USING GIST (geolocation);
CREATE INDEX idx_deliveries_geom ON deliveries USING GIST (delivery_geolocation);

-- Query: Find vendors within 5km of customer
SELECT * FROM vendors 
WHERE ST_DWithin(geolocation, ST_Point(long, lat)::geography, 5000)
ORDER BY ST_Distance(geolocation, ST_Point(long, lat)::geography);
```

---

## 6. CACHING STRATEGY

### Redis Configuration

```
┌─────────────────────────────────────────┐
│         CACHE LAYERS                    │
├─────────────────────────────────────────┤
│                                         │
│  L1: Browser Cache (HTTP headers)       │
│     - Static assets: 1 year             │
│     - HTML: 1 hour                      │
│                                         │
│  L2: CDN Cache (Google Cloud CDN)       │
│     - Images: 24 hours                  │
│     - API responses: 1 minute           │
│                                         │
│  L3: Redis Cache (Application)          │
│     - Vendor list: 1 hour               │
│     - Single vendor: 30 min             │
│     - Menu items: 15 min                │
│     - Driver locations: 10 seconds      │
│     - Real-time order status: 5 sec     │
│     - Session tokens: 7 days            │
│                                         │
│  L4: Database (Source of Truth)         │
│     - Master (writes)                   │
│     - Read replicas (reads)             │
│                                         │
└─────────────────────────────────────────┘
```

### Cache Keys & TTL

```
vendors:list:{city} → 3600s (1 hour)
vendors:{vendor_id} → 1800s (30 min)
vendors:{vendor_id}:menus → 900s (15 min)
orders:{order_id} → 300s (5 min, real-time)
orders:{order_id}:driver → 60s (1 min, real-time)
drivers:online → 30s (30 sec, very dynamic)
driver:{driver_id}:location → 10s (10 sec, live tracking)
user:{user_id}:session → 604800s (7 days)
```

### Cache Invalidation Strategy

```
When vendor menu updates:
  1. DELETE vendors:{vendor_id}:menus
  2. DELETE vendors:list:{city}
  3. Message queue event: vendor.menu.updated
     → Notify all customers following vendor

When order status updates:
  1. DELETE orders:{order_id}
  2. DELETE orders:{order_id}:driver
  3. Publish real-time via WebSocket
  4. Redis push to order tracking channel
```

---

## 7. STORAGE ARCHITECTURE

### Google Cloud Storage

```
kasieats-prod/
├── users/
│   ├── {user_id}/
│   │   ├── id_document.jpg
│   │   ├── profile_photo.jpg
│   │   └── ...
│
├── vendors/
│   ├── {vendor_id}/
│   │   ├── logo.png
│   │   ├── banner.jpg
│   │   └── photos/
│   │       ├── {menu_item_id}_1.jpg
│   │       ├── {menu_item_id}_2.jpg
│   │       └── ...
│
├── drivers/
│   ├── {driver_id}/
│   │   ├── license.jpg
│   │   ├── id_document.jpg
│   │   ├── vehicle_registration.jpg
│   │   └── insurance.jpg
│
└── deliveries/
    ├── {delivery_id}/
    │   ├── proof_of_delivery.jpg
    │   └── signature.png
```

### Storage Tiers

```
- Active files (images used in app): Standard tier
- Backups (cold storage): Nearline tier (30+ days old)
- Archives (compliance): Coldline tier (1+ year old)

Retention:
  - Delete images after 5 years (POPIA compliance)
  - Backup retention: 7 years (tax)
```

---

## 8. REAL-TIME COMMUNICATION

### WebSocket Architecture

```
┌─────────────────────────────────────────┐
│      SOCKET.IO SERVER (Node.js)         │
├─────────────────────────────────────────┤
│                                         │
│  Rooms:                                 │
│  ├─ order:{order_id}                    │
│  │   └─ Customers, vendors, drivers     │
│  │      see real-time order updates     │
│  │                                      │
│  ├─ driver:{driver_id}:location         │
│  │   └─ GPS updates every 5 seconds     │
│  │                                      │
│  ├─ vendor:{vendor_id}:orders           │
│  │   └─ New orders in real-time         │
│  │                                      │
│  ├─ admin:live:dashboard                │
│  │   └─ Live metrics & alerts           │
│  │                                      │
│  └─ support:{ticket_id}                 │
│      └─ Real-time chat                  │
│                                         │
└─────────────────────────────────────────┘
```

### Example: Real-Time Order Tracking

```
1. Customer opens order tracking screen
2. Client connects to WebSocket
3. Client emits: socket.emit('join_order', {order_id: 'xyz'})
4. Server joins client to room: 'order:xyz'
5. Driver updates location: driver.location = {lat, lng}
6. Server broadcasts to room: 
   {
     type: 'driver_location_update',
     driver: {name, rating, vehicle},
     location: {lat, lng},
     eta_seconds: 300
   }
7. Client receives, updates map in real-time
8. Customer sees driver moving on map
```

---

## 9. SECURITY MODEL

### Authentication Flow

```
┌─────────────────────────────────────────┐
│    AUTHENTICATION & AUTHORIZATION       │
├─────────────────────────────────────────┤
│                                         │
│  1. USER REGISTRATION                   │
│     Phone number → OTP sent via Twilio  │
│     OTP verified → Account created      │
│     Password/PIN set                    │
│                                         │
│  2. LOGIN                               │
│     Phone + Password → Verified         │
│     → JWT token issued (7 days)         │
│     → Refresh token issued (30 days)    │
│                                         │
│  3. JWT STRUCTURE                       │
│     Header: {alg: HS256}                │
│     Payload: {                          │
│       user_id: "uuid",                  │
│       email: "user@example.com",        │
│       user_type: "customer",            │
│       role: "user",                     │
│       iat: 1234567890,                  │
│       exp: 1234654290                   │
│     }                                   │
│     Signature: HMAC-SHA256(secret)      │
│                                         │
│  4. TOKEN STORAGE (SECURE)              │
│     Mobile: HTTP-only secure cookies    │
│     Web: HTTP-only secure cookies       │
│     Never in localStorage               │
│                                         │
│  5. API AUTHENTICATION                  │
│     Every request: Authorization header │
│     Authorization: Bearer {jwt}         │
│     Gateway verifies signature          │
│     → Valid → Request processed         │
│     → Invalid → 401 Unauthorized        │
��                                         │
│  6. AUTHORIZATION (RBAC)                │
│     Admin endpoints → user_type=admin   │
│     Vendor endpoints → user_type=vendor │
│     Driver endpoints → user_type=driver │
│     Customer endpoints → default        │
│                                         │
└─────────────────────────────────────────┘
```

### Encryption

```
At Rest (Database):
  - Sensitive fields encrypted with AES-256
  - Fields: phone, email, bank_account, id_number
  - Key stored in Google Cloud KMS

In Transit (HTTPS):
  - TLS 1.3 minimum
  - All endpoints HTTPS only
  - Certificate: Let's Encrypt (auto-renew)

Passwords:
  - Bcrypt with cost factor 12
  - Never sent in plain text
  - Reset via secure link (1-hour expiry)
```

### API Security

```
Headers Required:
  - Content-Type: application/json
  - Authorization: Bearer {jwt}
  - X-Request-ID: {uuid} (for tracing)

Headers Validated:
  - X-Forwarded-For (trusted proxies only)
  - User-Agent (blocked if suspicious)

Input Validation:
  - All inputs sanitized (XSS prevention)
  - SQL injection prevention (parameterized queries)
  - Rate limiting (see API Gateway)

CORS:
  - Allowed origins: *.kasieats.co.za
  - Allowed methods: GET, POST, PATCH, DELETE
  - Credentials: included
```

---

## 10. MONITORING & OBSERVABILITY

### Logging Stack (ELK)

```
┌─────────────────────────────────────────┐
│      ELK STACK (ElasticSearch)          │
├─────────────────────────────────────────┤
│                                         │
│  ELASTICSEARCH                          │
│  └─ Index per day: logs-2026-06-25      │
│     └─ Retention: 90 days               │
│     └─ Shards: 3, Replicas: 1           │
│                                         │
│  LOGSTASH                               │
│  └─ Parse and enrich logs               │
│     └─ Extract user_id, order_id        │
│     └─ Add geographic data              │
│     └─ Add performance metrics          │
│                                         │
│  KIBANA                                 │
│  └─ Dashboards and alerts               │
│     └─ Error rate > 1% → alert          │
│     └─ Response time p95 > 500ms → alert│
│     └─ Database slow queries → alert    │
│                                         │
└─────────────────────────────────────────┘
```

### Metrics Stack (Prometheus + Grafana)

```
Metrics Collected:
  - API request latency (histogram)
  - Request count (counter)
  - Error count (counter)
  - Database query duration (histogram)
  - Cache hit rate (gauge)
  - Active WebSocket connections (gauge)
  - Order processing time (histogram)
  - Payment success rate (gauge)
  - Driver location updates/sec (counter)

Grafana Dashboards:
  - System Health (CPU, Memory, Disk)
  - API Performance (latency, throughput, errors)
  - Business Metrics (orders, revenue, users)
  - Database Performance (queries, connections)
  - Payment Processing (success rate, latency)
```

### Alerting Rules

```
Critical Alerts (page on-call):
  - API error rate > 5%
  - API response time p95 > 1000ms
  - Database down / unreachable
  - Payment service down
  - Deployment failure

Warning Alerts (email):
  - API error rate > 1%
  - API response time p95 > 500ms
  - Cache hit rate < 50%
  - Disk usage > 80%
  - Memory usage > 85%
```

---

## 11. DEPLOYMENT ARCHITECTURE

### Environments

```
┌─────────────────────────────────────────┐
│       DEPLOYMENT PIPELINE               │
├─────────────────────────────────────────┤
│                                         │
│  DEVELOPMENT (Local)                    │
│  └─ Docker Compose                      │
│     └─ LocalStack for AWS simulation    │
│     └─ All services + Postgres + Redis  │
│                                         │
│  STAGING (GCP Project: kasieats-staging)│
│  └─ Full production stack               │
│  └─ Test data only                      │
│  └─ Deployment: Every commit to main    │
│                                         │
│  PRODUCTION (GCP Project: kasieats-prod)│
│  └─ Full production stack               │
│  └─ Real data                           │
│  └─ Deployment: Manual (tagged release) │
│  └─ Blue-green deployment               │
│                                         │
└─────────────────────────────────────────┘
```

### Google Cloud Architecture

```
┌─────────────────────────────────────────┐
│        GOOGLE CLOUD PLATFORM            │
├─────────────────────────────────────────┤
│                                         │
│  FRONTEND                               │
│  └─ Cloud Storage (static assets)       │
│  └─ Cloud CDN (image caching)           │
│  └─ Cloud Armor (DDoS protection)       │
│                                         │
│  API LAYER                              │
│  └─ Cloud Run (container orchestration) │
│     ├─ Auth Service (2-4 instances)     │
│     ├─ Order Service (3-10 instances)   │
│     ├─ Payment Service (2-4 instances)  │
│     ├─ Delivery Service (3-8 instances) │
│     └─ ... (all services)               │
│                                         │
│  DATA LAYER                             │
│  └─ Cloud SQL (PostgreSQL)              │
│     ├─ Primary instance (us-central)    │
│     ├─ Read replica (us-east)           │
│     └─ Backup: daily, 7-year retention  │
│                                         │
│  CACHE LAYER                            │
│  └─ Memorystore (Redis)                 │
│     └─ High availability (multi-zone)   │
│                                         │
│  MESSAGE QUEUE                          │
│  └─ Cloud Pub/Sub (RabbitMQ alternative)│
│     └─ Topics: order, payment, delivery │
│     └─ Subscriptions: notification svc  │
│                                         │
│  STORAGE                                │
│  └─ Cloud Storage buckets               │
│     ├─ kasieats-prod-users              │
│     ├─ kasieats-prod-vendors            │
│     └─ kasieats-prod-deliveries         │
│                                         │
│  MONITORING                             │
│  └─ Cloud Logging (ELK alternative)     │
│  └─ Cloud Monitoring (Prometheus alt)   │
│  └─ Cloud Trace (distributed tracing)   │
│                                         │
│  SECURITY                               │
│  └─ Cloud KMS (key management)          │
│  └─ Secret Manager (secrets)            │
│  └─ Cloud Armor (DDoS)                  │
│                                         │
│  NETWORKING                             │
│  └─ Cloud Load Balancer (reverse proxy) │
│  └─ VPC with private subnets            │
│  └─ Cloud Interconnect (optional)       │
│                                         │
└─────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌─────────────────────────────────────────┐
│       GITHUB ACTIONS PIPELINE           │
├─────────────────────────────────────────┤
│                                         │
│  ON: git push to main                   │
│                                         │
│  1. LINT & FORMAT CHECK                 │
│     eslint, prettier, typescript check  │
│     → Fails if issues found             │
│                                         │
│  2. UNIT TESTS                          │
│     Jest, 80%+ coverage required        │
│     → Fails if coverage drops           │
│                                         │
│  3. INTEGRATION TESTS                   │
│     Docker Compose + test data          │
│     → Full system test                  │
│                                         │
│  4. BUILD DOCKER IMAGES                 │
│     Multi-stage build for size          │
│     Tag: main-{commit_sha}              │
│                                         │
│  5. PUSH TO CONTAINER REGISTRY          │
│     Google Cloud Artifact Registry      │
│                                         │
│  6. DEPLOY TO STAGING                   │
│     Update Cloud Run services           │
│     Run smoke tests                     │
│                                         │
│  7. MANUAL APPROVAL FOR PRODUCTION      │
│     Require 2 approvals                 │
│     Changes must be tagged release      │
│                                         │
│  8. DEPLOY TO PRODUCTION (Blue-Green)   │
│     Deploy to new instances             │
│     Health checks pass                  │
│     Switch traffic (gradual, 10% → 100%)│
│     Keep old version running 1 hour     │
│     → Ready to rollback if needed       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 12. DISASTER RECOVERY

### Backup Strategy

```
Database Backups:
  - Automated daily snapshots (Google Cloud)
  - Retention: 7 years (tax compliance)
  - Point-in-time recovery available
  - Test restore monthly

Application Backups:
  - Git repository (GitHub)
  - Code is source of truth
  - All history available

Secrets/Credentials:
  - Stored in Cloud Secret Manager
  - Versioned and rotated automatically
  - Never in code repository
```

### Disaster Scenarios & Recovery

```
Scenario 1: Database corruption
  → Restore from last known good backup
  → Minimal data loss (< 24 hours)
  → RTO: 1 hour, RPO: 24 hours

Scenario 2: Service outage (Order Service)
  → Alert fires, team paged
  → Instant fallback to previous version
  → Investigate root cause
  → RTO: 2 minutes, RPO: 0 (stateless)

Scenario 3: Payment service integration failure
  → Queue orders, retry with exponential backoff
  → Notify admins
  → Manual intervention if needed
  → RTO: TBD, RPO: 0 (eventual consistency)

Scenario 4: Cybersecurity incident (data breach)
  → Isolate affected systems
  → Notify affected users (POPIA requirement)
  → Audit logs to understand scope
  → Restore from clean backup
  → Enhanced monitoring post-recovery
```

### Runbooks (On-Call)

```
If API Response Time p95 > 1000ms:
  1. Check Cloud Monitoring dashboard
  2. Check database CPU/connections
  3. Check cache hit rate
  4. Restart bottleneck service
  5. If persists, activate incident response

If Payment Service Fails:
  1. Check payment gateway status
  2. Check network connectivity
  3. Check credential validity
  4. Queue orders locally
  5. Notify customers of temporary delay
  6. Manual intervention if needed

If Customer Can't Login:
  1. Check Auth Service logs
  2. Check database connectivity
  3. Check Firebase Auth status
  4. Restart Auth Service
  5. Monitor success rate recovery
```

---

## CONCLUSION

This Architecture Blueprint establishes:
✅ Microservices decomposition
✅ API Gateway pattern
✅ Event-driven async processing
✅ Caching strategy
✅ Real-time WebSocket communication
✅ Security model (JWT, encryption)
✅ Monitoring & observability
✅ Deployment on Google Cloud
✅ Disaster recovery procedures

**Next Phase (Phase B):** Product Requirements Document with every screen design.

---

*Version 1.0 – June 25, 2026*  
*Production-Ready, Ready for Implementation*
