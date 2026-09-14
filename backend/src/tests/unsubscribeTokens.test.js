'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { describe, it } = require('./helpers');
const tokens = require('../services/unsubscribeTokenService');

// Isolate dependencies without changing the shared runner's require cache.
function service(name, query, email = {}) {
  const filename = path.join(__dirname, '../services', name + '.js');
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, process,
    require: (id) => {
      if (id === '../config/database') return { query };
      if (id === './unsubscribeTokenService') return tokens;
      if (id === './emailService') return email;
      throw new Error('Unexpected dependency: ' + id);
    },
  }, { filename });
  return module.exports;
}

describe('unsubscribe tokens', () => {
  it('generates independent tokens and hashes legacy token formats', () => {
    const a = tokens.generateUnsubscribeToken();
    assert.match(a, /^[a-f0-9]{64}$/);
    assert.notStrictEqual(a, tokens.generateUnsubscribeToken());
    assert.strictEqual(tokens.hashUnsubscribeToken('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.strictEqual(tokens.hashUnsubscribeToken(''), null);
  });

  it('creates all preferences with 18 bound values and hides token hashes', async () => {
    let stored;
    const prefs = service('notificationPreferencesService', async (sql, values) => {
      if (sql.includes('FROM users')) return { rows: [{ id: 1 }] };
      if (sql.includes('INSERT INTO notification_preferences')) {
        assert.strictEqual(values.length, 18);
        assert.strictEqual(Math.max(...Array.from(sql.matchAll(/\$(\d+)/g), m => Number(m[1]))), 18);
        for (const value of values.slice(12)) assert.match(value, /^[a-f0-9]{64}$/);
        assert.strictEqual(new Set(values.slice(12)).size, 6);
        stored = { user_id: 1, new_message_unsubscribe_token: values[12] };
      }
      return { rows: stored ? [stored] : [] };
    });
    const result = await prefs.ensureNotificationPreferences(1);
    assert.strictEqual(result.user_id, 1);
    assert.ok(!Object.keys(result).some(key => key.includes('token')));
  });

  it('issues raw links but stores only hashes for each notification kind', async () => {
    let stored;
    const prefs = service('notificationPreferencesService', async (sql, values) => {
      stored = { sql, values };
      return { rows: [{ user_id: 1 }] };
    });
    for (const kind of ['new_message', 'boost_activated', 'offer_received', 'listing_expiring', 'listing_expired', 'performance_report']) {
      const raw = await prefs.issueNotificationUnsubscribeToken(1, kind);
      assert.ok(stored.sql.includes(kind + '_unsubscribe_token = $2'));
      assert.strictEqual(stored.values[1], tokens.hashUnsubscribeToken(raw));
      assert.notStrictEqual(stored.values[1], raw);
    }
    for (const kind of ['invalid', 'constructor', '__proto__']) {
      assert.strictEqual(await prefs.issueNotificationUnsubscribeToken(1, kind), null);
    }
  });

  it('looks up notification links by digest and rejects unknown links', async () => {
    let lookup;
    const prefs = service('notificationPreferencesService', async (sql, values) => {
      lookup = values[0];
      return { rows: [] };
    });
    assert.strictEqual(await prefs.disableNotificationByToken('legacy-token'), null);
    assert.strictEqual(lookup, tokens.hashUnsubscribeToken('legacy-token'));
  });

  it('sends newsletter raw tokens, accepts their digest lookup, and skips rotation for empty content', async () => {
    let items = [], digest, sent = 0, rotations = 0;
    const newsletter = service('newsletterService', async (sql, values) => {
      if (sql.includes('FROM annonces')) return { rows: items };
      if (sql.includes('SET unsubscribe_token = $2')) {
        digest = values[1]; rotations++;
        return { rows: [{ id: 2 }] };
      }
      if (sql.includes('WHERE unsubscribe_token = $1')) {
        return { rows: values[0] === digest ? [{ enabled: false }] : [] };
      }
      return { rows: [{ id: 2, user_id: 1, categories: [] }] };
    }, { sendNewsletterEmail: async (to, name, payload) => {
      sent++;
      assert.strictEqual(tokens.hashUnsubscribeToken(payload.unsubscribeToken), digest);
      assert.notStrictEqual(payload.unsubscribeToken, digest);
      assert.strictEqual((await newsletter.unsubscribeByToken(payload.unsubscribeToken)).enabled, false);
      assert.strictEqual(await newsletter.unsubscribeByToken(digest), null);
      return { messageId: 'test' };
    } });
    const row = { id: 2, user_id: 1, email: 'test@example.invalid' };
    assert.strictEqual((await newsletter.sendNewsletterToSubscription(row)).skipped, true);
    assert.strictEqual(rotations, 0);
    assert.strictEqual(sent, 0);
    items = [{ id: 3, title: 'Test' }];
    assert.strictEqual((await newsletter.sendNewsletterToSubscription(row)).skipped, false);
    assert.strictEqual(rotations, 1);
    assert.strictEqual(sent, 1);
  });
});
