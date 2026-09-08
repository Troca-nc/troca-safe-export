'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');
const { normalizeRidet, bindVerifiedCompanyIdentity } = require('../services/companyIdentityService');

describe('Company identity', () => {
  it('normalise le format RIDET calédonien sur dix chiffres', () => {
    assert.strictEqual(normalizeRidet('1 234 567.890'), '1234567890');
    assert.strictEqual(normalizeRidet('1234567.890'), '1234567890');
    assert.strictEqual(normalizeRidet('123456789'), null);
    assert.strictEqual(normalizeRidet('12345678901'), null);
  });

  it('crée une identité au niveau du RID et rattache le responsable', async () => {
    const calls = [];
    const client = { query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('FROM company_members cm')) return { rows: [] };
      if (sql.includes('INSERT INTO companies')) return { rows: [{ id: 4, rid: '1234567', ridet: '1234567890' }] };
      if (sql.includes('INSERT INTO company_members')) return { rows: [{ company_id: 4 }] };
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
    const company = await bindVerifiedCompanyIdentity(client, {
      userId: 9,
      ridet: '1234567.890',
      legalName: 'Atelier du Lagon',
    });
    assert.strictEqual(company.rid, '1234567');
    assert.deepStrictEqual(calls[1].params, ['1234567', '1234567890', 'Atelier du Lagon']);
    assert.ok(calls[2].sql.includes("'owner'"));
  });

  it('refuse de déplacer un compte vers un autre RID vérifié', async () => {
    const client = { query: async () => ({ rows: [{ id: 4, rid: '7654321' }] }) };
    await assert.rejects(
      bindVerifiedCompanyIdentity(client, { userId: 9, ridet: '1234567890', legalName: 'Atelier' }),
      (error) => error.status === 409,
    );
  });

  it('lie la création à la validation administrative du justificatif RIDET', () => {
    const adminRoute = fs.readFileSync(path.join(__dirname, '..', 'routes', 'admin.routes.js'), 'utf8');
    const init = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'database', 'init.sql'), 'utf8');
    assert.ok(adminRoute.includes("doc.document_type === 'extrait_ridet'"));
    assert.ok(adminRoute.includes('bindVerifiedCompanyIdentity(client'));
    assert.ok(init.includes('20260909_companies_and_members.sql'));
  });
});
