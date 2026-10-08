'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('optional production integrations', () => {
  it('keeps payment and social providers out of unconditional preflight requirements', () => {
    const preflight = read('scripts/preflight.sh');
    const requiredBlock = preflight.match(/production_required_vars=\(\n([\s\S]*?)\n\)/)?.[1] || '';

    for (const name of [
      'NEXT_PUBLIC_STRIPE_PK', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
      'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
      'PAYPLUG_SECRET_KEY', 'PAYPLUG_WEBHOOK_SECRET',
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
      'APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY',
      'BACKUP_ALERT_WEBHOOK_URL',
    ]) {
      assert.doesNotMatch(requiredBlock, new RegExp(`^\\s*${name}\\s*$`, 'm'));
    }
  });

  it('rejects partially configured optional providers', () => {
    const preflight = read('scripts/preflight.sh');
    assert.match(preflight, /validate_optional_group STRIPE STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET STRIPE_PRICE_PRO_MENSUEL STRIPE_PRICE_PRO_ANNUEL/);
    assert.match(preflight, /validate_optional_group PAYPLUG PAYPLUG_SECRET_KEY PAYPLUG_WEBHOOK_SECRET/);
    assert.match(preflight, /validate_optional_group GOOGLE GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET/);
    assert.match(preflight, /validate_optional_group APPLE APPLE_CLIENT_ID APPLE_TEAM_ID APPLE_KEY_ID APPLE_PRIVATE_KEY/);
  });

  it('allows backup alerts to be omitted while preserving encrypted backups', () => {
    const backup = read('scripts/backup.sh');
    assert.match(backup, /BACKUP_AGE_RECIPIENT:\?/);
    assert.doesNotMatch(backup, /BACKUP_ALERT_WEBHOOK_URL:\?/);
  });
});
