'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('production TLS configuration', () => {
  it('refuse un choix TLS implicite dans le compose et l entrypoint Nginx', () => {
    const compose = read('docker-compose.prod.yml');
    const entrypoint = read('docker/nginx/entrypoint.sh');

    assert.match(compose, /NGINX_SSL_ENABLED: "\$\{NGINX_SSL_ENABLED:\?/);
    assert.doesNotMatch(compose, /NGINX_SSL_ENABLED:-false/);
    assert.match(entrypoint, /\$\{NGINX_SSL_ENABLED:\?/);
    assert.match(entrypoint, /true\|false/);
    assert.doesNotMatch(entrypoint, /NGINX_SSL_ENABLED="\$\{NGINX_SSL_ENABLED:-false\}"/);
  });

  it('exige TLS actif pendant le preflight de production', () => {
    const preflight = read('scripts/preflight.sh');
    const example = read('.env.production.example');

    assert.match(preflight, /production_required_vars=\([\s\S]*NGINX_SSL_ENABLED/);
    assert.match(preflight, /NGINX_SSL_ENABLED:-\}" != "true"/);
    assert.match(example, /^NGINX_SSL_ENABLED=true$/m);
  });

  it('partage une allowlist admin explicite entre HTTP et HTTPS', () => {
    const compose = read('docker-compose.prod.yml');
    const entrypoint = read('docker/nginx/entrypoint.sh');
    const adminSite = read('nginx/sites/admin.kalico.nc.conf');
    const preflight = read('scripts/preflight.sh');

    assert.match(compose, /ADMIN_ALLOWLIST: "\$\{ADMIN_ALLOWLIST:\?/);
    assert.match(entrypoint, /\$\{ADMIN_ALLOWLIST:\?/);
    assert.strictEqual((adminSite.match(/include \/tmp\/nginx-rendered\/admin-allowlist\.inc;/g) || []).length, 2);
    assert.doesNotMatch(adminSite, /203\.0\.113\./);
    assert.match(preflight, /production_required_vars=\([\s\S]*ADMIN_ALLOWLIST/);
  });
});
