FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm install --global npm@10.9.4 --no-audit --no-fund \
    && npm ci --omit=dev --no-audit --no-fund \
    && node -e "require.resolve('pg')" \
    && npm cache clean --force

COPY backend/ ./

RUN mkdir -p /app/uploads \
    && chown -R node:node /app

USER node

CMD ["node", "src/index.js"]
