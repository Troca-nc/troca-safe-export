'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { processStripeWebhookEvent } = require('../services/paymentWebhookService');

function refundEvent() {
  return {
    id: 'evt_refund_boost',
    type: 'charge.refunded',
    data: { object: {
      id: 'ch_refund', payment_intent: 'pi_refund', amount_refunded: 500,
      currency: 'eur', paid: true, captured: true,
    } },
  };
}

function harness({ failOn } = {}) {
  const trace = [];
  const globalQuery = async (sql) => {
    trace.push(`GLOBAL ${sql.replace(/\s+/g, ' ').trim()}`);
    if (sql.includes('FROM webhook_events')) return { rows: [] };
    if (sql.includes('FROM payments')) return { rows: [{ id: 7, type: 'boost' }] };
    throw new Error(`Unexpected global SQL: ${sql}`);
  };
  const client = { query: async (sql) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    trace.push(`TX ${normalized}`);
    if (failOn && normalized.includes(failOn)) throw new Error('synthetic transaction failure');
    if (normalized.startsWith('INSERT INTO webhook_events')) return { rows: [{ id: 1 }] };
    if (normalized.includes('FROM payments') && normalized.includes('FOR UPDATE')) {
      return { rows: [{ id: 7, user_id: 9, status: 'succeeded', metadata: { payment_type: 'boost', annonce_id: 12, amount_xpf: 490 } }] };
    }
    return { rows: [], rowCount: 1 };
  } };
  const withTransaction = async (operation) => {
    trace.push('BEGIN');
    try {
      const value = await operation(client);
      trace.push('COMMIT');
      return value;
    } catch (error) {
      trace.push('ROLLBACK');
      throw error;
    }
  };
  return { trace, globalQuery, withTransaction };
}

async function run(h) {
  return processStripeWebhookEvent({
    event: refundEvent(), query: h.globalQuery, withTransaction: h.withTransaction,
    stripe: {}, sendMail: async () => {}, sendBoostActivatedEmail: async () => {},
    getWebPlan: () => null, markPaymentSucceeded: async () => {},
    formatXpfEur: () => '', XPF_PER_EUR: 119.33, baseUrl: '',
  });
}

describe('Stripe non-campaign refund atomicity', () => {
  it('écrit reçu, remboursement, document et révocation dans une seule transaction', async () => {
    const h = harness();
    await run(h);
    const tx = h.trace.filter((entry) => entry.startsWith('TX '));
    assert.ok(tx[0].includes('INSERT INTO webhook_events'));
    assert.ok(tx.some((entry) => entry.includes("UPDATE payments SET status = 'refunded'")));
    assert.ok(tx.some((entry) => entry.includes('billing_documents')));
    assert.ok(tx.some((entry) => entry.includes('UPDATE annonces')));
    assert.ok(tx.some((entry) => entry.includes('DELETE FROM annonce_boosts')));
    assert.deepStrictEqual(h.trace.slice(-1), ['COMMIT']);
    assert.ok(!h.trace.some((entry) => entry.startsWith('GLOBAL INSERT INTO webhook_events')));
  });

  it('annule le reçu si une mutation durable échoue', async () => {
    const h = harness({ failOn: "UPDATE payments SET status = 'refunded'" });
    await assert.rejects(run(h), /synthetic transaction failure/);
    assert.ok(h.trace.some((entry) => entry.includes('INSERT INTO webhook_events')));
    assert.deepStrictEqual(h.trace.slice(-1), ['ROLLBACK']);
  });
});
