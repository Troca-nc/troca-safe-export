'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { buildFallbackOtpEmail } = require('../services/phoneOtpService');

describe('Email de vérification téléphone', () => {
  it('personnalise le message et applique l’identité Kalico', () => {
    const email = buildFallbackOtpEmail({
      firstName: 'Léa',
      code: '782939',
      maskedEmail: 'l***m@hotmail.fr',
      maskedPhone: '+687••••14',
      baseUrl: 'https://kalico.nc/',
    });

    assert.match(email.html, /Bonjour Léa,/);
    assert.match(email.html, /782939/);
    assert.match(email.html, /brand\/kalico1\.svg/);
    assert.match(email.html, /L’équipe Kalico/);
    assert.doesNotMatch(email.html, /Bonjour utilisateur/);
    assert.match(email.text, /Bonjour Léa,/);
    assert.match(email.text, /L'équipe Kalico/);
  });

  it('échappe les données affichées et garde un salut naturel sans prénom', () => {
    const email = buildFallbackOtpEmail({
      firstName: '<script>alert(1)</script>',
      code: '123456',
      maskedEmail: 'a***b@example.nc',
      maskedPhone: '+687••••34',
      baseUrl: 'https://kalico.nc',
    });

    assert.doesNotMatch(email.html, /<script>/);
    assert.match(email.html, /&lt;script&gt;/);

    const genericEmail = buildFallbackOtpEmail({
      firstName: '',
      code: '123456',
      maskedEmail: 'a***b@example.nc',
      maskedPhone: '+687••••34',
      baseUrl: 'https://kalico.nc',
    });
    assert.match(genericEmail.html, /Bonjour,/);
    assert.doesNotMatch(genericEmail.html, /utilisateur/);
  });
});
