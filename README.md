# KasiEats Monorepo

**Building South Africa's largest township food delivery platform.**

## Quick Start

### Prerequisites
- Node.js 18+
- Yarn 3.6+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/Luthadow/kasieats.git
cd kasieats
yarn install

# 2. Start local services
docker-compose up -d

# 3. Setup database
yarn workspace @kasieats/db db:migrate
yarn workspace @kasieats/db db:seed

# 4. Start all services
yarn dev

# 5. Services now running:
# - API: http://localhost:3000
# - Customer App: Expo dev server (Ctrl+J in terminal)
# - Vendor Web: http://localhost:3001
# - Admin Web: http://localhost:3002
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - RabbitMQ Management: http://localhost:15672
```

---

## Project Structure

```
kasieats/
├── apps/
│   ├── api/                    # NestJS backend (the "nervous system")
│   │   ├── src/
│   │   │   ├── auth/           # Authentication service
│   │   │   ├── vendors/        # Vendor service
│   │   │   ├── orders/         # Order service
│   │   │   ├── payments/       # Payment service
│   │   │   ├── deliveries/     # Delivery service
│   │   │   ├── users/          # User service
│   │   │   ├── notifications/  # Notification service
│   │   │   ├── admin/          # Admin service
│   │   │   ├── common/         # Shared utilities
│   │   │   └── main.ts         # Entry point
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── customer-app/           # React Native customer app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── services/       # API client
│   │   │   ├── context/        # State management
│   │   │   └── App.tsx
│   │   ├── app.json            # Expo config
│   │   └── package.json
│   │
│   ├── driver-app/             # React Native driver app
│   │   └── (similar structure to customer-app)
│   │
│   ├── vendor-web/             # React vendor dashboard
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── App.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin-web/              # React admin dashboard
│       └── (similar to vendor-web)
│
├── packages/
│   ├── db/                     # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── scripts/
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   └── shared/                 # TypeScript types & utilities
│       ├── src/
│       │   ├── types/
│       │   ├── utils/
│       │   ├── constants/
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   ├── COMPANY_CONSTITUTION.md
│   ├── DATABASE_BIBLE.md
│   ├── ARCHITECTURE_BLUEPRINT.md
│   └── MASTER_BLUEPRINT.md
│
├── docker-compose.yml          # Local dev environment
├── package.json                # Root workspace config
├── turbo.json                  # Turbo config
├── tsconfig.json               # TypeScript config
├── .eslintrc.json              # ESLint config
├── .prettierrc                 # Prettier config
└── README.md                   # This file
```

---

## Commands

### Development

```bash
# Start all services in parallel
yarn dev

# Start specific service
yarn workspace @kasieats/api dev
yarn workspace @kasieats/customer-app dev
yarn workspace @kasieats/vendor-web dev

# Watch mode for development
yarn build --watch
```

### Testing

```bash
# Run all tests
yarn test

# Run tests for specific workspace
yarn workspace @kasieats/api test

# Run with coverage
yarn test -- --coverage
```

### Linting & Formatting

```bash
# Lint all code
yarn lint

# Format all code
yarn format

# Check formatting without changes
yarn format --check
```

### Database

```bash
# Run migrations
yarn db:migrate

# Seed database with test data
yarn db:seed

# Reset database (careful!)
yarn workspace @kasieats/db db:reset
```

### Building

```bash
# Build all apps
yarn build

# Build specific app
yarn workspace @kasieats/api build
```

---

## Environment Variables

### Local Development

Create `.env.local` files in each app:

**apps/api/.env.local**
```
NODE_ENV=development
DATABASE_URL=postgresql://kasieats_user:kasieats_password@localhost:5432/kasieats
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://kasieats_user:kasieats_password@localhost:5672
JWT_SECRET=your-secret-key-here
PAYSTACK_SECRET_KEY=sk_test_xxx
OZOW_API_KEY=test_api_key
GOOGLE_MAPS_API_KEY=your_maps_key
FIREBASE_PROJECT_ID=kasieats-dev
```

**apps/customer-app/.env**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENVIRONMENT=development
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Mobile** | React Native + Expo | Single codebase iOS/Android |
| **Backend** | NestJS + TypeScript | Production-grade, scalable |
| **Database** | PostgreSQL + PostGIS | Relational + geospatial |
| **Cache** | Redis | Real-time tracking, sessions |
| **Message Queue** | RabbitMQ | Async processing, notifications |
| **Storage** | Google Cloud Storage | Scalable image storage |
| **Payments** | Ozow, Yoco, Peach | South Africa-native providers |
| **Maps** | Google Maps API | Navigation, geolocation |
| **Hosting** | Google Cloud Platform | Auto-scaling, managed services |

---

## API Documentation

Full OpenAPI documentation available at `/api/docs` (when running locally).

**Key Endpoints:**
- `POST /auth/register` – Register new user
- `POST /auth/login` – Login
- `GET /vendors` – Get nearby vendors
- `POST /orders` – Create order
- `GET /orders/{id}` – Track order
- `PATCH /deliveries/{id}/status` – Update delivery status
- `GET /admin/dashboard` – Admin metrics

See `ARCHITECTURE_BLUEPRINT.md` for complete API design.

---

## Development Workflow

1. **Create feature branch**: `git checkout -b feat/your-feature`
2. **Make changes** in relevant app/package
3. **Write tests**: Aim for 80%+ coverage
4. **Run locally**: `yarn dev`
5. **Lint & format**: `yarn lint && yarn format`
6. **Commit**: `git commit -am "feat: describe change"`
7. **Push**: `git push origin feat/your-feature`
8. **Create PR**: Link related issues
9. **CI runs**: Tests, lint, build checks
10. **Merge**: Require 2 approvals on main

---

## Deployment

### Staging (Automatic)
- Every push to `main` triggers deploy to staging
- Test in `kasieats-staging` GCP project
- Accessible at `https://staging.kasieats.co.za`

### Production (Manual)
- Tagged releases only: `git tag v1.0.0`
- Blue-green deployment
- Requires 2 approvals
- Automatic rollback on health check failure
- Production: `https://api.kasieats.co.za`

---

## Monitoring & Observability

- **Logs**: Cloud Logging (ELK stack)
- **Metrics**: Cloud Monitoring + Prometheus
- **Tracing**: Cloud Trace
- **Alerts**: PagerDuty on critical issues

Dashboard: https://console.cloud.google.com/monitoring

---

## Getting Help

1. Check `docs/` folder for detailed guides
2. Check service README.md files
3. Open an issue on GitHub
4. Ask in Slack #kasieats-engineering

---

## Contributing

See CONTRIBUTING.md for detailed guidelines.

---

## License

MIT

---

**Let's build the township economy's super-app. 🚀**

*For the full blueprint and company documentation, see `/docs`*
