'use strict';

// ============================================================
//  Tests — jobs/scheduler.js
// ============================================================

const assert = require('assert');
const { describe, it } = require('./helpers');

// ── Stub node-cron ────────────────────────────────────────────
const registeredJobs = [];
require.cache[require.resolve('node-cron')] = {
  id: require.resolve('node-cron'), filename: require.resolve('node-cron'), loaded: true,
  exports: {
    schedule: (expr, fn, opts) => {
      registeredJobs.push({ expr, fn, tz: opts?.timezone });
      return { stop: () => {} };
    },
  },
};

// ── Stub emailService ─────────────────────────────────────────
const sentAlertEmails = [];
require.cache[require.resolve('../services/emailService')] = {
  id: require.resolve('../services/emailService'),
  loaded: true,
  exports: {
    sendAlertEmail:    async (to, prenom, alert, annonces) => { sentAlertEmails.push({ to, alert, count: annonces.length }); },
    sendResetEmail:    async () => {},
    sendWelcomeEmail:  async () => {},
    sendNewMessageEmail: async () => {},
  },
};

// ── Stub DB ───────────────────────────────────────────────────
let dbBoostRows    = [];
let dbAlertRows    = [];
let dbAnnoncesRows = [];
let dbUpdated      = false;

const dbStub = {
  query: async (sql, params) => {
    const s = sql.trim().toUpperCase();
    // Expiration boosts
    if (s.includes('UPDATE ANNONCES') && s.includes('IS_BOOSTED')) {
      dbUpdated = true;
      return { rows: dbBoostRows, rowCount: dbBoostRows.length };
    }
    // Alertes actives
    if (s.includes('FROM SEARCH_ALERTS')) {
      return { rows: dbAlertRows, rowCount: dbAlertRows.length };
    }
    // Annonces matching
    if (s.includes('FROM ANNONCES') && s.includes('ALERT_SENT_LOG')) {
      return { rows: dbAnnoncesRows, rowCount: dbAnnoncesRows.length };
    }
    // Upsert alert_sent_log
    if (s.includes('ALERT_SENT_LOG')) return { rows: [], rowCount: 0 };
    // Update last_sent_at
    if (s.includes('UPDATE SEARCH_ALERTS')) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  },
};

const origLoad = require('module')._load;
require('module')._load = function (req, parent, isMain) {
  if (req.includes('config/database') || req.endsWith('database')) return dbStub;
  return origLoad.apply(this, arguments);
};

const { startAllJobs, matchImmediateAlerts } = require('../jobs/scheduler');

require('module')._load = origLoad;

describe('scheduler — startAllJobs', () => {
  it('enregistre 3 jobs cron au démarrage', () => {
    registeredJobs.length = 0;
    startAllJobs();
    assert.ok(registeredJobs.length >= 3, `${registeredJobs.length} jobs enregistrés (attendu ≥ 3)`);
  });

  it('tous les jobs sont en timezone Pacific/Noumea', () => {
    const tzJobs = registeredJobs.filter(j => j.tz === 'Pacific/Noumea');
    assert.strictEqual(tzJobs.length, registeredJobs.length, 'Tous les jobs doivent être en heure de Nouméa');
  });

  it('le job de boost tourne toutes les heures', () => {
    const boostJob = registeredJobs.find(j => j.expr === '0 * * * *');
    assert.ok(boostJob, 'Job boost hourly manquant');
  });

  it('le job daily se déclenche à 8h00', () => {
    const dailyJob = registeredJobs.find(j => j.expr === '0 8 * * *');
    assert.ok(dailyJob, 'Job alertes daily à 08:00 manquant');
  });

  it('le job weekly se déclenche le lundi à 8h00', () => {
    const weeklyJob = registeredJobs.find(j => j.expr === '0 8 * * 1');
    assert.ok(weeklyJob, 'Job alertes weekly manquant');
  });
});

describe('scheduler — matchImmediateAlerts', () => {
  it('ne fait rien si aucune alerte immediate', async () => {
    sentAlertEmails.length = 0;
    dbAlertRows = [];
    await matchImmediateAlerts({ id: 1, titre: 'iPhone', user_id: 2, prix_xpf: 120000 });
    assert.strictEqual(sentAlertEmails.length, 0);
  });

  it('envoie un email si l\'annonce matche le filtre de l\'alerte', async () => {
    sentAlertEmails.length = 0;
    dbAlertRows = [{
      id: 1, user_id: 2, label: 'iPhone', filters: JSON.stringify({ q: 'iPhone' }),
      unsubscribe_token: 'tok', last_sent_at: null, email: 'u@test.nc', prenom: 'Marie',
    }];
    await matchImmediateAlerts({ id: 10, titre: 'iPhone 14 Pro', user_id: 99, prix_xpf: 120000 });
    assert.strictEqual(sentAlertEmails.length, 1);
    assert.strictEqual(sentAlertEmails[0].to, 'u@test.nc');
  });

  it('ne notifie pas le vendeur de sa propre annonce', async () => {
    sentAlertEmails.length = 0;
    dbAlertRows = [{
      id: 2, user_id: 5, label: 'iPhone', filters: JSON.stringify({ q: 'iPhone' }),
      unsubscribe_token: 'tok2', last_sent_at: null, email: 'seller@test.nc', prenom: 'Paul',
    }];
    // user_id de l'annonce = user_id de l'alerte → ne pas notifier
    await matchImmediateAlerts({ id: 11, titre: 'iPhone 14', user_id: 5, prix_xpf: 50000 });
    assert.strictEqual(sentAlertEmails.length, 0);
  });

  it('filtre par prix_max', async () => {
    sentAlertEmails.length = 0;
    dbAlertRows = [{
      id: 3, user_id: 3, label: 'vélo pas cher', filters: JSON.stringify({ q: 'vélo', prix_max: 30000 }),
      unsubscribe_token: 'tok3', last_sent_at: null, email: 'bargain@test.nc', prenom: 'Luc',
    }];
    // Prix trop élevé → pas de match
    await matchImmediateAlerts({ id: 12, titre: 'vélo de route', user_id: 99, prix_xpf: 80000 });
    assert.strictEqual(sentAlertEmails.length, 0);
  });
});
