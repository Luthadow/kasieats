# KasiEats

Township food delivery platform connecting customers, vendors, and drivers across South Africa.

## Services

| Service | URL | Description |
|---|---|---|
| API | http://localhost:3000 | NestJS REST API |
| API Docs | http://localhost:3000/api/docs | Swagger UI |
| Vendor Web | http://localhost:3001 | Vendor dashboard (React/Vite) |
| Admin Web | http://localhost:3002 | Admin dashboard (React/Vite) |
| RabbitMQ | http://localhost:15672 | Message broker UI |

## Quick Start (local dev)

### Prerequisites

- Node.js 20+
- Yarn 1.22
- Docker & Docker Compose

### Setup

```bash
bash scripts/dev-up.sh
```

This script:
1. Copies `.env.example` to `apps/api/.env.local` if not present
2. Starts postgres, redis, rabbitmq via Docker
3. Runs `yarn install`
4. Builds shared packages and generates the Prisma client
5. Runs database migrations
6. Seeds the database

Then start the API in watch mode:

```bash
yarn workspace @kasieats/api dev
```

Or run all services with turbo:

```bash
yarn dev
```

### Seed credentials

| Role | Login | Password / OTP |
|---|---|---|
| Admin | `admin@kasieats.co.za` | `Admin123!` |
| Vendor | `+27831234567` | `Vendor123!` |
| Driver | `+27851234567` | `Driver123!` |
| Customer | `+27761234567` | OTP `123456` (dev) |

Dev OTP for any phone is always `123456` when `NODE_ENV !== production`.

## Full Stack with Docker Compose

Build and run all services (API + frontends + infra):

```bash
docker compose up --build
```

Production mode (no exposed infra ports, restart:always):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Useful commands

```bash
yarn docker:up        # docker compose up -d (all services)
yarn docker:down      # docker compose down
yarn dev:infra        # start only postgres/redis/rabbitmq
yarn smoke            # run smoke tests against localhost
```

## Architecture

```
kasieats/
├── apps/
│   ├── api/            # NestJS backend — REST API on :3000
│   ├── vendor-web/     # React/Vite vendor dashboard — :3001
│   ├── admin-web/      # React/Vite admin dashboard  — :3002
│   ├── customer-app/   # Expo customer mobile app
│   └── driver-app/     # Expo driver mobile app
├── packages/
│   ├── shared/         # Shared TypeScript types and utilities
│   └── db/             # Prisma schema, migrations, seed script
├── scripts/
│   ├── dev-up.sh       # Local dev bootstrap
│   └── smoke-test.sh   # Basic API smoke tests
└── docker-compose.yml  # Full stack compose
```

**Tech stack:** NestJS · Prisma · PostgreSQL (PostGIS) · Redis · RabbitMQ · React · Vite · Expo · Docker

## Environment Variables

Copy `.env.example` to `.env.local` (root) or `apps/api/.env.local` and update values.

Key variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | postgres://… | PostgreSQL connection string |
| `REDIS_URL` | redis://… | Redis connection string |
| `JWT_SECRET` | — | **Must change in production** |
| `SMS_PROVIDER` | `console` | `console` (dev) or `twilio` |
| `PAYMENT_MODE` | `sandbox` | `sandbox`, `payfast`, or `yoco` |
| `CORS_ORIGIN` | localhost:3001,3002 | Comma-separated allowed origins |

## Database

```bash
yarn db:generate          # regenerate Prisma client after schema changes
yarn db:migrate           # create + apply a new migration (dev)
yarn db:migrate:deploy    # apply pending migrations (CI/prod)
yarn db:seed              # seed with demo data
```

## CI

GitHub Actions runs on every push/PR to `main`:
- Build `@kasieats/shared` and `@kasieats/db`
- Lint + build + test the API
- Build vendor-web and admin-web

See `.github/workflows/ci.yml`.

## Deployment

The `deploy-staging.yml` workflow builds Docker images and echoes deploy steps targeting GCP Cloud Run. Configure these secrets in GitHub Settings → Secrets → Actions to activate:

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `STAGING_API_URL`
- `STAGING_DATABASE_URL`
- `STAGING_JWT_SECRET`
