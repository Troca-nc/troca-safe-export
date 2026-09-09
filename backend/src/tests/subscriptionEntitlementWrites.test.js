'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

describe('Subscription entitlement writes', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'payment.route.js'), 'utf8');

  it('aligne la période d essai et l échéance utilisateur dans une transaction', () => {
    const start = source.indexOf("router.post('/subscribe/mobile'");
    const end = source.indexOf("router.post('/cancel'", start);
    const block = source.slice(start, end);
    assert.match(block, /const trialEnd =/);
    assert.match(block, /await withTransaction\(async \(client\)/);
    assert.match(block, /current_period_end, cancel_at_period_end/);
    assert.match(block, /pro_expires_at = \$3/);
  });

  it('synchronise mises à jour annulations et renouvellements Stripe transactionnellement', () => {
    for (const eventType of ['customer.subscription.updated', 'customer.subscription.deleted', 'invoice.payment_succeeded']) {
      const start = source.indexOf(`event.type === '${eventType}'`);
      const next = source.indexOf("if (event.type === '", start + 20);
      assert.match(source.slice(start, next), /withTransaction\(async \(client\)/, eventType);
    }
  });

  it('annule ensemble abonnement PayPlug et droit utilisateur', () => {
    const start = source.indexOf('if (isCancelled && userId)');
    const block = source.slice(start, source.indexOf('logger.info', start));
    assert.match(block, /withTransaction\(async \(client\)/);
    assert.match(block, /RETURNING user_id/);
  });
});
