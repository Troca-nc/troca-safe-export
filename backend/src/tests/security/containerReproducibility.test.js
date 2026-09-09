'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('production container reproducibility', () => {
  it('requires immutable digests for every production image input', () => {
    const compose = read('docker-compose.prod.yml');
    const preflight = read('scripts/preflight.sh');
    for (const name of [
      'BACKEND_IMAGE', 'FRONTEND_IMAGE', 'NGINX_IMAGE', 'CERTBOT_IMAGE',
      'POSTGRES_IMAGE', 'REDIS_IMAGE', 'ALPINE_IMAGE', 'ADMIN_NODE_IMAGE',
    ]) {
      assert.ok(compose.includes(name), `${name} absent du Compose`);
      assert.match(preflight, new RegExp(`${name}[\\s\\S]*@sha256`));
    }
    assert.doesNotMatch(compose, /^\s*image:\s+[^$].*:[\w.-]+\s*$/m);
  });

  it('installs the locked Admin graph and runs its image as non-root', () => {
    const dockerfile = read('admin/Dockerfile');
    assert.match(dockerfile, /COPY pnpm-lock\.yaml/);
    assert.match(dockerfile, /pnpm install --frozen-lockfile/);
    assert.doesNotMatch(dockerfile, /--no-frozen-lockfile/);
    assert.match(dockerfile, /adduser -S adminuser/);
    assert.match(dockerfile, /USER adminuser/);
    assert.match(dockerfile, /COPY --from=builder --chown=adminuser:nodejs/);
  });
});
