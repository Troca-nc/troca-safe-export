'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('service backup completeness', () => {
  it('captures database, uploads, certificates and runtime configuration', () => {
    const compose = read('docker-compose.prod.yml');
    const backup = read('scripts/backup.sh');

    for (const mount of [
      'uploads_data:/source/uploads:ro',
      'certbot_conf:/source/letsencrypt:ro',
      './.env.production.local:/source/config/.env.production.local:ro',
    ]) assert.ok(compose.includes(mount), `missing backup source: ${mount}`);

    for (const asset of ['postgres.sql', 'uploads', 'letsencrypt', '.env.production.local', 'config-template']) {
      assert.ok(backup.includes(asset), `missing archived asset: ${asset}`);
    }
  });

  it('writes only an age-encrypted service archive to durable backup storage', () => {
    const dockerfile = read('backup/Dockerfile');
    const backup = read('scripts/backup.sh');
    assert.match(dockerfile, /apk add --no-cache age\b/);
    assert.match(backup, /BACKUP_AGE_RECIPIENT:\?/);
    assert.match(backup, /tar[\s\S]*\| age --recipient/);
    assert.match(backup, /\.tar\.gz\.age/);
  });

  it('checks integrity, exercises recovery in CI and alerts on backup failure', () => {
    const backup = read('scripts/backup.sh');
    const verifier = read('scripts/verify-backup.sh');
    const recoveryTest = read('scripts/test-backup-restore.sh');
    const workflow = read('.github/workflows/ci.yml');

    assert.match(backup, /sha256sum -c/);
    assert.match(backup, /kalico_backup_failed/);
    assert.match(verifier, /age --decrypt/);
    assert.match(verifier, /test -s "\$work_dir\/postgres\.sql"/);
    assert.match(recoveryTest, /\/verify-backup\.sh/);
    assert.match(workflow, /Exercise encrypted backup recovery/);
  });
});
