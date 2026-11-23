'use strict';

const crypto = require('crypto');

const RETENTION_MS = 60 * 60 * 1000;
const KEYS = {
  total: 'observability:http:window:total',
  serverErrors: 'observability:http:window:5xx',
  rateLimited: 'observability:http:window:429',
};

function normalizeTimestamp(value) {
  const timestamp = value instanceof Date ? value.getTime() : Number(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function requestMember({ requestId, timestamp }) {
  return `${timestamp}:${requestId || crypto.randomUUID()}:${crypto.randomUUID()}`;
}

async function recordApiRequestWindow(client, { statusCode, requestId, timestamp = Date.now() }) {
  if (!client) return false;

  const observedAt = normalizeTimestamp(timestamp);
  const member = requestMember({ requestId, timestamp: observedAt });
  const cutoff = observedAt - RETENTION_MS;
  const status = Number(statusCode);
  const multi = client.multi();

  multi.zAdd(KEYS.total, { score: observedAt, value: member });
  if (status >= 500 && status <= 599) {
    multi.zAdd(KEYS.serverErrors, { score: observedAt, value: member });
  }
  if (status === 429) {
    multi.zAdd(KEYS.rateLimited, { score: observedAt, value: member });
  }

  for (const key of Object.values(KEYS)) {
    multi.zRemRangeByScore(key, 0, cutoff);
    multi.expire(key, Math.ceil(RETENTION_MS / 1000));
  }

  await multi.exec();
  return true;
}

async function readApiRequestWindow(client, { windowMinutes = 15, now = Date.now() } = {}) {
  if (!client) {
    return { totalRequests: 0, serverErrors: 0, rateLimited: 0, errorRate: 0 };
  }

  const end = normalizeTimestamp(now);
  const start = end - Math.max(1, Number(windowMinutes) || 15) * 60 * 1000;
  const [totalRequests, serverErrors, rateLimited] = await Promise.all([
    client.zCount(KEYS.total, start, end),
    client.zCount(KEYS.serverErrors, start, end),
    client.zCount(KEYS.rateLimited, start, end),
  ]);
  const total = Number(totalRequests) || 0;
  const errors = Number(serverErrors) || 0;

  return {
    totalRequests: total,
    serverErrors: errors,
    rateLimited: Number(rateLimited) || 0,
    errorRate: total > 0 ? errors / total : 0,
  };
}

module.exports = {
  KEYS,
  readApiRequestWindow,
  recordApiRequestWindow,
};
