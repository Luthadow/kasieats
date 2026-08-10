FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/

RUN yarn install --frozen-lockfile --ignore-scripts

COPY packages ./packages
COPY apps/api ./apps/api

RUN yarn workspace @kasieats/db db:generate
RUN yarn workspace @kasieats/shared build
RUN yarn workspace @kasieats/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
