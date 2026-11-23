'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const {
  KEYS,
  readApiRequestWindow,
  recordApiRequestWindow,
} = require('../services/apiRequestWindow');
const { shouldTriggerApiErrorRateAlert } = require('../services/adminAlerts');

function createRedisHarness() {
  const sets = new Map();
  const entries = (key) => {
    if (!sets.has(key)) sets.set(key, new Map());
    return sets.get(key);
  };
  const redis = {
    multi() {
      const operations = [];
      return {
        zAdd(key, entry) { operations.push(() => entries(key).set(entry.value, entry.score)); return this; },
        zRemRangeByScore(key, minimum, maximum) {
          operations.push(() => {
            for (const [member, score] of entries(key)) {
              if (score >= Number(minimum) && score <= Number(maximum)) entries(key).delete(member);
            }
          });
          return this;
        },
        expire() { return this; },
        async exec() { operations.forEach((operation) => operation()); return []; },
      };
    },
    async zCount(key, minimum, maximum) {
      let count = 0;
      for (const score of entries(key).values()) {
        if (score >= Number(minimum) && score <= Number(maximum)) count += 1;
      }
      return count;
    },
  };
  return { redis, sets };
}

describe('Fenêtre glissante des erreurs API', () => {
  it('calcule les 5xx sur toutes les requêtes et garde les 429 séparées', async () => {
    const { redis } = createRedisHarness();
    const now = Date.parse('2026-11-23T08:30:00.000Z');

    await recordApiRequestWindow(redis, { statusCode: 200, requestId: 'ok', timestamp: now - 60_000 });
    await recordApiRequestWindow(redis, { statusCode: 503, requestId: 'server-error', timestamp: now - 2 * 60_000 });
    await recordApiRequestWindow(redis, { statusCode: 429, requestId: 'limited', timestamp: now - 3 * 60_000 });
    await recordApiRequestWindow(redis, { statusCode: 500, requestId: 'too-old', timestamp: now - 16 * 60_000 });

    const metrics = await readApiRequestWindow(redis, { windowMinutes: 15, now });
    assert.deepStrictEqual(metrics, {
      totalRequests: 3,
      serverErrors: 1,
      rateLimited: 1,
      errorRate: 1 / 3,
    });
  });

  it('respecte le seuil minimal de requêtes avant de déclencher', () => {
    assert.strictEqual(shouldTriggerApiErrorRateAlert(
      { totalRequests: 99, errorRate: 0.5 },
      { minimumRequests: 100, threshold: 0.05 }
    ), false);
    assert.strictEqual(shouldTriggerApiErrorRateAlert(
      { totalRequests: 100, errorRate: 0.06 },
      { minimumRequests: 100, threshold: 0.05 }
    ), true);
  });

  it('utilise trois séries Redis distinctes', () => {
    assert.notStrictEqual(KEYS.total, KEYS.serverErrors);
    assert.notStrictEqual(KEYS.total, KEYS.rateLimited);
    assert.notStrictEqual(KEYS.serverErrors, KEYS.rateLimited);
  });
});
