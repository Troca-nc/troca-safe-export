'use strict';

const { isConfiguredValue } = require('../config/env');
const { createHttpError } = require('./authAccountService');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function getTurnstileSecret() {
  return isConfiguredValue(process.env.TURNSTILE_SECRET_KEY)
    ? process.env.TURNSTILE_SECRET_KEY.trim()
    : '';
}

function isTurnstileEnabled() {
  return Boolean(getTurnstileSecret());
}

function isBrowserOriginRequest(req) {
  const origin = req?.headers?.origin || '';
  const referer = req?.headers?.referer || '';
  const base = process.env.BASE_URL || 'http://localhost:3000';

  try {
    const allowedOrigin = new URL(base).origin;
    if (origin) {
      return new URL(origin).origin === allowedOrigin;
    }
    if (referer) {
      return new URL(referer).origin === allowedOrigin;
    }
  } catch {
    return Boolean(origin || referer);
  }

  return false;
}

async function verifyTurnstileToken({ req, token, ip, action } = {}) {
  const secret = getTurnstileSecret();
  if (!secret) {
    return { enabled: false, verified: true, skipped: true };
  }

  if (!isBrowserOriginRequest(req)) {
    return { enabled: true, verified: true, skipped: true };
  }

  const challengeToken = typeof token === 'string' ? token.trim() : '';
  if (!challengeToken) {
    throw createHttpError(403, 'Vérification anti-bot requise.', 'TURNSTILE_REQUIRED');
  }

  const payload = new URLSearchParams({
    secret,
    response: challengeToken,
  });

  if (ip) payload.set('remoteip', ip);
  if (action) payload.set('action', action);

  let response;
  try {
    response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });
  } catch (err) {
    throw createHttpError(503, 'Vérification anti-bot indisponible.', 'TURNSTILE_UNAVAILABLE');
  }

  if (!response.ok) {
    throw createHttpError(503, 'Vérification anti-bot indisponible.', 'TURNSTILE_UNAVAILABLE');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw createHttpError(503, 'Vérification anti-bot indisponible.', 'TURNSTILE_UNAVAILABLE');
  }

  if (!data?.success) {
    throw createHttpError(403, 'Vérification anti-bot échouée.', 'TURNSTILE_FAILED');
  }

  if (action && data.action && data.action !== action) {
    throw createHttpError(403, 'Vérification anti-bot invalide.', 'TURNSTILE_ACTION_MISMATCH');
  }

  return { enabled: true, verified: true, challenge: data };
}

module.exports = {
  isTurnstileEnabled,
  isBrowserOriginRequest,
  verifyTurnstileToken,
};
