'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const root = path.resolve(__dirname, '..', '..', '..');
const route = fs.readFileSync(path.join(root, 'backend/src/routes/pro.quotes.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'database/migrations/20261007_pro_quote_workspace.sql'), 'utf8');

describe('Pro quote workspace contract', () => {
  it('expose la configuration et les modèles avant la route dynamique', () => {
    const configIndex = route.indexOf("router.get('/config'");
    const templatesIndex = route.indexOf("router.get('/templates'");
    const dynamicIndex = route.indexOf("router.get('/:id'");
    assert.ok(configIndex > 0 && configIndex < dynamicIndex);
    assert.ok(templatesIndex > 0 && templatesIndex < dynamicIndex);
    assert.ok(route.includes("router.post('/templates'"));
    assert.ok(route.includes("router.put('/templates/:templateId'"));
    assert.ok(route.includes("router.delete('/templates/:templateId'"));
  });

  it('borne les relances et conditionne atomiquement les transitions', () => {
    assert.ok(route.includes("router.post('/:id/remind'"));
    assert.ok(route.includes("last_reminded_at <= NOW() - INTERVAL '24 hours'"));
    assert.ok(route.includes("status = ANY($4::text[])"));
    assert.ok(route.includes("router.post('/:id/mark-paid'"));
    assert.ok(route.includes("status = ANY($5::text[])"));
    assert.ok(route.includes("payment_source: 'pro_declared'"));
    assert.ok(route.includes("WHERE id = $2 AND pro_id = $3 AND status = 'accepted'"));
  });

  it('versionne les données financières et la table des modèles', () => {
    for (const fragment of [
      'CREATE TABLE IF NOT EXISTS pro_quote_templates',
      'tgc_breakdown JSONB',
      'deposit_percent NUMERIC(5,2)',
      'balance_due_xpf INTEGER',
      'last_reminded_at TIMESTAMPTZ',
      'paid_declared_by_user_id INTEGER',
      "'paid'",
    ]) assert.ok(migration.includes(fragment), `migration incomplète : ${fragment}`);
  });
});
