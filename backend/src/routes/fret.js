'use strict';

const express = require('express');
const Joi = require('joi');

const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const {
  VOLUME_BUCKETS,
  WEIGHT_BUCKETS,
  URGENCY_BUCKETS,
  createFretRequest,
  listMyFretRequests,
  listTransporterDashboard,
  submitFretOffer,
  selectFretOffer,
  markFretDelivered,
  withdrawMyFretOffer,
} = require('../services/fretWorkflowService');
const { estimateFreightQuote } = require('../shared-copy/fretEstimator');

const router = express.Router();

const communeLookupSchema = Joi.object({
  departure_commune_id: Joi.number().integer().positive().required(),
  destination_commune_id: Joi.number().integer().positive().required(),
  volume_bucket: Joi.string().valid(...Object.keys(VOLUME_BUCKETS)).required(),
  weight_bucket: Joi.string().valid(...Object.keys(WEIGHT_BUCKETS)).required(),
  urgency: Joi.string().valid(...Object.keys(URGENCY_BUCKETS)).required(),
});

const requestSchema = communeLookupSchema.keys({
  cargo_type: Joi.string().trim().min(2).max(200).required(),
  budget_max_xpf: Joi.number().integer().min(0).allow(null).optional(),
  description: Joi.string().trim().max(1200).allow('', null).optional(),
  contact_email: Joi.string().email().allow('', null).optional(),
  contact_phone: Joi.string().trim().min(6).max(30).allow('', null).optional(),
});

const offerSchema = Joi.object({
  amount_xpf: Joi.number().integer().positive().required(),
  pickup_date: Joi.date().iso().required(),
  pickup_slot: Joi.string().valid('morning', 'midday', 'afternoon', 'evening').required(),
  message: Joi.string().trim().max(1000).allow('', null).optional(),
});

const selectSchema = Joi.object({
  offer_id: Joi.number().integer().positive().required(),
});

function validatePayload(schema, value) {
  const { error, value: parsed } = schema.validate(value, { convert: true, stripUnknown: true });
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }
  return parsed;
}

router.get('/estimate', async (req, res, next) => {
  try {
    const value = validatePayload(communeLookupSchema, req.query);
    const communes = await query(
      `SELECT id, name, slug
       FROM communes
       WHERE id = ANY($1::int[])`,
      [[value.departure_commune_id, value.destination_commune_id]]
    );

    const communeMap = new Map(communes.rows.map((row) => [Number(row.id), row]));
    const departure = communeMap.get(Number(value.departure_commune_id));
    const destination = communeMap.get(Number(value.destination_commune_id));

    if (!departure || !destination) {
      return res.status(400).json({ error: 'Commune inconnue.' });
    }

    const estimate = estimateFreightQuote({
      departureSlug: departure.slug,
      destinationSlug: destination.slug,
      volumeBucket: value.volume_bucket,
      weightBucket: value.weight_bucket,
      urgency: value.urgency,
    });

    return res.json({
      data: {
        departure_commune: departure,
        destination_commune: destination,
        ...estimate,
        summary: `${departure.name} → ${destination.name} · ${estimate.volume_label} · ${estimate.weight_label}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/requests', authenticate, async (req, res, next) => {
  try {
    const value = validatePayload(requestSchema, req.body);
    const result = await createFretRequest({
      user: req.user,
      payload: value,
    });

    return res.status(201).json({ data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/requests/mine', authenticate, async (req, res, next) => {
  try {
    const data = await listMyFretRequests(req.user.id);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const data = await listTransporterDashboard(req.user.id);
    return res.json({ data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/requests/:id/offers', authenticate, async (req, res, next) => {
  try {
    const value = validatePayload(offerSchema, req.body);
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Demande invalide.' });
    }

    const data = await submitFretOffer({
      userId: req.user.id,
      requestId,
      payload: value,
    });

    return res.status(201).json({ data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/requests/:id/select', authenticate, async (req, res, next) => {
  try {
    const value = validatePayload(selectSchema, req.body);
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Demande invalide.' });
    }

    const data = await selectFretOffer({
      userId: req.user.id,
      requestId,
      offerId: value.offer_id,
      mode: 'manual',
    });

    return res.json({ data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/requests/:id/deliver', authenticate, async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Demande invalide.' });
    }

    const data = await markFretDelivered({
      userId: req.user.id,
      requestId,
    });

    return res.json({ data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.delete('/requests/:id/offers/mine', authenticate, async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Demande invalide.' });
    }

    const data = await withdrawMyFretOffer({
      userId: req.user.id,
      requestId,
    });

    return res.json({ data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
