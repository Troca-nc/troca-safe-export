'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');

const root = path.resolve(__dirname, '..', '..', '..', '..');
const nginx = fs.readFileSync(path.join(root, 'nginx/sites/kalico.nc.conf'), 'utf8');

function locations(pattern) {
  return nginx.match(pattern) || [];
}

describe('public upload cache policy', () => {
  it('prevents shared or immutable caching for proxied listing images', () => {
    const blocks = locations(/location ~ \^\/uploads\/\[0-9\]\+ \{[\s\S]*?\n    \}/g);
    assert.strictEqual(blocks.length, 2);
    for (const block of blocks) {
      assert.match(block, /proxy_hide_header Cache-Control;/);
      assert.match(block, /add_header Cache-Control "no-store" always;/);
      assert.doesNotMatch(block, /public|immutable|max-age/i);
    }
  });

  it('disables browser and shared caching for files served by the uploads alias', () => {
    const blocks = locations(/location \/uploads\/ \{[\s\S]*?\n    \}/g);
    assert.strictEqual(blocks.length, 2);
    for (const block of blocks) {
      assert.match(block, /expires off;/);
      assert.match(block, /add_header Cache-Control "no-store" always;/);
      assert.doesNotMatch(block, /public|immutable|max-age|expires 30d/i);
    }
  });
});