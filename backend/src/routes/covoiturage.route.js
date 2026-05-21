'use strict';

const express = require('express');
const Joi = require('joi');
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

const createSchema = Joi.object({
  departure: Joi.string().min(2).max(120).required(),
  destination: Joi.string().min(2).max(120).required(),
  stops: Joi.array().items(Joi.string().min(1).max(120)).default([]),
  ride_date: Joi.string().isoDate().required(),
  ride_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  seats_total: Joi.number().integer().min(1).max(8).required(),
  price_xpf: Joi.number().integer().min(0).required(),
  vehicle: Joi.string().max(120).allow('', null),
  comfort: Joi.string().max(120).allow('', null),
  luggage_allowed: Joi.string().max(120).allow('', null),
  music_allowed: Joi.boolean().default(true),
  no_smoking: Joi.boolean().default(true),
  animals_allowed: Joi.boolean().default(false),
  description: Joi.string().min(10).max(1500).required(),
  departure_commune_id: Joi.number().integer().allow(null),
  destination_commune_id: Joi.number().integer().allow(null),
  trust_score: Joi.number().integer().min(0).max(100).allow(null),
  is_verified_driver: Joi.boolean().default(false),
  expires_at: Joi.string().isoDate().allow(null),
});

const bookingSchema = Joi.object({
  seats: Joi.number().integer().min(1).max(8).default(1),
});

const reviewSchema = Joi.object({
  target_user_id: Joi.number().integer().required(),
  booking_id: Joi.number().integer().allow(null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(2).max(1000).allow('', null),
});

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function computeExpiryDate(rideDate, explicitExpiry) {
  if (explicitExpiry) return new Date(explicitExpiry);
  const base = new Date(`${rideDate}T12:00:00Z`);
  return new Date(base.getTime() + 24 * 60 * 60 * 1000);
}

function mapRide(item) {
  return {
    ...item,
    stops: parseJson(item.stops, []),
    seats_remaining: Math.max(0, Number(item.seats_total || 0) - Number(item.seats_reserved || 0)),
  };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 8)));
    const filters = [];
    const params = [];

    filters.push(`c.status IN ('published', 'full')`);
    filters.push(`c.expires_at > NOW()`);

    if (req.query.departure) {
      params.push(`%${String(req.query.departure).trim()}%`);
      filters.push(`(c.departure ILIKE $${params.length} OR co_dep.name ILIKE $${params.length})`);
    }

    if (req.query.destination) {
      params.push(`%${String(req.query.destination).trim()}%`);
      filters.push(`(c.destination ILIKE $${params.length} OR co_dest.name ILIKE $${params.length})`);
    }

    if (req.query.q) {
      params.push(`%${String(req.query.q).trim()}%`);
      filters.push(`(
        c.departure ILIKE $${params.length}
        OR c.destination ILIKE $${params.length}
        OR c.description ILIKE $${params.length}
        OR c.vehicle ILIKE $${params.length}
      )`);
    }

    if (req.query.status) {
      params.push(String(req.query.status));
      filters.push(`c.status = $${params.length}`);
    }

    const where = `WHERE ${filters.join(' AND ')}`;
    params.push(limit);

    const result = await query(
      `SELECT
         c.id,
         c.user_id,
         c.departure,
         c.destination,
         c.stops,
         c.ride_date,
         c.ride_time,
         c.seats_total,
         c.seats_reserved,
         c.price_xpf,
         c.vehicle,
         c.comfort,
         c.luggage_allowed,
         c.music_allowed,
         c.no_smoking,
         c.animals_allowed,
         c.description,
         c.status,
         c.departure_commune_id,
         c.destination_commune_id,
         c.trust_score,
         c.is_verified_driver,
         c.expires_at,
         c.created_at,
         c.updated_at,
         u.prenom AS driver_prenom,
         u.nom AS driver_nom,
         u.avatar_url AS driver_avatar_url,
         u.phone_verified AS driver_phone_verified,
         u.email_verified AS driver_email_verified,
         u.identity_verified AS driver_identity_verified,
         u.photo_verified AS driver_photo_verified,
         COALESCE(bookings.total_bookings, 0) AS bookings_count,
         COALESCE(reviews.total_reviews, 0) AS reviews_count,
         COALESCE(reviews.avg_rating, 0) AS avg_rating,
         co_dep.name AS departure_commune_name,
         co_dest.name AS destination_commune_name
       FROM covoiturages c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN communes co_dep ON co_dep.id = c.departure_commune_id
       LEFT JOIN communes co_dest ON co_dest.id = c.destination_commune_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_bookings
         FROM covoiturage_bookings b
         WHERE b.covoiturage_id = c.id AND b.status != 'cancelled'
       ) bookings ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM covoiturage_reviews r
         WHERE r.covoiturage_id = c.id
       ) reviews ON TRUE
       ${where}
       ORDER BY c.ride_date ASC, c.ride_time ASC, c.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    return res.json({ data: result.rows.map(mapRide) });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.*,
         COALESCE(bookings.total_bookings, 0) AS bookings_count,
         COALESCE(reviews.total_reviews, 0) AS reviews_count,
         COALESCE(reviews.avg_rating, 0) AS avg_rating,
         co_dep.name AS departure_commune_name,
         co_dest.name AS destination_commune_name
       FROM covoiturages c
       LEFT JOIN communes co_dep ON co_dep.id = c.departure_commune_id
       LEFT JOIN communes co_dest ON co_dest.id = c.destination_commune_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_bookings
         FROM covoiturage_bookings b
         WHERE b.covoiturage_id = c.id AND b.status != 'cancelled'
       ) bookings ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM covoiturage_reviews r
         WHERE r.covoiturage_id = c.id
       ) reviews ON TRUE
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows.map(mapRide) });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideDate = new Date(value.ride_date);
    if (Number.isNaN(rideDate.getTime())) {
      return res.status(400).json({ error: 'Date de trajet invalide.' });
    }

    const expiresAt = computeExpiryDate(value.ride_date, value.expires_at);

    const created = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO covoiturages
           (user_id, departure, destination, stops, ride_date, ride_time, seats_total, seats_reserved,
            price_xpf, vehicle, comfort, luggage_allowed, music_allowed, no_smoking, animals_allowed,
            description, status, departure_commune_id, destination_commune_id, trust_score,
            is_verified_driver, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,$10,$11,$12,$13,$14,$15,'published',$16,$17,$18,$19,$20)
         RETURNING *`,
        [
          req.user.id,
          value.departure.trim(),
          value.destination.trim(),
          JSON.stringify(value.stops || []),
          value.ride_date,
          value.ride_time,
          value.seats_total,
          value.price_xpf,
          value.vehicle?.trim() || null,
          value.comfort?.trim() || null,
          value.luggage_allowed?.trim() || null,
          value.music_allowed,
          value.no_smoking,
          value.animals_allowed,
          value.description.trim(),
          value.departure_commune_id || null,
          value.destination_commune_id || null,
          value.trust_score ?? null,
          Boolean(value.is_verified_driver),
          expiresAt,
        ]
      );

      return inserted.rows[0];
    });

    logger.info('covoiturage_created', { user_id: req.user.id, covoiturage_id: created.id });

    return res.status(201).json({ data: mapRide(created) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/book', authenticate, async (req, res, next) => {
  try {
    const { error, value } = bookingSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await withTransaction(async (client) => {
      const rideRes = await client.query(
        `SELECT * FROM covoiturages WHERE id = $1 FOR UPDATE`,
        [req.params.id]
      );

      const ride = rideRes.rows[0];
      if (!ride) {
        throw Object.assign(new Error('Trajet introuvable.'), { statusCode: 404 });
      }
      if (ride.user_id === req.user.id) {
        throw Object.assign(new Error('Vous ne pouvez pas reserver votre propre trajet.'), { statusCode: 400 });
      }
      if (ride.status !== 'published') {
        throw Object.assign(new Error('Ce trajet ne peut plus etre reserve.'), { statusCode: 400 });
      }

      const seatsRemaining = Math.max(0, Number(ride.seats_total || 0) - Number(ride.seats_reserved || 0));
      if (seatsRemaining < value.seats) {
        throw Object.assign(new Error('Plus assez de places disponibles.'), { statusCode: 400 });
      }

      const existing = await client.query(
        `SELECT id FROM covoiturage_bookings WHERE covoiturage_id = $1 AND user_id = $2 AND status != 'cancelled'`,
        [req.params.id, req.user.id]
      );
      if (existing.rows.length > 0) {
        throw Object.assign(new Error('Vous avez deja reserve ce trajet.'), { statusCode: 400 });
      }

      const booking = await client.query(
        `INSERT INTO covoiturage_bookings (covoiturage_id, user_id, seats, status)
         VALUES ($1, $2, $3, 'confirmed')
         RETURNING *`,
        [req.params.id, req.user.id, value.seats]
      );

      const newReserved = Number(ride.seats_reserved || 0) + value.seats;
      await client.query(
        `UPDATE covoiturages
         SET seats_reserved = $2,
             status = CASE WHEN $2 >= seats_total THEN 'full' ELSE status END,
             updated_at = NOW()
         WHERE id = $1`,
        [req.params.id, newReserved]
      );

      return { booking: booking.rows[0], seatsRemaining: Math.max(0, Number(ride.seats_total || 0) - newReserved) };
    });

    logger.info('covoiturage_booked', { user_id: req.user.id, covoiturage_id: Number(req.params.id) });

    return res.status(201).json({
      data: {
        ...result.booking,
        seats_remaining: result.seatsRemaining,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const rideRes = await query(`SELECT id, user_id, status FROM covoiturages WHERE id = $1`, [req.params.id]);
    const ride = rideRes.rows[0];

    if (!ride) return res.status(404).json({ error: 'Trajet introuvable.' });
    if (ride.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Action non autorisee.' });
    }

    const updated = await query(
      `UPDATE covoiturages
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await query(
      `UPDATE covoiturage_bookings
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE covoiturage_id = $1 AND status = 'confirmed'`,
      [req.params.id]
    );

    logger.info('covoiturage_cancelled', { user_id: req.user.id, covoiturage_id: Number(req.params.id) });

    return res.json({ data: mapRide(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideRes = await query(`SELECT id, user_id, status FROM covoiturages WHERE id = $1`, [req.params.id]);
    const ride = rideRes.rows[0];
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable.' });

    const bookingRes = await query(
      `SELECT id, user_id FROM covoiturage_bookings WHERE id = $1 AND covoiturage_id = $2`,
      [value.booking_id || 0, req.params.id]
    );
    const booking = bookingRes.rows[0] || null;
    const canReview = ride.user_id === req.user.id || (booking && booking.user_id === req.user.id);
    if (!canReview) {
      return res.status(403).json({ error: 'Seuls les participants au trajet peuvent laisser un avis.' });
    }

    const inserted = await query(
      `INSERT INTO covoiturage_reviews
         (covoiturage_id, booking_id, reviewer_id, target_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.id,
        value.booking_id || null,
        req.user.id,
        value.target_user_id,
        value.rating,
        value.comment?.trim() || null,
      ]
    );

    logger.info('covoiturage_review_created', { user_id: req.user.id, covoiturage_id: Number(req.params.id) });

    return res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
