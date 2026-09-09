ARG ADMIN_NODE_IMAGE=node:22-alpine
FROM ${ADMIN_NODE_IMAGE} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
RUN corepack enable
RUN corepack prepare pnpm@11.1.1 --activate
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY .npmrc ./
# TODO: restore --frozen-lockfile once the lockfile is stabilized after the pnpm v11 migration
RUN pnpm install --frozen-lockfile --no-optional

FROM ${ADMIN_NODE_IMAGE} AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
RUN corepack prepare pnpm@11.1.1 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM ${ADMIN_NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache curl
RUN corepack enable
RUN corepack prepare pnpm@11.1.1 --activate
RUN addgroup -g 1001 -S nodejs && adduser -S adminuser -u 1001 -G nodejs
COPY --from=builder --chown=adminuser:nodejs /app/public ./public
COPY --from=builder --chown=adminuser:nodejs /app/.next ./.next
COPY --from=builder --chown=adminuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=adminuser:nodejs /app/scripts ./scripts
COPY --from=builder --chown=adminuser:nodejs /app/node_modules ./node_modules
USER adminuser
EXPOSE 3002
CMD ["./node_modules/.bin/next", "start", "-p", "3002"]
