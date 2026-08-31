'use strict';

const assert = require('assert');
const { EVENT_PUBLICATION_OFFER, quoteEventPublication } = require('../services/eventPublicationRules');

function run() {
  let count = 0;
  const day = 86400000;
  const now = Date.UTC(2026, 8, 1);
  const base = { now_ms: now, visibility_starts_at_ms: now, event_ends_at_ms: now + 40 * day, photo_count: 6 };
  function check(label, fn) { fn(); count++; console.log(`  OK ${label}`); }
  function rejects(patch, field) {
    assert.throws(() => quoteEventPublication({ ...base, ...patch }),
      (error) => error.code === 'INVALID_EVENT_PUBLICATION' && error.field === field);
  }

  check('fixed XPF publication price and thirty day cap', () => {
    const result = quoteEventPublication(base);
    assert.strictEqual(result.amount_xpf, 490);
    assert.strictEqual(result.currency, 'XPF');
    assert.strictEqual(result.visibility_ends_at_ms, now + 30 * day);
    assert.strictEqual(result.ends_before_event_end, true);
    assert.strictEqual(result.automatic_renewal, false);
  });
  check('event end shortens visibility without silently discounting price', () => {
    const result = quoteEventPublication({ ...base, event_ends_at_ms: now + day });
    assert.strictEqual(result.visibility_ends_at_ms, now + day);
    assert.strictEqual(result.ends_before_event_end, false);
    assert.strictEqual(result.amount_xpf, 490);
  });
  check('scheduled start anchors duration rather than quote time', () => {
    const result = quoteEventPublication({ ...base, visibility_starts_at_ms: now + 5 * day });
    assert.strictEqual(result.visibility_ends_at_ms, now + 35 * day);
  });
  check('exact thirty day event end is not flagged as truncated', () => {
    assert.strictEqual(quoteEventPublication({ ...base, event_ends_at_ms: now + 30 * day }).ends_before_event_end, false);
  });
  check('free admission and client price do not waive the publication fee', () => {
    const result = quoteEventPublication({ ...base, is_free: true, amount_xpf: 0, currency: 'EUR', max_visibility_days: 365 });
    assert.strictEqual(result.amount_xpf, 490);
    assert.strictEqual(result.currency, 'XPF');
    assert.strictEqual(result.max_visibility_days, 30);
    assert.strictEqual(Object.hasOwn(result, 'is_free'), false);
  });
  check('quote is immutable, deterministic, leaves input unchanged', () => {
    const input = Object.freeze({ ...base });
    const result = quoteEventPublication(input);
    assert.deepStrictEqual(result, quoteEventPublication(input));
    assert.ok(Object.isFrozen(result));
    assert.ok(Object.isFrozen(EVENT_PUBLICATION_OFFER));
    assert.deepStrictEqual(input, base);
  });
  for (const value of [-1, 7, 1.5, '6', null, undefined, NaN]) {
    check(`invalid photo count ${String(value)}`, () => rejects({ photo_count: value }, 'photo_count'));
  }
  check('zero photos supported without inventing a minimum', () => {
    assert.strictEqual(quoteEventPublication({ ...base, photo_count: 0 }).amount_xpf, 490);
  });
  for (const field of ['now_ms', 'visibility_starts_at_ms', 'event_ends_at_ms']) {
    for (const value of [undefined, null, NaN, Infinity, 1.5, '2026-09-01', 8640000000000001]) {
      check(`reject invalid ${field}: ${String(value)}`, () => rejects({ [field]: value }, field));
    }
  }
  check('past publication start rejected', () => rejects({ visibility_starts_at_ms: now - 1 }, 'visibility_starts_at_ms'));
  check('event ending at publication start rejected', () => rejects({ event_ends_at_ms: now }, 'event_ends_at_ms'));
  check('event ending before publication start rejected', () => rejects({ event_ends_at_ms: now - 1 }, 'event_ends_at_ms'));
  for (const value of [null, undefined, [], 'event']) {
    check(`invalid input ${String(value)}`, () => {
      assert.throws(() => quoteEventPublication(value), (error) => error.field === 'input');
    });
  }
  check('upper Date boundary does not overflow the result', () => {
    const end = 8640000000000000;
    const result = quoteEventPublication({ ...base, now_ms: end - day, visibility_starts_at_ms: end - day, event_ends_at_ms: end });
    assert.strictEqual(result.visibility_ends_at_ms, end);
  });
  console.log(`Event publication rules: ${count} checks passed.`);
}

run();
