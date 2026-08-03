# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy manifests for all workspaces first (layer cache)
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/vendor-web/package.json ./apps/vendor-web/package.json

# Stub unused workspaces
RUN mkdir -p apps/api apps/admin-web apps/customer-app && \
    echo '{"name":"@kasieats/api","version":"0.1.0","private":true}' > apps/api/package.json && \
    echo '{"name":"@kasieats/admin-web","version":"0.1.0","private":true}' > apps/admin-web/package.json && \
    echo '{"name":"@kasieats/customer-app","version":"0.1.0","private":true}' > apps/customer-app/package.json

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN yarn install --frozen-lockfile --prefer-offline

# Copy source
COPY packages/shared ./packages/shared
COPY apps/vendor-web ./apps/vendor-web
COPY tsconfig.json ./tsconfig.json

# Build shared then vendor-web
RUN yarn workspace @kasieats/shared build
RUN yarn workspace @kasieats/vendor-web build

# ─── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/apps/vendor-web/dist /usr/share/nginx/html
COPY apps/vendor-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O- http://localhost/healthz || exit 1
