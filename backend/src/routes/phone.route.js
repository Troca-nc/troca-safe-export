'use strict';

// ============================================================
//  Troca - Route verification telephone
//  POST /api/phone/send      - Envoyer le code
//  POST /api/phone/verify    - Verifier le code
//  POST /api/phone/resend    - Renvoyer le code
//  DELETE /api/phone         - Supprimer le numero
// ============================================================

const { Router } = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { phoneLimiter } = require('../middleware/rateLimit');
const { query } = require('../config/database');
const {
  normalizePhoneNumber,
  sendPhoneOtp,
  verifyPhoneOtp,
  resendPhoneOtp,
} = require('../services/phoneOtpService');

const router = Router();
router.use(authenticate);

const sendSchema = {
  body: Joi.object({
    telephone: Joi.string()
      .pattern(/^\+?[0-9]{6,15}$/)
      .required()
      .messages({ 'string.pattern.base': 'Numéro de téléphone invalide' }),
  }),
};

const verifySchema = {
  body: Joi.object({
    telephone: Joi.string().pattern(/^\+?[0-9]{6,15}$/).required(),
    code: Joi.string().length(6).pattern(/^[0-9]+$/).required()
      .messages({ 'string.length': 'Le code doit contenir 6 chiffres' }),
  }),
};

const resendSchema = {
  body: Joi.object({
    telephone: Joi.string()
      .pattern(/^\+?[0-9]{6,15}$/)
      .required()
      .messages({ 'string.pattern.base': 'Numéro de téléphone invalide' }),
    channel: Joi.string().valid('sms', 'email').default('sms'),
  }),
};

function ensureUniquePhone(req, res, normalized) {
  return query(
    'SELECT id FROM users WHERE telephone = $1 AND phone_verified = TRUE AND id != $2',
    [normalized, req.user.id]
  ).then((existing) => {
    if (existing.rows[0]) {
      res.status(409).json({ error: 'Ce numéro est déjà associé à un autre compte' });
      return false;
    }
    return true;
  });
}

router.post('/send', phoneLimiter, validate(sendSchema), async (req, res) => {
  const normalized = normalizePhoneNumber(req.body.telephone);
  if (!(await ensureUniquePhone(req, res, normalized))) return;

  try {
    const result = await sendPhoneOtp({
      user: req.user,
      telephone: normalized,
      preferChannel: 'sms',
    });

    return res.json({
      success: true,
      message: result.message,
      channel: result.channel,
      masked: result.masked,
      expires_at: result.expires_at,
      cooldown: result.cooldown,
      telephone: normalized,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Impossible d\'envoyer le code. Vérifiez le numéro.',
      code: err.code || 'PHONE_SEND_FAILED',
    });
  }
});

router.post('/verify', phoneLimiter, validate(verifySchema), async (req, res) => {
  const normalized = normalizePhoneNumber(req.body.telephone);

  try {
    const result = await verifyPhoneOtp({
      user: req.user,
      telephone: normalized,
      code: req.body.code,
    });

    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Erreur lors de la vérification',
      code: err.code || 'PHONE_VERIFY_FAILED',
    });
  }
});

router.post('/resend', phoneLimiter, validate(resendSchema), async (req, res) => {
  const normalized = normalizePhoneNumber(req.body.telephone);
  if (!(await ensureUniquePhone(req, res, normalized))) return;

  try {
    const result = await resendPhoneOtp({
      user: req.user,
      telephone: normalized,
      preferChannel: req.body.channel,
    });

    return res.json({
      success: true,
      message: result.message,
      channel: result.channel,
      masked: result.masked,
      expires_at: result.expires_at,
      cooldown: result.cooldown,
      telephone: normalized,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Impossible de renvoyer le code',
      code: err.code || 'OTP_RESEND_FAILED',
      retry_after: err.retryAfter || null,
    });
  }
});

router.delete('/', async (req, res) => {
  await query(
    'UPDATE users SET telephone = NULL, phone_verified = FALSE, updated_at = NOW() WHERE id = $1',
    [req.user.id]
  );
  return res.json({ message: 'Numéro de téléphone supprimé' });
});

module.exports = router;
