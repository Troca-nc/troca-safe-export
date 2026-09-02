'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');
const { getTrustedClientIp } = require('../../utils/clientIp');

describe('trusted client IP policy', () => {
  it('utilise req.ip et ignore un X-Forwarded-For forgé', () => {
    const req = {
      ip: '203.0.113.42',
      headers: { 'x-forwarded-for': '198.51.100.9, 203.0.113.42' },
    };

    assert.strictEqual(getTrustedClientIp(req), '203.0.113.42');
  });

  it('reste fail-closed sans adresse résolue par Express', () => {
    const req = { headers: { 'x-forwarded-for': '198.51.100.9' } };

    assert.strictEqual(getTrustedClientIp(req), 'unknown');
  });

  it('conserve la chaîne de confiance Express et Nginx attendue', () => {
    const root = path.resolve(__dirname, '../../../../');
    const appSource = fs.readFileSync(path.join(root, 'backend/src/index.js'), 'utf8');
    const nginxSource = fs.readFileSync(path.join(root, 'nginx/sites/kalico.nc.conf'), 'utf8');
    const rateLimitSource = fs.readFileSync(path.join(root, 'backend/src/middleware/rateLimit.js'), 'utf8');
    const adminLimitSource = fs.readFileSync(path.join(root, 'backend/src/middleware/adminApiToken.js'), 'utf8');

    assert.ok(appSource.includes("app.set('trust proxy', 1)"));
    assert.ok(nginxSource.includes('$proxy_add_x_forwarded_for'));
    assert.ok(!rateLimitSource.toLowerCase().includes('x-forwarded-for'));
    assert.ok(!adminLimitSource.toLowerCase().includes('x-forwarded-for'));
  });
});
