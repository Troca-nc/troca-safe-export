'use strict';

// Instants are stored and compared in UTC. Calendar rules shown to users and
// cron schedules follow New Caledonia civil time.
const DATABASE_TIME_ZONE = 'UTC';
const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE || 'Pacific/Noumea';

module.exports = {
  DATABASE_TIME_ZONE,
  BUSINESS_TIME_ZONE,
};
