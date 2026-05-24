'use strict';

const assert = require('assert');
const { describe, it, makeReq, makeRes, makeQueryMock, assertStatus } = require('./helpers');

const queryMock = makeQueryMock((sql) => {
  if (sql.includes('FROM users WHERE id = $1')) {
    return { rows: [{ id: 12, email: 'demo@troca.nc', prenom: 'Demo' }] };
  }
  if (sql.includes('FROM annonces WHERE user_id = $1')) return { rows: [{ id: 1, titre: 'Annonce', created_at: new Date().toISOString() }] };
  if (sql.includes('FROM annonce_images')) return { rows: [{ id: 10, annonce_id: 1 }] };
  if (sql.includes('FROM favoris')) return { rows: [{ id: 2, annonce_id: 1 }] };
  if (sql.includes('FROM messages')) return { rows: [{ id: 3, content: 'Bonjour' }] };
  if (sql.includes('FROM payments')) return { rows: [{ id: 4, amount_xpf: 4900 }] };
  if (sql.includes('FROM search_alerts')) return { rows: [{ id: 5, label: 'Vélo' }] };
  if (sql.includes('FROM rgpd_logs')) return { rows: [{ id: 6, action: 'data_exported' }] };
  if (sql.includes('FROM subscriptions')) return { rows: [{ id: 7, plan: 'pro' }] };
  if (sql.includes('FROM boosts')) return { rows: [{ id: 8, listing_id: 1 }] };
  if (sql.includes('FROM troc_proposals')) return { rows: [{ id: 9, status: 'pending' }] };
  if (sql.includes('FROM covoit_alerts')) return { rows: [{ id: 10, from_commune: 'Nouméa' }] };
  if (sql.includes('FROM bon_plans')) return { rows: [{ id: 11, title: 'Promo' }] };
  if (sql.includes('FROM business_reviews')) return { rows: [{ id: 12, rating: 5 }] };
  if (sql.includes('FROM rgpd_consentements')) return { rows: [{ user_id: 12, analytics: true }] };
  if (sql.startsWith('DELETE FROM')) return { rows: [] };
  return { rows: [] };
});

let sentEmail = null;

require.cache[require.resolve('../config/database')] = {
  id: require.resolve('../config/database'),
  filename: require.resolve('../config/database'),
  loaded: true,
  exports: { query: queryMock },
};

require.cache[require.resolve('../middleware/auth')] = {
  id: require.resolve('../middleware/auth'),
  filename: require.resolve('../middleware/auth'),
  loaded: true,
  exports: {
    authenticate: (req, _res, next) => {
      req.user = req.user || { id: 12, email: 'demo@troca.nc', prenom: 'Demo' };
      next();
    },
  },
};

require.cache[require.resolve('../services/emailService')] = {
  id: require.resolve('../services/emailService'),
  filename: require.resolve('../services/emailService'),
  loaded: true,
  exports: {
    sendMail: async (payload) => {
      sentEmail = payload;
      return { simulated: true };
    },
  },
};

const router = require('../routes/legal');

function invoke(req) {
  const res = makeRes();
  return new Promise((resolve, reject) => {
    res.setHeader = (name, value) => {
      res._headers[name] = value;
      return res;
    };
    res.getHeader = (name) => res._headers[name];
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

describe('legal routes', () => {
  it('retourne les versions des pages légales', async () => {
    const res = await invoke(makeReq({ method: 'GET', url: '/legal/versions' }));
    assertStatus(res, 200);
    assert.ok(Array.isArray(res._payload.data));
    assert.ok(res._payload.data.some((page) => page.id === 'cgu'));
  });

  it('exporte les données utilisateur RGPD', async () => {
    const res = await invoke(makeReq({
      method: 'GET',
      url: '/users/me/export',
      user: { id: 12, email: 'demo@troca.nc', prenom: 'Demo' },
    }));
    assertStatus(res, 200);
    assert.strictEqual(res._headers['Content-Type'], 'application/json; charset=utf-8');
    assert.ok(res._headers['Content-Disposition'].includes('troca-mes-donnees-12.json'));
    assert.strictEqual(res._payload.user.email, 'demo@troca.nc');
    assert.strictEqual(res._payload.listings.length, 1);
    assert.strictEqual(res._payload.messages.length, 1);
  });

  it('supprime le compte après confirmation email', async () => {
    sentEmail = null;
    const res = await invoke(makeReq({
      method: 'DELETE',
      url: '/users/me',
      body: { confirmation_email: 'demo@troca.nc' },
      user: { id: 12, email: 'demo@troca.nc', prenom: 'Demo' },
    }));
    assertStatus(res, 200);
    assert.strictEqual(res._payload.success, true);
    assert.strictEqual(sentEmail.subject, 'Votre compte Troca a été supprimé');
  });
});
