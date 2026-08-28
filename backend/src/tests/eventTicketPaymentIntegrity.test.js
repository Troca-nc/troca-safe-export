'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { isValidEventTicketCheckout } = require('../services/paymentWebhookService');

const payment = {
  user_id: 7,
  amount_xpf: 3600,
  metadata: {
    payment_type: 'event_ticket',
    event_id: '12',
    order_id: '34',
    amount_xpf: '3600',
    amount_eur_cents: '3017',
  },
};

const session = {
  payment_status: 'paid',
  currency: 'eur',
  amount_total: 3017,
  metadata: {
    payment_type: 'event_ticket',
    event_id: '12',
    order_id: '34',
    amount_xpf: '3600',
    amount_eur_cents: '3017',
  },
};

describe('Event ticket payment integrity', () => {
  it('accepte uniquement une session payee dont montant, devise et commande concordent', () => {
    assert.strictEqual(isValidEventTicketCheckout(session, payment), true);
    assert.strictEqual(isValidEventTicketCheckout({ ...session, payment_status: 'unpaid' }, payment), false);
    assert.strictEqual(isValidEventTicketCheckout({ ...session, currency: 'usd' }, payment), false);
    assert.strictEqual(isValidEventTicketCheckout({ ...session, amount_total: 1 }, payment), false);
    assert.strictEqual(isValidEventTicketCheckout({ ...session, metadata: { ...session.metadata, order_id: '35' } }, payment), false);
  });

  it('ne conserve aucune route HTTP de finalisation declarative', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'events.route.js'), 'utf8');
    assert.doesNotMatch(source, /webhooks\/stripe\/finalize/);
    assert.doesNotMatch(source, /provider_ref requis/);
  });

  it('cree les billets payants reserves et ne les retourne pas avant paiement', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'eventTicketingService.js'), 'utf8');
    assert.match(source, /FALSE, 'reserved'/);
    assert.match(source, /tickets: \[\]/);
    assert.doesNotMatch(source, /capture_method:\s*'manual'/);
  });
});
