'use strict';

const { getRedisClient } = require('../config/redis');

const QUEUE_KEY = 'troc:matching:queue';
const pendingLocal = new Set();
const seenLocal = new Map();

function normalizeListingIds(listingIds) {
  const ids = Array.isArray(listingIds) ? listingIds : [listingIds];
  return [...new Set(ids
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0))];
}

function cleanupLocalSeen() {
  const now = Date.now();
  for (const [key, expiresAt] of seenLocal.entries()) {
    if (expiresAt <= now) {
      seenLocal.delete(key);
    }
  }
}

async function enqueueTrocMatching(listingIds) {
  const ids = normalizeListingIds(listingIds);
  if (!ids.length) return 0;

  const client = await getRedisClient();
  if (!client) {
    ids.forEach((id) => pendingLocal.add(id));
    return ids.length;
  }

  try {
    await client.sAdd(QUEUE_KEY, ids.map(String));
    return ids.length;
  } catch {
    ids.forEach((id) => pendingLocal.add(id));
    return ids.length;
  }
}

async function drainTrocMatchingQueue(limit = 25) {
  const client = await getRedisClient();
  if (!client) {
    const ids = [...pendingLocal].slice(0, limit);
    ids.forEach((id) => pendingLocal.delete(id));
    return ids;
  }

  try {
    const popped = await client.sPop(QUEUE_KEY, limit);
    if (!popped) return [];
    return (Array.isArray(popped) ? popped : [popped])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    const ids = [...pendingLocal].slice(0, limit);
    ids.forEach((id) => pendingLocal.delete(id));
    return ids;
  }
}

async function rememberTrocSignal(key, ttlMs = 24 * 60 * 60 * 1000) {
  const client = await getRedisClient();
  if (!client) {
    cleanupLocalSeen();
    if (seenLocal.has(key)) return false;
    seenLocal.set(key, Date.now() + ttlMs);
    return true;
  }

  try {
    const ok = await client.set(key, '1', { NX: true, PX: ttlMs });
    return Boolean(ok);
  } catch {
    cleanupLocalSeen();
    if (seenLocal.has(key)) return false;
    seenLocal.set(key, Date.now() + ttlMs);
    return true;
  }
}

module.exports = {
  QUEUE_KEY,
  drainTrocMatchingQueue,
  enqueueTrocMatching,
  rememberTrocSignal,
};
