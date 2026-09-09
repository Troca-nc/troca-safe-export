'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { BUSINESS_TIME_ZONE, DATABASE_TIME_ZONE } = require('../config/timePolicy');

describe('time policy', () => {
  it('stores instants in UTC and uses New Caledonia civil time for calendar rules', () => {
    assert.strictEqual(DATABASE_TIME_ZONE, 'UTC');
    assert.strictEqual(BUSINESS_TIME_ZONE, process.env.BUSINESS_TIME_ZONE || 'Pacific/Noumea');
  });

  it('configures every PostgreSQL connection with the UTC session timezone', () => {
    const databaseSource = require('fs').readFileSync(require.resolve('../config/database'), 'utf8');
    assert.match(databaseSource, /options:\s*`-c timezone=\$\{DATABASE_TIME_ZONE\}`/);
  });
});
