'use strict';

const http = require('http');
const { getRedisClient } = require('../config/redis');

function createWorkerHealthService({
  checkDatabase,
  checkRedis = async () => {
    const redis = await getRedisClient();
    if (!redis) throw new Error('Redis unavailable');
    await redis.ping();
  },
  clock = () => Date.now(),
  intervalMs = 15_000,
  staleAfterMs = 45_000,
} = {}) {
  if (typeof checkDatabase !== 'function') throw new TypeError('checkDatabase is required');

  let lastHealthyAt = 0;
  let lastError = null;
  let probing = null;
  let timer = null;
  let server = null;

  async function probe() {
    if (probing) return probing;
    probing = Promise.all([checkDatabase(), checkRedis()])
      .then(() => {
        lastHealthyAt = clock();
        lastError = null;
        return true;
      })
      .catch((error) => {
        lastError = error?.code || error?.message || 'dependency_check_failed';
        return false;
      })
      .finally(() => { probing = null; });
    return probing;
  }

  function snapshot() {
    const ageMs = lastHealthyAt ? clock() - lastHealthyAt : null;
    return {
      healthy: ageMs !== null && ageMs <= staleAfterMs && !lastError,
      last_healthy_at: lastHealthyAt ? new Date(lastHealthyAt).toISOString() : null,
      dependency_age_ms: ageMs,
      error: lastError,
    };
  }

  async function start(port = Number(process.env.WORKER_HEALTH_PORT || 3002)) {
    await probe();
    server = http.createServer((req, res) => {
      if (req.url !== '/health') {
        res.writeHead(404).end();
        return;
      }
      const state = snapshot();
      res.writeHead(state.healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    timer = setInterval(() => { void probe(); }, intervalMs);
    if (timer.unref) timer.unref();
    return server.address();
  }

  async function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (!server) return;
    const activeServer = server;
    server = null;
    await new Promise((resolve) => activeServer.close(resolve));
  }

  return { probe, snapshot, start, stop };
}

module.exports = { createWorkerHealthService };
