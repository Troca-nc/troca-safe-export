'use strict';

const { getRedisClient, isRedisRequired, redisUnavailable } = require('../config/redis');

const localCache = new Map();
const localLocks = new Map();

function now() {
  return Date.now();
}

function readLocalEntry(store, key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function writeLocalEntry(store, key, value, ttlMs) {
  store.set(key, { value, expiresAt: now() + ttlMs });
}

function deleteLocalPrefix(prefix) {
  for (const key of localCache.keys()) {
    if (key === prefix || key.startsWith(prefix)) localCache.delete(key);
  }
}

async function getJson(key) {
  const client = await getRedisClient();
  if (!client) {
    if (isRedisRequired()) throw redisUnavailable();
    const local = readLocalEntry(localCache, key);
    return local;
  }

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const ttl = await client.pTTL(key);
    if (ttl > 0) writeLocalEntry(localCache, key, parsed, ttl);
    return parsed;
  } catch (error) {
    if (isRedisRequired()) throw redisUnavailable(error);
    return null;
  }
}

async function setJson(key, value, ttlMs = 60_000) {
  const client = await getRedisClient();
  if (!client) {
    if (isRedisRequired()) throw redisUnavailable();
    writeLocalEntry(localCache, key, value, ttlMs);
    return value;
  }

  try {
    await client.set(key, JSON.stringify(value), { PX: ttlMs });
  } catch (error) {
    if (isRedisRequired()) throw redisUnavailable(error);
  }
  return value;
}

async function deletePrefix(prefix) {
  deleteLocalPrefix(prefix);

  const client = await getRedisClient();
  if (!client) {
    if (isRedisRequired()) throw redisUnavailable();
    return;
  }

  try {
    const keys = [];
    for await (const key of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length) await client.del(keys);
  } catch (error) {
    if (isRedisRequired()) throw redisUnavailable(error);
  }
}

async function acquireLock(name, ttlMs) {
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client = await getRedisClient();

  if (!client) {
    if (isRedisRequired()) throw redisUnavailable();
    const existing = localLocks.get(name);
    if (existing && existing.expiresAt > now()) return null;
    localLocks.set(name, { token, expiresAt: now() + ttlMs });
    return token;
  }

  try {
    const ok = await client.set(name, token, { NX: true, PX: ttlMs });
    return ok ? token : null;
  } catch (error) {
    if (isRedisRequired()) throw redisUnavailable(error);
    return null;
  }
}

async function releaseLock(name, token) {
  const client = await getRedisClient();

  if (!client) {
    if (isRedisRequired()) throw redisUnavailable();
    const existing = localLocks.get(name);
    if (existing?.token === token) localLocks.delete(name);
    return;
  }

  try {
    const current = await client.get(name);
    if (current === token) await client.del(name);
  } catch (error) {
    if (isRedisRequired()) throw redisUnavailable(error);
  }
}

async function withLock(name, ttlMs, fn) {
  const token = await acquireLock(name, ttlMs);
  if (!token) return null;

  try {
    return await fn();
  } finally {
    await releaseLock(name, token);
  }
}

module.exports = {
  acquireLock,
  deletePrefix,
  getJson,
  releaseLock,
  setJson,
  withLock,
};
