'use strict';

const assert = require('assert');
const { describe, it, flushTests } = require('./helpers');

process.env.NODE_ENV = 'production';
process.env.DEMO_MODE = 'false';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';
process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_AUTH_TOKEN = 'authtoken';
process.env.TWILIO_SMS_FROM_NUMBER = '+687123456';

const twilioMessages = [];
require.cache[require.resolve('twilio')] = {
  id: require.resolve('twilio'),
  filename: require.resolve('twilio'),
  loaded: true,
  exports: () => ({
    messages: {
      create: async (payload) => {
        twilioMessages.push(payload);
        return { sid: 'SM-test' };
      },
    },
  }),
};

const emailCalls = [];
require.cache[require.resolve('../services/emailService')] = {
  id: require.resolve('../services/emailService'),
  filename: require.resolve('../services/emailService'),
  loaded: true,
  exports: {
    sendResetEmail: async (to, token) => {
      emailCalls.push({ to, token });
      return { simulated: true };
    },
  },
};

const { deliverPasswordReset } = require('../services/passwordResetDeliveryService');

describe('passwordResetDeliveryService', () => {
  it('privilégie le SMS quand le téléphone est vérifié', async () => {
    twilioMessages.length = 0;
    emailCalls.length = 0;

    const result = await deliverPasswordReset({
      user: {
        email: 'vendeur@demo.kalico.nc',
        prenom: 'Ana',
        telephone: '+687701234',
        phone_verified: true,
      },
      token: 'reset-token-123',
    });

    assert.strictEqual(result.channel, 'sms');
    assert.strictEqual(twilioMessages.length, 1);
    assert.strictEqual(emailCalls.length, 0);
    assert.ok(twilioMessages[0].body.includes('reset-token-123'));
    assert.ok(twilioMessages[0].body.includes('/mot-de-passe-oublie/reset?token=reset-token-123'));
  });

  it("bascule sur l'email quand le téléphone n'est pas vérifié", async () => {
    twilioMessages.length = 0;
    emailCalls.length = 0;

    const result = await deliverPasswordReset({
      user: {
        email: 'particulier@demo.kalico.nc',
        prenom: 'Paul',
        telephone: '+687721234',
        phone_verified: false,
      },
      token: 'reset-token-456',
    });

    assert.strictEqual(result.channel, 'email');
    assert.strictEqual(twilioMessages.length, 0);
    assert.strictEqual(emailCalls.length, 1);
    assert.strictEqual(emailCalls[0].to, 'particulier@demo.kalico.nc');
    assert.strictEqual(emailCalls[0].token, 'reset-token-456');
  });
});

module.exports = flushTests();
