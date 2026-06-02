'use strict';

const express = require('express');
const Joi = require('joi');

const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const {
  buildNewsletterPreview,
  deleteSubscription,
  ensureSubscription,
  saveSubscription,
  sendNewsletterBatch,
  unsubscribeByToken,
} = require('../services/newsletterService');

const router = express.Router();

const subscriptionSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  frequency: Joi.string().valid('weekly', 'monthly', 'off').optional(),
  categories: Joi.array().items(Joi.string().trim().min(1).max(120)).optional(),
  communes: Joi.array().items(Joi.string().trim().min(1).max(120)).optional(),
});

router.get('/subscription', authenticate, async (req, res, next) => {
  try {
    const subscription = await ensureSubscription(req.user.id);
    return res.json({ data: subscription });
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { error, value } = subscriptionSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const subscription = await saveSubscription(req.user.id, value);
    return res.json({ data: subscription });
  } catch (err) {
    next(err);
  }
});

router.delete('/unsubscribe', async (req, res, next) => {
  try {
    const token = String(req.body?.token || req.query?.token || '').trim();
    if (token) {
      const subscription = await unsubscribeByToken(token);
      if (!subscription) {
        return res.status(404).json({ error: 'Lien de désabonnement introuvable.' });
      }
      return res.json({ data: subscription });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Connexion requise.' });
    }

    const subscription = await deleteSubscription(req.user.id);
    return res.json({ data: subscription });
  } catch (err) {
    next(err);
  }
});

router.get('/preview/:userId', authenticate, async (req, res, next) => {
  try {
    const targetUserId = String(req.params.userId).toLowerCase() === 'me'
      ? req.user.id
      : Number(req.params.userId);

    if (!Number.isFinite(Number(targetUserId)) || Number(targetUserId) <= 0) {
      return res.status(400).json({ error: 'Utilisateur invalide.' });
    }

    if (Number(targetUserId) !== Number(req.user.id) && !req.user.is_admin) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const preview = await buildNewsletterPreview(Number(targetUserId));
    return res.json({ data: preview });
  } catch (err) {
    next(err);
  }
});

router.post('/send', authenticate, async (req, res, next) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Accès réservé à l\'administration.' });
    }
    const result = await sendNewsletterBatch();
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
