# ============================================================
#  Dockerfile — Backend Node.js (Production)
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# Dépendances
FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Build
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN mkdir -p /app/uploads && chown -R nodeuser:nodejs /app/uploads

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

USER nodeuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/index.js"]
