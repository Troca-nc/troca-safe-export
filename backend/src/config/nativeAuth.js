'use strict';

function isNativeAuthEnabled() {
  return process.env.NATIVE_AUTH_ENABLED === 'true';
}

module.exports = { isNativeAuthEnabled };
