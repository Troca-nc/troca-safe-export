# ============================================================
#  Dockerfile — Frontend Next.js (Production)
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# Dépendances
FROM base AS deps
COPY package.json ./
RUN npm ci && npm cache clean --force

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Variables NEXT_PUBLIC_ doivent être disponibles au moment du build
# Injectées via --build-arg dans le pipeline CI/CD
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PK
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
ARG NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
ARG NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY
ARG NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PK=$NEXT_PUBLIC_STRIPE_PK
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=$NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
ENV NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=$NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
ENV NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY=$NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY
ENV NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY=$NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY
ENV NEXT_STANDALONE=1

RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public        ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
