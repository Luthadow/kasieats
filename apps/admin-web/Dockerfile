# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy manifests for all workspaces first (layer cache)
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/admin-web/package.json ./apps/admin-web/package.json

# Stub unused workspaces
RUN mkdir -p apps/api apps/vendor-web apps/customer-app && \
    echo '{"name":"@kasieats/api","version":"0.1.0","private":true}' > apps/api/package.json && \
    echo '{"name":"@kasieats/vendor-web","version":"0.1.0","private":true}' > apps/vendor-web/package.json && \
    echo '{"name":"@kasieats/customer-app","version":"0.1.0","private":true}' > apps/customer-app/package.json

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN yarn install --frozen-lockfile --prefer-offline

# Copy source
COPY packages/shared ./packages/shared
COPY apps/admin-web ./apps/admin-web
COPY tsconfig.json ./tsconfig.json

# Build shared then admin-web
RUN yarn workspace @kasieats/shared build
RUN yarn workspace @kasieats/admin-web build

# ─── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O- http://localhost/healthz || exit 1
