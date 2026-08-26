'use strict';

const MAX_LOG_PATH_LENGTH = 2048;

function sanitizeLogPath(value) {
  let raw = String(value || '/').replace(/[\r\n\t]/g, '');

  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
      raw = new URL(raw).pathname;
    }
  } catch {
    // Fall back to delimiter stripping for malformed absolute URLs.
  }

  const delimiter = raw.search(/[?#]/);
  if (delimiter >= 0) raw = raw.slice(0, delimiter);
  if (!raw.startsWith('/')) raw = `/${raw}`;
  return (raw || '/').slice(0, MAX_LOG_PATH_LENGTH);
}

module.exports = { MAX_LOG_PATH_LENGTH, sanitizeLogPath };
