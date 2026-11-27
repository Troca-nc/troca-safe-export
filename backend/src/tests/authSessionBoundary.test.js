'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, makeReq, makeRes } = require('./helpers');
const { generateTokens, verifyAccessToken } = require('../config/jwt');
const { setRefreshCookie, clearRefreshCookies } = require('../config/authCookies');
const { prepareRefreshRateLimit } = require('../middleware/refreshSession');
const { verifyWebAuthOrigin } = require('../middleware/webAuthOrigin');

process.env.JWT_SECRET = 'test_jwt_secret_minimum_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.BASE_URL = 'https://kalico.nc';
delete process.env.NATIVE_AUTH_ENABLED;

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('auth session Web boundary', () => {
  it('pose le refresh Web uniquement sur le chemin de refresh et efface le cookie historique', () => {
    const cookies = [];
    const res = {
      cookie(name, value, options) { cookies.push({ name, value, options }); return this; },
    };
    setRefreshCookie(res, 'secret-refresh');
    assert.strictEqual(cookies.length, 2);
    assert.strictEqual(cookies[0].options.path, '/');
    assert.strictEqual(cookies[0].options.maxAge, 0);
    assert.strictEqual(cookies[1].options.path, '/api/auth/refresh');
    assert.strictEqual(cookies[1].options.httpOnly, true);
    assert.strictEqual(cookies[1].options.sameSite, 'strict');
  });

  it('efface les deux chemins de cookie au logout', () => {
    const cookies = [];
    const res = { cookie(name, value, options) { cookies.push({ name, value, options }); return this; } };
    clearRefreshCookies(res);
    assert.deepStrictEqual(cookies.map((entry) => entry.options.path), ['/api/auth/refresh', '/']);
    assert.ok(cookies.every((entry) => entry.options.maxAge === 0));
  });

  it('accepte uniquement l’origine Web exacte pour refresh et logout', () => {
    let passed = false;
    const req = makeReq({
      headers: { origin: 'https://kalico.nc', 'sec-fetch-site': 'same-origin' },
      get(name) { return this.headers[String(name).toLowerCase()]; },
    });
    verifyWebAuthOrigin(req, makeRes(), () => { passed = true; });
    assert.strictEqual(passed, true);

    for (const headers of [{}, { origin: 'https://evil.invalid', 'sec-fetch-site': 'cross-site' }]) {
      const rejected = makeRes();
      verifyWebAuthOrigin(makeReq({ headers, get(name) { return this.headers[String(name).toLowerCase()]; } }), rejected, () => {
        throw new Error('Une origine non prouvée ne doit pas passer');
      });
      assert.strictEqual(rejected._code, 403);
      assert.strictEqual(rejected._payload.code, 'AUTH_ORIGIN_INVALID');
    }
  });

  it('dérive la clé du limiteur depuis le sid signé et rejette un sid forgé', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const valid = generateTokens(7, { sessionId }).refreshToken;
    const validReq = makeReq({ body: { refresh_token: valid }, ip: '192.0.2.1' });
    prepareRefreshRateLimit(validReq, makeRes(), () => {});
    assert.strictEqual(validReq.refreshRateLimitKey, `session:${sessionId}`);

    const forgedReq = makeReq({ body: { refresh_token: `${valid}forged` }, ip: '192.0.2.2' });
    prepareRefreshRateLimit(forgedReq, makeRes(), () => {});
    assert.match(forgedReq.refreshRateLimitKey, /^invalid:/);
  });

  it('retire refresh des limiteurs généraux et conserve un limiteur dédié', () => {
    const limiter = source('middleware/rateLimit.js');
    assert.match(limiter, /skip: isRefreshSessionPath/);
    assert.match(limiter, /req\.path === '\/refresh'/);
    assert.match(limiter, /req\.refreshRateLimitKey/);
  });

  it('ne sérialise jamais le refresh token dans une réponse Web', () => {
    const authRoute = source('routes/auth.js');
    const socialRoute = source('routes/auth.social.js');
    for (const routeSource of [authRoute, socialRoute]) {
      const responses = [...routeSource.matchAll(/res(?:\.status\([^)]*\))?\.json\((\{[\s\S]*?\})\);?/g)]
        .map((match) => match[1])
        .join('\n');
      assert.ok(!responses.includes('refresh_token:'));
    }
  });

  it('persiste une famille pour Google et Apple et propage les pannes de session', () => {
    const socialRoute = source('routes/auth.social.js');
    assert.match(socialRoute, /await issueSessionTokens\(user\.id/);
    assert.strictEqual((socialRoute.match(/await buildAuthResponse\(user\)/g) || []).length, 2);
    assert.strictEqual((socialRoute.match(/return sendPersistenceError\(res, err/g) || []).length, 2);
    assert.match(socialRoute, /err\.status \|\| 503/);
    assert.match(socialRoute, /AUTH_DEPENDENCY_UNAVAILABLE/);
  });

  it('révoque toutes les familles après changement ou reset du mot de passe', () => {
    const usersRoute = source('routes/users.js');
    const accountService = source('services/authAccountService.js');
    assert.match(usersRoute, /revokeAllUserSessionsWithClient\(client, req\.user\.id, 'password_change'\)/);
    assert.match(accountService, /revokeAllUserSessionsWithClient\(client, userId, 'password_reset'\)/);
  });

  it('conserve une migration additive et purge les jetons utilisés après expiration', () => {
    const migration = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'database', 'migrations', '20261125_auth_session_families.sql'),
      'utf8'
    );
    assert.match(migration, /CREATE TABLE IF NOT EXISTS auth_sessions/);
    assert.match(migration, /ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT NULL/);
    assert.ok(!migration.includes('session_id SET NOT NULL'));
    assert.match(migration, /DELETE FROM refresh_tokens WHERE expires_at < NOW\(\)/);
    assert.match(migration, /DELETE FROM auth_sessions WHERE expires_at < NOW\(\)/);
  });

  it('classe un jeton du mauvais type comme JWT invalide', () => {
    const refreshToken = generateTokens(7).refreshToken;
    assert.throws(() => verifyAccessToken(refreshToken), (error) => error.name === 'JsonWebTokenError');
  });

  it('garde le contrat natif non monté et désactivé par défaut', () => {
    assert.strictEqual(require('../config/nativeAuth').isNativeAuthEnabled(), false);
    const indexSource = source('index.js');
    assert.ok(!indexSource.includes('auth.native'));
  });
});
