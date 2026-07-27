FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
# TODO: rétablir --frozen-lockfile une fois le lockfile
# stabilisé après migration pnpm v11
RUN PNPM_IGNORE_IGNORED_BUILD_DEPS=sharp pnpm install --no-frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache curl
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3002
CMD ["npm", "start"]
