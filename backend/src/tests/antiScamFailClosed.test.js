'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { createAntiScam } = require('../services/antiScam');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

describe('Anti-scam fail-closed policy', () => {
  it('refuse la création lorsque le quota anti-fraude est invérifiable', async () => {
    const antiScam = createAntiScam({
      rateLimitCheck: async () => { throw new Error('database unavailable'); },
    });
    const res = responseRecorder();
    let continued = false;

    await antiScam.rateLimitAnnonces({ user: { id: 42 } }, res, () => { continued = true; });

    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(continued, false);
  });

  it('place en attente une annonce dont analyse échoue', async () => {
    const quarantined = [];
    const antiScam = createAntiScam({
      listingCheck: async () => { throw new Error('analysis unavailable'); },
      quarantine: async (id) => { quarantined.push(id); },
    });

    const result = await antiScam.flagIfSuspicious(73);

    assert.deepStrictEqual(quarantined, [73]);
    assert.strictEqual(result.reviewPending, true);
    assert.deepStrictEqual(result.flags, ['anti_scam_unavailable']);
  });

  it('propage l erreur si la mise en attente échoue aussi', async () => {
    const antiScam = createAntiScam({
      listingCheck: async () => { throw new Error('analysis unavailable'); },
      quarantine: async () => { throw new Error('quarantine unavailable'); },
    });

    await assert.rejects(() => antiScam.flagIfSuspicious(73), /quarantine unavailable/);
  });

  it('refuse le contact lorsque la confiance vendeur est invérifiable', async () => {
    const antiScam = createAntiScam({
      sellerQuery: async () => { throw new Error('database unavailable'); },
    });
    const res = responseRecorder();
    let continued = false;

    await antiScam.checkSellerTrust(
      { body: { seller_id: 91 }, params: {} },
      res,
      () => { continued = true; }
    );

    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(continued, false);
  });
});
