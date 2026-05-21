'use strict';

// ============================================================
//  Tests — emailService.js
// ============================================================

const assert = require('assert');
const { describe, it } = require('./helpers');

// Stub nodemailer pour ne pas envoyer de vrais emails en CI
const sentEmails = [];
require.cache[require.resolve('nodemailer')] = {
  id:       require.resolve('nodemailer'),
  filename: require.resolve('nodemailer'),
  loaded:   true,
  exports: {
    createTransport: () => ({
      sendMail: async (opts) => { sentEmails.push(opts); return { messageId: 'test-id' }; },
    }),
  },
};

// Fixer les env vars SMTP pour activer le transporter
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_USER = 'test@troca.nc';
process.env.SMTP_PASS = 'testpass';
process.env.SMTP_FROM = 'noreply@troca.nc';
process.env.BASE_URL  = 'https://troca.nc';

const {
  sendMail,
  sendResetEmail,
  sendWelcomeEmail,
  sendAlertEmail,
  sendNewMessageEmail,
} = require('../services/emailService');

describe('emailService — sendMail', () => {
  it('envoie un email avec les bons champs', async () => {
    sentEmails.length = 0;
    await sendMail({ to: 'dest@test.nc', subject: 'Test', html: '<p>Hello</p>' });
    assert.strictEqual(sentEmails.length, 1);
    assert.strictEqual(sentEmails[0].to, 'dest@test.nc');
    assert.strictEqual(sentEmails[0].subject, 'Test');
    assert.ok(sentEmails[0].from.includes('Troca'));
  });
});

describe('emailService — sendResetEmail', () => {
  it('envoie un email de reset avec un lien contenant le token', async () => {
    sentEmails.length = 0;
    await sendResetEmail('user@test.nc', 'abc123token');
    assert.strictEqual(sentEmails.length, 1);
    assert.ok(sentEmails[0].subject.toLowerCase().includes('mot de passe'));
    assert.ok(sentEmails[0].html.includes('abc123token'));
    assert.ok(sentEmails[0].html.includes('/mot-de-passe-oublie/reset'));
    assert.ok(sentEmails[0].html.includes('https://troca.nc'));
  });
});

describe('emailService — sendWelcomeEmail', () => {
  it('envoie un email de bienvenue avec le prénom', async () => {
    sentEmails.length = 0;
    await sendWelcomeEmail('jean@test.nc', 'Jean');
    assert.strictEqual(sentEmails.length, 1);
    assert.ok(sentEmails[0].subject.includes('Jean'));
    assert.ok(sentEmails[0].html.includes('Jean'));
  });
});

describe('emailService — sendAlertEmail', () => {
  it('ne rien envoyer si aucune annonce', async () => {
    sentEmails.length = 0;
    const result = await sendAlertEmail('u@test.nc', 'Marie', { label: 'iPhone', unsubscribe_token: 'tok' }, []);
    assert.strictEqual(result, null);
    assert.strictEqual(sentEmails.length, 0);
  });

  it('envoie un email avec les annonces correspondantes', async () => {
    sentEmails.length = 0;
    const annonces = [
      { id: 1, titre: 'iPhone 14', prix_xpf: 120000, commune: 'Nouméa' },
      { id: 2, titre: 'Samsung S23', prix_xpf: 95000, commune: 'Dumbéa' },
    ];
    await sendAlertEmail('u@test.nc', 'Marie', { label: 'smartphone', unsubscribe_token: 'tok123' }, annonces);
    assert.strictEqual(sentEmails.length, 1);
    assert.ok(sentEmails[0].html.includes('iPhone 14'));
    assert.ok(sentEmails[0].html.includes('Samsung S23'));
    assert.ok(sentEmails[0].html.includes('tok123')); // lien désabonnement
  });
});

describe('emailService — sendNewMessageEmail', () => {
  it('envoie une notification de nouveau message', async () => {
    sentEmails.length = 0;
    await sendNewMessageEmail('buyer@test.nc', 'Paul', 'Marie Martin', 'Vélo de route', '42');
    assert.strictEqual(sentEmails.length, 1);
    assert.ok(sentEmails[0].subject.includes('Marie Martin'));
    assert.ok(sentEmails[0].html.includes('Vélo de route'));
    assert.ok(sentEmails[0].html.includes('/messages/42'));
  });
});
