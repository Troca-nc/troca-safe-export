'use strict';

// ============================================================
//  Troca — Route vérification téléphone (Twilio Verify)
//  POST /api/phone/send      — Envoyer le code SMS
//  POST /api/phone/verify    — Vérifier le code
//  DELETE /api/phone         — Supprimer le numéro
// ============================================================

const { Router } = require('express');
const Joi        = require('joi');
const twilio     = require('twilio');
const { authenticate }    = require('../middleware/auth');
const { validate }        = require('../middleware/validate');
const { phoneLimiter }    = require('../middleware/rateLimit');
const { query }           = require('../config/database');
const { isConfiguredValue } = require('../config/env');

const router = Router();
router.use(authenticate);

// ── Client Twilio ────────────────────────────────────────────

const twilioClient = (isConfiguredValue(process.env.TWILIO_ACCOUNT_SID) && isConfiguredValue(process.env.TWILIO_AUTH_TOKEN))
  ? twilio(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim())
  : null;

const VERIFY_SID = isConfiguredValue(process.env.TWILIO_VERIFY_SID) ? process.env.TWILIO_VERIFY_SID.trim() : '';

function ensureTwilio(res) {
  if (!twilioClient || !VERIFY_SID) {
    res.status(503).json({ error: 'Vérification téléphone non configurée', code: 'TWILIO_NOT_CONFIGURED' });
    return false;
  }
  return true;
}

// ── Schémas ──────────────────────────────────────────────────

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
    code:      Joi.string().length(6).pattern(/^[0-9]+$/).required()
      .messages({ 'string.length': 'Le code doit contenir 6 chiffres' }),
  }),
};

// ── POST /api/phone/send ─────────────────────────────────────

router.post('/send', phoneLimiter, validate(sendSchema), async (req, res) => {
  if (!ensureTwilio(res)) return;

  const { telephone } = req.body;

  // Normaliser : ajouter +687 si numéro NC sans indicatif
  const normalized = telephone.startsWith('+') ? telephone : `+687${telephone.replace(/^0/, '')}`;

  // Vérifier que ce numéro n'est pas déjà utilisé par un autre compte
  const existing = await query(
    'SELECT id FROM users WHERE telephone = $1 AND phone_verified = TRUE AND id != $2',
    [normalized, req.user.id]
  );
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'Ce numéro est déjà associé à un autre compte' });
  }

  try {
    await twilioClient.verify.v2.services(VERIFY_SID)
      .verifications.create({ to: normalized, channel: 'sms' });

    // Sauvegarder le numéro (non encore vérifié)
    await query(
      'UPDATE users SET telephone = $1, updated_at = NOW() WHERE id = $2',
      [normalized, req.user.id]
    );

    return res.json({ message: 'Code SMS envoyé', telephone: normalized });
  } catch (err) {
    console.error('[phone] Twilio send error:', err.message);
    return res.status(500).json({ error: 'Impossible d\'envoyer le SMS. Vérifiez le numéro.' });
  }
});

// ── POST /api/phone/verify ───────────────────────────────────

router.post('/verify', phoneLimiter, validate(verifySchema), async (req, res) => {
  if (!ensureTwilio(res)) return;

  const { telephone, code } = req.body;
  const normalized = telephone.startsWith('+') ? telephone : `+687${telephone.replace(/^0/, '')}`;

  try {
    const check = await twilioClient.verify.v2.services(VERIFY_SID)
      .verificationChecks.create({ to: normalized, code });

    if (check.status !== 'approved') {
      return res.status(400).json({ error: 'Code incorrect ou expiré' });
    }

    await query(
      `UPDATE users
       SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [normalized, req.user.id]
    );

    return res.json({ message: 'Téléphone vérifié avec succès', verified: true });
  } catch (err) {
    console.error('[phone] Twilio verify error:', err.message);
    return res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// ── DELETE /api/phone ────────────────────────────────────────

router.delete('/', async (req, res) => {
  await query(
    'UPDATE users SET telephone = NULL, phone_verified = FALSE, updated_at = NOW() WHERE id = $1',
    [req.user.id]
  );
  return res.json({ message: 'Numéro de téléphone supprimé' });
});

module.exports = router;
