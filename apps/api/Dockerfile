# ─── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install curl for healthcheck and build tools for native modules
RUN apk add --no-cache curl openssl

# Copy manifests in dependency order (maximise layer cache hits)
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/api/package.json ./apps/api/package.json

# Stub the other workspaces so yarn doesn't error on missing dirs
RUN mkdir -p apps/vendor-web apps/admin-web apps/customer-app && \
    echo '{"name":"@kasieats/vendor-web","version":"0.1.0","private":true}' > apps/vendor-web/package.json && \
    echo '{"name":"@kasieats/admin-web","version":"0.1.0","private":true}' > apps/admin-web/package.json && \
    echo '{"name":"@kasieats/customer-app","version":"0.1.0","private":true}' > apps/customer-app/package.json

# prisma generate in postinstall needs DATABASE_URL to be present (even a dummy value)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN yarn install --frozen-lockfile --prefer-offline

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Copy all source
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api
COPY tsconfig.json ./tsconfig.json

# Build dependency chain: shared → db → api
RUN yarn workspace @kasieats/shared build
RUN yarn workspace @kasieats/db db:generate
RUN yarn workspace @kasieats/db build
RUN yarn workspace @kasieats/api build

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache curl openssl

ENV NODE_ENV=production

# Copy installed node_modules and built output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json

# Regenerate prisma client in prod stage against the real schema
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    node_modules/.bin/prisma generate --schema=packages/db/prisma/schema.prisma

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main"]
