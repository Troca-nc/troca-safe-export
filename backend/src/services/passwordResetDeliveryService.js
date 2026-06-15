'use strict';

const twilio = require('twilio');
const { isConfiguredValue } = require('../config/env');
const { sendResetEmail } = require('./emailService');
const { maskPhoneNumber, normalizePhoneNumber } = require('./phoneOtpService');

function getBaseUrl() {
  return process.env.BASE_URL || 'https://kalico.nc';
}

function buildTwilioClient() {
  if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
    return null;
  }

  if (!isConfiguredValue(process.env.TWILIO_ACCOUNT_SID) || !isConfiguredValue(process.env.TWILIO_AUTH_TOKEN)) {
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim());
}

function getSmsFromNumber() {
  const raw = process.env.TWILIO_SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_FROM;
  return isConfiguredValue(raw) ? String(raw).trim() : '';
}

function buildResetLink(token) {
  return `${getBaseUrl()}/mot-de-passe-oublie/reset?token=${encodeURIComponent(token)}`;
}

const twilioClient = buildTwilioClient();

async function sendPasswordResetSms({ telephone, prenom, token }) {
  const normalized = normalizePhoneNumber(telephone);
  const from = getSmsFromNumber();

  if (!normalized) {
    const error = new Error('Numéro de téléphone invalide');
    error.code = 'PHONE_INVALID';
    throw error;
  }

  if (!twilioClient || !from) {
    const error = new Error('TWILIO_SMS_NOT_CONFIGURED');
    error.code = 'TWILIO_SMS_NOT_CONFIGURED';
    throw error;
  }

  const link = buildResetLink(token);
  const greeting = prenom ? `Bonjour ${prenom}, ` : 'Bonjour, ';
  const body = `${greeting}réinitialisez votre mot de passe Kalico ici : ${link}. Ce lien est valable 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.`;

  await twilioClient.messages.create({
    from,
    to: normalized,
    body,
  });

  return {
    success: true,
    channel: 'sms',
    masked: maskPhoneNumber(normalized),
    message: 'Lien envoyé par SMS',
  };
}

async function deliverPasswordReset({ user, token }) {
  const canUseSms = Boolean(user?.telephone && user?.phone_verified);

  if (canUseSms) {
    try {
      return await sendPasswordResetSms({
        telephone: user.telephone,
        prenom: user.prenom,
        token,
      });
    } catch (err) {
      console.warn(`[auth] SMS reset failed${err?.code ? ` (${err.code})` : ''}:`, err.message);
    }
  }

  try {
    await sendResetEmail(user.email, token);
    return {
      success: true,
      channel: 'email',
      fallback: canUseSms,
      message: 'Lien envoyé par email',
    };
  } catch (err) {
    console.error(`[auth] Reset delivery failed${err?.code ? ` (${err.code})` : ''}:`, err.message);
    return {
      success: false,
      channel: canUseSms ? 'sms' : 'email',
      fallback: canUseSms,
      message: 'Impossible d’envoyer le lien de réinitialisation',
    };
  }
}

module.exports = {
  deliverPasswordReset,
  sendPasswordResetSms,
};
