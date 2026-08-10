#!/usr/bin/env bash
set -euo pipefail

# Idempotent local DB bootstrap (Postgres via Docker or system service).
export DATABASE_URL="${DATABASE_URL:-postgresql://kasieats_user:kasieats_password@localhost:5432/kasieats}"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker compose up -d postgres redis rabbitmq 2>/dev/null || true
fi

if command -v pg_isready >/dev/null 2>&1; then
  for _ in $(seq 1 30); do
    pg_isready -h localhost -p 5432 -U kasieats_user -d kasieats >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! pg_isready -h localhost -p 5432 -U kasieats_user -d kasieats >/dev/null 2>&1; then
  sudo service postgresql start 2>/dev/null || true
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='kasieats_user'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER kasieats_user WITH PASSWORD 'kasieats_password' SUPERUSER;"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='kasieats'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE kasieats OWNER kasieats_user;"
fi

yarn workspace @kasieats/db db:migrate:deploy
yarn workspace @kasieats/db db:seed
