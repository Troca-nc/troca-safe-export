'use strict';

function getTrustedClientIp(req) {
  const ip = String(req?.ip || '').trim();
  return ip || 'unknown';
}

module.exports = {
  getTrustedClientIp,
};
