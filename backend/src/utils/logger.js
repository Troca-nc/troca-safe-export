'use strict';

const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|session|rawbody|api[-_]?key|private[-_]?key|access[-_]?key|refresh/i;
const MAX_DEPTH = 4;

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function redact(value, depth = 0, seen = new WeakSet()) {
  if (value == null) return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      code: value.code,
      status: value.status,
      digest: value.digest,
    };
  }
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? '[Array]' : '[Object]';

  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redact(item, depth + 1, seen));
  }

  if (!isPlainObject(value)) {
    return String(value);
  }

  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEYS.test(key)) {
      output[key] = '[redacted]';
      continue;
    }
    output[key] = redact(nested, depth + 1, seen);
  }
  return output;
}

function emit(level, message, context = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...redact(context),
  };

  const serialized = JSON.stringify(entry);
  if (level === 'error' && typeof console.error === 'function') {
    console.error(serialized);
    return;
  }
  if (level === 'warn' && typeof console.warn === 'function') {
    console.warn(serialized);
    return;
  }
  if (level === 'debug' && typeof console.debug === 'function') {
    console.debug(serialized);
    return;
  }
  console.log(serialized);
}

const logger = {
  debug: (message, context) => emit('debug', message, context),
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context) => emit('error', message, context),
};

module.exports = { logger, redact };
