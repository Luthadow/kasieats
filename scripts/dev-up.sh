#!/usr/bin/env bash
# scripts/dev-up.sh — Bring up infrastructure and prepare local dev environment
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[dev-up]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev-up]${NC} $*"; }

# ── 1. Copy .env if not present ──────────────────────────────────────────────
if [ ! -f .env.local ] && [ ! -f apps/api/.env.local ]; then
  info "Copying .env.example → apps/api/.env.local"
  cp apps/api/.env.example apps/api/.env.local
fi

# ── 2. Start infrastructure containers ──────────────────────────────────────
info "Starting postgres, redis, rabbitmq…"
docker compose up -d postgres redis rabbitmq

# ── 3. Wait for postgres to be healthy ───────────────────────────────────────
info "Waiting for postgres to be healthy…"
max_retries=30
count=0
until docker compose exec -T postgres pg_isready -U kasieats_user -d kasieats -q 2>/dev/null; do
  count=$((count + 1))
  if [ "$count" -ge "$max_retries" ]; then
    echo "ERROR: postgres did not become healthy after ${max_retries} retries" >&2
    exit 1
  fi
  printf '.'
  sleep 2
done
echo ""
info "Postgres is ready."

# ── 4. Wait for redis ─────────────────────────────────────────────────────────
info "Waiting for redis…"
count=0
until docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
  count=$((count + 1))
  if [ "$count" -ge 15 ]; then
    echo "ERROR: redis did not respond" >&2
    exit 1
  fi
  sleep 1
done
info "Redis is ready."

# ── 5. Install dependencies ──────────────────────────────────────────────────
info "Installing dependencies (yarn install)…"
yarn install

# ── 6. Build shared packages ─────────────────────────────────────────────────
info "Building @kasieats/shared…"
yarn workspace @kasieats/shared build

# ── 7. Generate Prisma client + run migrations ───────────────────────────────
info "Generating Prisma client…"
export DATABASE_URL="postgresql://kasieats_user:kasieats_password@localhost:5432/kasieats"
yarn workspace @kasieats/db db:generate

info "Running database migrations…"
yarn workspace @kasieats/db db:migrate:deploy

# ── 8. Seed database ─────────────────────────────────────────────────────────
info "Seeding database…"
yarn workspace @kasieats/db db:seed

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  KasiEats dev environment is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Next steps:"
echo "    yarn dev              # start all services (turbo)"
echo "    yarn workspace @kasieats/api dev   # API only (port 3000)"
echo "    yarn workspace @kasieats/vendor-web dev  # vendor UI (port 3001)"
echo ""
echo "  Seed credentials (OTP: 123456 in dev):"
echo "    Admin   : admin@kasieats.co.za"
echo "    Vendor  : vendor@kasieats.co.za"
echo "    Driver  : driver@kasieats.co.za"
echo "    Customer: customer@kasieats.co.za"
echo ""
echo "  Infra:"
echo "    API:               http://localhost:3000"
echo "    API docs:          http://localhost:3000/api/docs"
echo "    Vendor web:        http://localhost:3001"
echo "    Admin web:         http://localhost:3002"
echo "    RabbitMQ mgmt:     http://localhost:15672  (kasieats_user / kasieats_password)"
echo "    PostgreSQL:        localhost:5432           (kasieats_user / kasieats_password)"
echo ""
