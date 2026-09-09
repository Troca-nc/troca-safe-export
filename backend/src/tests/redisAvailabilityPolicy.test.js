'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { describe, it } = require('./helpers');
const { isRedisRequired } = require('../config/redis');

const root = path.resolve(__dirname, '..', '..', '..');

function load(relativePath, redisPolicy) {
  const filename = path.join(__dirname, '..', relativePath);
  const sandbox = {
    module: { exports: {} },
    require(name) {
      if (name === '../config/redis') return redisPolicy;
      throw new Error(`Unexpected dependency: ${name}`);
    },
    Map,
    Date,
    Math,
    JSON,
    process: { pid: 42 },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}

describe('Redis availability policy', () => {
  it('requires Redis by default in production and permits explicit local development', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousRequired = process.env.REDIS_REQUIRED;
    try {
      delete process.env.REDIS_REQUIRED;
      process.env.NODE_ENV = 'production';
      assert.strictEqual(isRedisRequired(), true);
      process.env.NODE_ENV = 'test';
      assert.strictEqual(isRedisRequired(), false);
      process.env.REDIS_REQUIRED = 'true';
      assert.strictEqual(isRedisRequired(), true);
    } finally {
      if (previousNodeEnv == null) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
      if (previousRequired == null) delete process.env.REDIS_REQUIRED; else process.env.REDIS_REQUIRED = previousRequired;
    }
  });

  it('requires the fail-closed profile in production configuration', () => {
    const compose = fs.readFileSync(path.join(root, 'docker-compose.prod.yml'), 'utf8');
    const preflight = fs.readFileSync(path.join(root, 'scripts/preflight.sh'), 'utf8');
    assert.match(compose, /REDIS_REQUIRED: "\$\{REDIS_REQUIRED:\?/);
    assert.match(preflight, /REDIS_REQUIRED:-\}" != "true"/);
  });

  it('fails rate limiting and distributed locks closed when required Redis is absent', async () => {
    const unavailable = (cause) => Object.assign(new Error('Redis is required but unavailable'), {
      code: 'REDIS_REQUIRED_UNAVAILABLE', cause,
    });
    const policy = {
      getRedisClient: async () => null,
      isRedisRequired: () => true,
      redisUnavailable: unavailable,
    };
    const rateLimits = load('services/redisRateLimitStore.js', policy);
    const cache = load('services/sharedCache.js', policy);

    await assert.rejects(rateLimits.createRedisRateLimitStore('auth').increment('client'), { code: 'REDIS_REQUIRED_UNAVAILABLE' });
    await assert.rejects(cache.acquireLock('cron:test', 1000), { code: 'REDIS_REQUIRED_UNAVAILABLE' });
  });

  it('keeps the in-process fallback available outside the required profile', async () => {
    const policy = {
      getRedisClient: async () => null,
      isRedisRequired: () => false,
      redisUnavailable: (cause) => cause,
    };
    const rateLimits = load('services/redisRateLimitStore.js', policy);
    const cache = load('services/sharedCache.js', policy);

    assert.strictEqual((await rateLimits.createRedisRateLimitStore('test').increment('client')).totalHits, 1);
    assert.ok(await cache.acquireLock('local:test', 1000));
  });
});
