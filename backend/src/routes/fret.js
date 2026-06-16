'use strict';

const express = require('express');
const Joi = require('joi');

const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { estimateFreightQuote, normalizeFreightInputs } = require('../../../shared/fretEstimator');

const router = express.Router();

const estimateSchema = Joi.object({
  departure: Joi.string().trim().min(2).max(200).required(),
  destination: Joi.string().trim().min(2).max(200).required(),
  volume_m3: Joi.number().min(0.1).max(999.99).required(),
  weight_kg: Joi.number().min(0).max(99999).required(),
  distance_km: Joi.number().min(1).max(9999).optional(),
  urgency: Joi.string().valid('standard', 'express').default('standard'),
});

const requestSchema = Joi.object({
  departure: Joi.string().trim().min(2).max(200).required(),
  destination: Joi.string().trim().min(2).max(200).required(),
  volume_m3: Joi.number().min(0.1).max(999.99).required(),
  weight_kg: Joi.number().min(0).max(99999).required(),
  description: Joi.string().trim().min(10).max(1200).required(),
  object_types: Joi.array().items(Joi.string().trim().min(1).max(80)).max(12).default([]),
  photos: Joi.array().items(Joi.string().trim().uri()).max(12).default([]),
  budget_xpf: Joi.number().integer().min(0).allow(null).optional(),
  urgency: Joi.string().valid('standard', 'express').default('standard'),
});

router.get('/estimate', async (req, res) => {
  const { error, value } = estimateSchema.validate(req.query, { convert: true, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const input = normalizeFreightInputs({
    volume_m3: value.volume_m3,
    weight_kg: value.weight_kg,
    distance_km: value.distance_km,
  });

  const estimate = estimateFreightQuote({
    ...input,
    urgency: value.urgency,
  });

  return res.json({
    data: {
      departure: value.departure,
      destination: value.destination,
      ...estimate,
      summary: `${estimate.volume_m3.toFixed(1)} m3 · ${Math.round(estimate.weight_kg)} kg`,
    },
  });
});

router.post('/requests', authenticate, async (req, res, next) => {
  try {
    const { error, value } = requestSchema.validate(req.body, { convert: true, stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const estimate = estimateFreightQuote({
      volume_m3: value.volume_m3,
      weight_kg: value.weight_kg,
      distance_km: value.distance_km,
      urgency: value.urgency,
    });

    const inserted = await query(
      `INSERT INTO fret_requests
         (author_id, departure, destination, volume_m3, weight_kg, description,
          object_types, photos, budget_xpf, status, quote_amount_xpf)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'quoted', $10)
       RETURNING id, created_at, status, quote_amount_xpf`,
      [
        req.user.id,
        value.departure.trim(),
        value.destination.trim(),
        value.volume_m3,
        value.weight_kg,
        value.description.trim(),
        value.object_types,
        value.photos,
        value.budget_xpf == null ? null : Number(value.budget_xpf),
        estimate.estimated_total_xpf,
      ]
    );

    return res.status(201).json({
      data: {
        ...inserted.rows[0],
        estimate,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/requests/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, departure, destination, volume_m3, weight_kg, description, object_types, photos,
              budget_xpf, status, quote_amount_xpf, created_at, updated_at
       FROM fret_requests
       WHERE author_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map((row) => ({
        id: Number(row.id),
        departure: row.departure,
        destination: row.destination,
        volume_m3: row.volume_m3 == null ? null : Number(row.volume_m3),
        weight_kg: row.weight_kg == null ? null : Number(row.weight_kg),
        description: row.description,
        object_types: Array.isArray(row.object_types) ? row.object_types : [],
        photos: Array.isArray(row.photos) ? row.photos : [],
        budget_xpf: row.budget_xpf == null ? null : Number(row.budget_xpf),
        status: row.status,
        quote_amount_xpf: row.quote_amount_xpf == null ? null : Number(row.quote_amount_xpf),
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
