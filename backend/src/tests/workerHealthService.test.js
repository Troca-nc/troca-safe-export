'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { createWorkerHealthService } = require('../services/workerHealthService');

describe('worker health service', () => {
  it('reports liveness only after fresh database and Redis probes', async () => {
    let now = Date.parse('2026-09-10T00:00:00Z');
    let databaseHealthy = true;
    const health = createWorkerHealthService({
      checkDatabase: async () => { if (!databaseHealthy) throw new Error('database unavailable'); },
      checkRedis: async () => {},
      clock: () => now,
      intervalMs: 60_000,
      staleAfterMs: 45_000,
    });

    const address = await health.start(0);
    try {
      let response = await fetch(`http://127.0.0.1:${address.port}/health`);
      assert.strictEqual(response.status, 200);

      databaseHealthy = false;
      await health.probe();
      response = await fetch(`http://127.0.0.1:${address.port}/health`);
      assert.strictEqual(response.status, 503);

      databaseHealthy = true;
      await health.probe();
      now += 45_001;
      response = await fetch(`http://127.0.0.1:${address.port}/health`);
      assert.strictEqual(response.status, 503);
    } finally {
      await health.stop();
    }
  });

  it('replaces the process-only Compose probe with the worker endpoint', () => {
    const fs = require('fs');
    const path = require('path');
    const compose = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'docker-compose.prod.yml'), 'utf8');
    const workerBlock = compose.match(/\n  worker:[\s\S]*?\n  frontend:/)?.[0] || '';
    assert.match(workerBlock, /127\.0\.0\.1:3002\/health/);
    assert.doesNotMatch(workerBlock, /pgrep/);
  });
});
