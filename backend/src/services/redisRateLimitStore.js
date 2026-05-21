'use strict';

const { getRedisClient } = require('../config/redis');

function createLocalStore(prefix) {
  const hits = new Map();
  let windowMs = 15 * 60 * 1000;

  return {
    prefix,
    localKeys: true,
    init(options) {
      windowMs = options?.windowMs || windowMs;
    },
    async increment(key) {
      const prefixed = `${prefix}:${key}`;
      const existing = hits.get(prefixed);
      const now = Date.now();
      if (!existing || existing.resetTime <= now) {
        const resetTime = new Date(now + windowMs);
        hits.set(prefixed, { totalHits: 1, resetTime });
        return { totalHits: 1, resetTime };
      }
      existing.totalHits += 1;
      hits.set(prefixed, existing);
      return { totalHits: existing.totalHits, resetTime: existing.resetTime };
    },
    async decrement(key) {
      const prefixed = `${prefix}:${key}`;
      const existing = hits.get(prefixed);
      if (!existing) return;
      existing.totalHits = Math.max(0, existing.totalHits - 1);
      hits.set(prefixed, existing);
    },
    async resetKey(key) {
      hits.delete(`${prefix}:${key}`);
    },
    async resetAll() {
      hits.clear();
    },
    shutdown() {
      hits.clear();
    },
  };
}

function createRedisRateLimitStore(prefix = 'rate-limit') {
  const localStore = createLocalStore(prefix);
  let windowMs = 15 * 60 * 1000;
  const redisPrefix = `rl:${prefix}:`;

  return {
    prefix: redisPrefix,
    localKeys: false,
    init(options) {
      windowMs = options?.windowMs || windowMs;
      localStore.init(options);
    },
    async increment(key) {
      const client = await getRedisClient();
      if (!client) return localStore.increment(key);

      const redisKey = `${redisPrefix}${key}`;
      try {
        const result = await client.eval(
          `
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
              redis.call('PEXPIRE', KEYS[1], ARGV[1])
            end
            local ttl = redis.call('PTTL', KEYS[1])
            return { current, ttl }
          `,
          { keys: [redisKey], arguments: [String(windowMs)] }
        );

        const totalHits = Number(result?.[0] ?? 1);
        const ttl = Number(result?.[1] ?? windowMs);
        const resetTime = new Date(Date.now() + Math.max(0, ttl));
        return { totalHits, resetTime };
      } catch {
        return localStore.increment(key);
      }
    },
    async decrement(key) {
      const client = await getRedisClient();
      if (!client) return localStore.decrement(key);
      try {
        await client.decr(`${redisPrefix}${key}`);
      } catch {
        await localStore.decrement(key);
      }
    },
    async resetKey(key) {
      const client = await getRedisClient();
      if (!client) return localStore.resetKey(key);
      try {
        await client.del(`${redisPrefix}${key}`);
      } catch {
        await localStore.resetKey(key);
      }
    },
    async resetAll() {
      const client = await getRedisClient();
      if (!client) return localStore.resetAll();
      try {
        const keys = [];
        for await (const key of client.scanIterator({ MATCH: `${redisPrefix}*`, COUNT: 100 })) {
          keys.push(key);
        }
        if (keys.length) await client.del(keys);
      } catch {
        await localStore.resetAll();
      }
    },
    shutdown() {
      localStore.shutdown();
    },
  };
}

module.exports = { createRedisRateLimitStore };
