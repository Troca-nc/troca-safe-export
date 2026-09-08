'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

describe('Public listing state boundary', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'routes', 'annonces.js'), 'utf8');
  const detailStart = source.indexOf("router.get('/:id', optionalAuth");
  const detailEnd = source.indexOf('// ── POST /api/listings', detailStart);
  const detail = source.slice(detailStart, detailEnd);

  it("limite le détail public aux annonces actives", () => {
    assert.ok(detailStart >= 0 && detailEnd > detailStart);
    assert.match(detail, /a\.status = 'active'/);
    assert.match(detail, /a\.deleted_at IS NULL/);
  });

  it('préserve la consultation de gestion pour le propriétaire et un admin', () => {
    assert.match(detail, /a\.user_id = \$2/);
    assert.match(detail, /\$3::boolean = TRUE/);
    assert.ok(detail.includes('[id, req.user?.id ?? null, Boolean(req.user?.is_admin)]'));
  });
});
