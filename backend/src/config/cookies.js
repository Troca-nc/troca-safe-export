'use strict';

function setSecureCookie(res, name, value, options = {}) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    ...options,
  });
}

function clearSecureCookie(res, name, options = {}) {
  res.cookie(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    ...options,
  });
}

function getCookieValue(req, name) {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return '';
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawName, ...rawValue] = part.split('=');
    if (String(rawName || '').trim() !== name) continue;
    return decodeURIComponent(rawValue.join('=').trim() || '');
  }
  return '';
}

module.exports = { setSecureCookie, clearSecureCookie, getCookieValue };
