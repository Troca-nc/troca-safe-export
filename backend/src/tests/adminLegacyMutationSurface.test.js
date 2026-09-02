'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'admin.routes.js'), 'utf8');

describe('Admin legacy mutation surface', () => {
  it('ne remonte plus la route utilisateur générique contournable', () => {
    assert.strictEqual(source.includes("router.post('/users/:id/:action'"), false);
  });

  it('ne remonte plus les actions groupées incompatibles avec le schéma', () => {
    assert.strictEqual(source.includes("router.post('/annonces/bulk'"), false);
    assert.strictEqual(source.includes("status = 'banned'"), false);
    assert.strictEqual(source.includes("delete_reason = 'admin'"), false);
  });

  it('conserve les mutations utilisateur explicites et validées', () => {
    assert.ok(source.includes("router.patch('/users/:id/suspend'"));
    assert.ok(source.includes("router.patch('/users/:id/unsuspend'"));
    assert.ok(source.includes("router.patch('/users/:id/set-plan'"));
    assert.ok(source.includes("router.delete('/users/:id/force-delete'"));
  });
});
