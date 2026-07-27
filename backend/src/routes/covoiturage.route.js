'use strict';

const express = require('express');
const Joi = require('joi');
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { triggerCovoiturageAlerts } = require('../services/covoitAlertService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');
const { getRouteCompatibility, isOnRoute, getRouteStopsBetween, normalizeRouteText } = require('../shared-copy/routesNC');
const {
  sendRideAutoBookingPassengerEmail,
  sendRideAutoBookingDriverEmail,
  sendRideManualRequestEmail,
  sendRideBookingAcceptedPassengerEmail,
  sendRideBookingAcceptedDriverEmail,
  sendRideReviewReminderEmail,
} = require('../services/emailService');

const router = express.Router();

const recurrenceDaysSchema = Joi.array().items(Joi.number().integer().min(0).max(6)).default([]);

const createSchema = Joi.object({
  departure: Joi.string().min(2).max(120).required(),
  destination: Joi.string().min(2).max(120).required(),
  stops: Joi.array().items(Joi.string().min(1).max(120)).default([]),
  ride_date: Joi.string().isoDate().required(),
  ride_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  seats_total: Joi.number().integer().min(1).max(8).required(),
  booking_mode: Joi.string().valid('auto', 'manual').default('auto'),
  price_xpf: Joi.number().integer().min(0).required(),
  vehicle: Joi.string().max(120).allow('', null),
  comfort: Joi.string().max(120).allow('', null),
  luggage_allowed: Joi.string().max(120).allow('', null),
  music_allowed: Joi.boolean().default(true),
  no_smoking: Joi.boolean().default(true),
  animals_allowed: Joi.boolean().default(false),
  women_only: Joi.boolean().default(false),
  description: Joi.string().min(10).max(1500).required(),
  departure_commune_id: Joi.number().integer().allow(null),
  destination_commune_id: Joi.number().integer().allow(null),
  trust_score: Joi.number().integer().min(0).max(100).allow(null),
  is_verified_driver: Joi.boolean().default(false),
  expires_at: Joi.string().isoDate().allow(null),
  recurrence_enabled: Joi.boolean().default(false),
  recurrence_type: Joi.string().valid('none', 'daily', 'weekly').default('none'),
  recurrence_days: recurrenceDaysSchema,
  recurrence_until: Joi.string().isoDate().allow('', null),
  recurrence_count: Joi.number().integer().min(1).max(60).allow(null),
});

const bookingSchema = Joi.object({
  seats: Joi.number().integer().min(1).max(8).default(1),
  message: Joi.string().max(1000).allow('', null),
});

const reviewSchema = Joi.object({
  target_user_id: Joi.number().integer().required(),
  booking_id: Joi.number().integer().allow(null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(2).max(1000).allow('', null),
});

const alertSchema = Joi.object({
  from_commune: Joi.string().max(100).allow('', null),
  to_commune: Joi.string().max(100).allow('', null),
  jour_semaine: Joi.number().integer().min(0).max(6).allow(null),
  heure_min: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  heure_max: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  via_push: Joi.boolean().default(true),
  via_email: Joi.boolean().default(false),
  active: Joi.boolean().default(true),
});

const updateAlertSchema = Joi.object({
  from_commune: Joi.string().max(100).allow('', null),
  to_commune: Joi.string().max(100).allow('', null),
  jour_semaine: Joi.number().integer().min(0).max(6).allow(null),
  heure_min: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  heure_max: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  via_push: Joi.boolean(),
  via_email: Joi.boolean(),
  active: Joi.boolean(),
}).min(1);

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

function parseUtcMiddayDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeRecurrenceDays(days) {
  return [...new Set((Array.isArray(days) ? days : []).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b);
}

function buildRecurrenceDates({ rideDate, recurrenceType, recurrenceDays, recurrenceUntil, recurrenceCount }) {
  const baseDate = parseUtcMiddayDate(rideDate);
  if (!baseDate) return [rideDate];

  const maxOccurrences = Number.isFinite(Number(recurrenceCount)) ? Math.min(Math.max(1, Number(recurrenceCount)), 60) : null;
  const untilDate = recurrenceUntil ? parseUtcMiddayDate(recurrenceUntil) : addUtcDays(baseDate, 30);
  const dates = [formatUtcDate(baseDate)];

  if (!untilDate || untilDate.getTime() < baseDate.getTime()) {
    return dates;
  }

  if (recurrenceType === 'daily') {
    let cursor = addUtcDays(baseDate, 1);
    while (cursor.getTime() <= untilDate.getTime() && (!maxOccurrences || dates.length < maxOccurrences)) {
      dates.push(formatUtcDate(cursor));
      cursor = addUtcDays(cursor, 1);
    }
    return dates;
  }

  if (recurrenceType === 'weekly') {
    const selectedDays = recurrenceDays.length > 0 ? recurrenceDays : [baseDate.getUTCDay()];
    const allowedDays = new Set(selectedDays);
    let cursor = addUtcDays(baseDate, 1);
    while (cursor.getTime() <= untilDate.getTime() && (!maxOccurrences || dates.length < maxOccurrences)) {
      if (allowedDays.has(cursor.getUTCDay())) {
        dates.push(formatUtcDate(cursor));
      }
      cursor = addUtcDays(cursor, 1);
    }
  }

  return dates;
}

function mapRide(item) {
  return {
    ...item,
    stops: parseJson(item.stops, []),
    booking_mode: item.booking_mode || 'auto',
    recurrence_type: item.recurrence_type || 'none',
    recurrence_days: parseJson(item.recurrence_days, []),
    recurrence_until: item.recurrence_until || null,
    recurrence_count: item.recurrence_count == null ? null : Number(item.recurrence_count),
    recurrence_parent_id: item.recurrence_parent_id == null ? null : Number(item.recurrence_parent_id),
    seats_remaining: Number.isFinite(Number(item.seats_remaining))
      ? Math.max(0, Number(item.seats_remaining))
      : Math.max(0, Number(item.seats_total || 0) - Number(item.seats_reserved || 0)),
  };
}

function enhanceRideForSearch(ride, searchFrom, searchTo) {
  const compatibility = getRouteCompatibility(ride.departure, ride.destination, searchFrom, searchTo);
  return {
    ...ride,
    is_direct: Boolean(searchFrom && searchTo)
      ? normalizeRouteText(ride.departure) === normalizeRouteText(searchFrom)
        && normalizeRouteText(ride.destination) === normalizeRouteText(searchTo)
      : true,
    via_stops: compatibility.via_stops,
    route_name: compatibility.route_name,
  };
}

function buildRideLabel(ride) {
  return `${ride.departure} → ${ride.destination}`;
}

function mapBookingRow(row, currentUserId) {
  if (!row) return null;
  const isDriver = Number(row.driver_id) === Number(currentUserId);
  const otherUser = isDriver
    ? {
        id: row.passenger_id,
        prenom: row.passenger_prenom,
        nom: row.passenger_nom,
        avatar_url: row.passenger_avatar_url,
        trust_score: row.passenger_trust_score,
      }
    : {
        id: row.driver_id,
        prenom: row.driver_prenom,
        nom: row.driver_nom,
        avatar_url: row.driver_avatar_url,
        trust_score: row.driver_trust_score,
      };

  return {
    id: row.booking_id,
    ride_id: row.ride_id,
    role: isDriver ? 'driver' : 'passenger',
    status: row.booking_status,
    booking_mode: row.booking_mode,
    message: row.booking_message,
    seats: Number(row.booking_seats || 1),
    created_at: row.booking_created_at,
    responded_at: row.booking_responded_at,
    expires_at: row.booking_expires_at,
    review_id: row.review_id || null,
    review_exists: Boolean(row.review_id),
    is_expired: row.booking_status === 'pending' && row.booking_expires_at ? new Date(row.booking_expires_at).getTime() < Date.now() : false,
    ride: {
      id: row.ride_id,
      departure: row.departure,
      destination: row.destination,
      ride_date: row.ride_date,
      ride_time: row.ride_time,
      price_xpf: row.price_xpf,
      seats_total: row.seats_total,
      seats_remaining: row.seats_remaining,
      booking_mode: row.ride_booking_mode || row.booking_mode || 'auto',
      status: row.ride_status,
      driver_id: row.driver_id,
      driver_prenom: row.driver_prenom,
      driver_nom: row.driver_nom,
      driver_avatar_url: row.driver_avatar_url,
      driver_trust_score: row.driver_trust_score,
    },
    other_user: otherUser,
  };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 8)));
    const searchFrom = String(req.query.departure || '').trim();
    const searchTo = String(req.query.destination || '').trim();
    const filters = [];
    const params = [];

    filters.push(`c.status IN ('published', 'full')`);
    filters.push(`c.expires_at > NOW()`);

    if (searchFrom && !searchTo) {
      params.push(`%${String(req.query.departure).trim()}%`);
      filters.push(`(c.departure ILIKE $${params.length} OR co_dep.name ILIKE $${params.length})`);
    }

    if (searchTo && !searchFrom) {
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

    if (String(req.query.women_only) === 'true') {
      filters.push(`COALESCE(c.women_only, FALSE) = TRUE`);
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
         c.seats_remaining,
         c.booking_mode,
         c.recurrence_type,
         c.recurrence_days,
         c.recurrence_until,
         c.recurrence_count,
         c.recurrence_parent_id,
         c.price_xpf,
         c.vehicle,
         c.comfort,
         c.luggage_allowed,
         c.music_allowed,
         c.no_smoking,
         c.animals_allowed,
         c.women_only,
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
         FROM ride_bookings b
         WHERE b.ride_id = c.id AND b.status IN ('auto_confirmed','accepted','pending')
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

    let rides = result.rows.map(mapRide);
    if (searchFrom && searchTo) {
      rides = rides.filter((ride) => isOnRoute(ride.departure, ride.destination, searchFrom, searchTo));
      rides = rides
        .map((ride) => enhanceRideForSearch(ride, searchFrom, searchTo))
        .sort((a, b) => {
          if (a.is_direct !== b.is_direct) return a.is_direct ? -1 : 1;
          return Number(new Date(`${a.ride_date || ''}T${a.ride_time || '00:00'}`)) - Number(new Date(`${b.ride_date || ''}T${b.ride_time || '00:00'}`));
        });
    } else {
      rides = rides.map((ride) => enhanceRideForSearch(ride, searchFrom, searchTo));
    }

    return res.json({ data: rides });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.*,
         c.seats_remaining,
         c.booking_mode,
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
         FROM ride_bookings b
         WHERE b.ride_id = c.id AND b.status IN ('auto_confirmed','accepted','pending')
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

router.get('/drivers/:id/profile', async (req, res, next) => {
  try {
    const driverId = Number(req.params.id);
    if (!Number.isFinite(driverId) || driverId <= 0) {
      return res.status(400).json({ error: 'Conducteur invalide.' });
    }

    const profileRes = await query(
      `SELECT
         u.id,
         u.prenom,
         u.nom,
         u.avatar_url,
         u.bio,
         u.member_since,
         COALESCE(u.rides_as_driver, 0) AS rides_as_driver,
         COALESCE(u.rides_as_passenger, 0) AS rides_as_passenger,
         COALESCE(u.trust_score, 100) AS trust_score,
         CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
         u.nb_avis,
         u.note_moyenne,
         u.created_at,
         u.phone_verified,
         u.email_verified,
         com.name AS commune_name,
         prov.name AS province_name,
         COALESCE((
           SELECT COUNT(*)
           FROM covoiturages c
           WHERE c.user_id = u.id AND c.deleted_at IS NULL
         ), 0) AS rides_total,
         COALESCE((
           SELECT COUNT(*)
           FROM covoiturages c
           WHERE c.user_id = u.id AND c.deleted_at IS NULL AND c.status IN ('published', 'full')
         ), 0) AS rides_active,
         COALESCE((
           SELECT COUNT(*)
           FROM covoiturage_reviews r
           WHERE r.target_user_id = u.id
         ), 0) AS reviews_count,
         COALESCE((
           SELECT ROUND(AVG(r.rating)::numeric, 1)
           FROM covoiturage_reviews r
           WHERE r.target_user_id = u.id
         ), 0) AS avg_rating,
         (
           SELECT c.vehicle
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
             AND c.vehicle IS NOT NULL
             AND c.vehicle <> ''
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS vehicle,
         (
           SELECT c.comfort
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
             AND c.comfort IS NOT NULL
             AND c.comfort <> ''
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS comfort,
         (
           SELECT c.luggage_allowed
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
             AND c.luggage_allowed IS NOT NULL
             AND c.luggage_allowed <> ''
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS luggage_allowed,
         (
           SELECT c.seats_total
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS vehicle_capacity,
         (
           SELECT c.music_allowed
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS music_allowed,
         (
           SELECT c.no_smoking
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS no_smoking,
         (
           SELECT c.animals_allowed
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS animals_allowed
       FROM users u
       LEFT JOIN communes com ON com.id = u.commune_id
       LEFT JOIN provinces prov ON prov.id = com.province_id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id, com.name, prov.name`,
      [driverId]
    );

    const profile = profileRes.rows[0];
    if (!profile) {
      return res.status(404).json({ error: 'Conducteur introuvable.' });
    }

    const ridesRes = await query(
      `SELECT
         c.*,
         c.seats_total,
         COALESCE(c.seats_remaining, GREATEST(c.seats_total - c.seats_reserved, 0)) AS seats_remaining,
         c.booking_mode,
         COALESCE(bookings.total_bookings, 0) AS bookings_count,
         COALESCE(reviews.total_reviews, 0) AS reviews_count,
         COALESCE(reviews.avg_rating, 0) AS avg_rating,
         co_dep.name AS departure_commune_name,
         co_dest.name AS destination_commune_name,
         u.prenom AS driver_prenom,
         u.nom AS driver_nom,
         u.avatar_url AS driver_avatar_url,
         u.trust_score AS driver_trust_score
       FROM covoiturages c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN communes co_dep ON co_dep.id = c.departure_commune_id
       LEFT JOIN communes co_dest ON co_dest.id = c.destination_commune_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_bookings
         FROM ride_bookings b
         WHERE b.ride_id = c.id AND b.status IN ('auto_confirmed', 'accepted', 'pending')
       ) bookings ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM covoiturage_reviews r
         WHERE r.covoiturage_id = c.id
       ) reviews ON TRUE
       WHERE c.user_id = $1
         AND c.deleted_at IS NULL
       ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
       LIMIT 8`,
      [driverId]
    );

    const reviewsRes = await query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         rev.prenom AS reviewer_prenom,
         rev.nom AS reviewer_nom,
         rev.avatar_url AS reviewer_avatar_url,
         c.id AS ride_id,
         c.departure,
         c.destination,
         c.ride_date,
         c.ride_time
       FROM covoiturage_reviews r
       LEFT JOIN users rev ON rev.id = r.reviewer_id
       LEFT JOIN covoiturages c ON c.id = r.covoiturage_id
       WHERE r.target_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 12`,
      [driverId]
    );

    const mappedRides = ridesRes.rows.map(mapRide);

    return res.json({
      data: {
        profile,
        vehicle: {
          vehicle: profile.vehicle,
          vehicle_description: profile.comfort ?? null,
          vehicle_capacity: profile.vehicle_capacity != null ? Number(profile.vehicle_capacity) : null,
          luggage_allowed: profile.luggage_allowed ?? null,
          music_allowed: profile.music_allowed,
          no_smoking: profile.no_smoking,
          animals_allowed: profile.animals_allowed,
        },
        rides: mappedRides,
        latest_ride: mappedRides[0] || null,
        reviews: reviewsRes.rows,
      },
    });
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
    const recurrenceEnabled = Boolean(value.recurrence_enabled) && value.recurrence_type !== 'none';
    const recurrenceType = recurrenceEnabled ? value.recurrence_type : 'none';
    const recurrenceDays = recurrenceEnabled ? normalizeRecurrenceDays(value.recurrence_days) : [];
    const recurrenceBaseDate = parseUtcMiddayDate(value.ride_date) || new Date(`${value.ride_date}T12:00:00Z`);
    const recurrenceUntil = recurrenceEnabled
      ? value.recurrence_until || formatUtcDate(addUtcDays(recurrenceBaseDate, 30))
      : null;
    const recurrenceCount = Number.isFinite(Number(value.recurrence_count)) ? Number(value.recurrence_count) : null;
    const recurrenceDates = recurrenceEnabled
      ? buildRecurrenceDates({
          rideDate: value.ride_date,
          recurrenceType,
          recurrenceDays,
          recurrenceUntil,
          recurrenceCount,
        })
      : [value.ride_date];

    const created = await withTransaction(async (client) => {
      const insertRide = async (rideDateValue, recurrenceParentId = null) => {
        const rideExpiresAt = computeExpiryDate(rideDateValue, value.expires_at);
        const inserted = await client.query(
          `INSERT INTO covoiturages
             (user_id, departure, destination, stops, ride_date, ride_time, seats_total, seats_reserved,
              seats_remaining, booking_mode, recurrence_type, recurrence_days, recurrence_until, recurrence_count,
              recurrence_parent_id, price_xpf, vehicle, comfort, luggage_allowed, music_allowed, no_smoking, animals_allowed,
              women_only, description, status, departure_commune_id, destination_commune_id, trust_score,
              is_verified_driver, expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,0,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'published',$23,$24,$25,$26,$27)
           RETURNING *`,
          [
            req.user.id,
            value.departure.trim(),
            value.destination.trim(),
            JSON.stringify(value.stops || []),
            rideDateValue,
            value.ride_time,
            value.seats_total,
            value.booking_mode,
            recurrenceType,
            JSON.stringify(recurrenceDays),
            recurrenceUntil,
            recurrenceCount,
            recurrenceParentId,
            value.price_xpf,
            value.vehicle?.trim() || null,
            value.comfort?.trim() || null,
            value.luggage_allowed?.trim() || null,
            value.music_allowed,
            value.no_smoking,
            value.animals_allowed,
            Boolean(value.women_only),
            value.description.trim(),
            value.departure_commune_id || null,
            value.destination_commune_id || null,
            value.trust_score ?? null,
            Boolean(value.is_verified_driver),
            rideExpiresAt,
          ]
        );

        return inserted.rows[0];
      };

      const baseRide = await insertRide(recurrenceDates[0], null);
      if (recurrenceEnabled && recurrenceDates.length > 1) {
        await client.query(`UPDATE covoiturages SET recurrence_parent_id = $2 WHERE id = $1`, [baseRide.id, baseRide.id]);
        baseRide.recurrence_parent_id = baseRide.id;
        for (const rideDateValue of recurrenceDates.slice(1)) {
          await insertRide(rideDateValue, baseRide.id);
        }
      }

      return baseRide;
    });

    logger.info('covoiturage_created', {
      user_id: req.user.id,
      covoiturage_id: created.id,
      occurrences: recurrenceDates.length,
    });
    await query(
      `UPDATE users
       SET rides_as_driver = COALESCE(rides_as_driver, 0) + $2
       WHERE id = $1`,
      [req.user.id, recurrenceDates.length]
    ).catch(() => {});
    void triggerCovoiturageAlerts(created).catch((error) => {
      logger.warn('covoiturage_alert_trigger_failed', {
        covoiturage_id: created.id,
        error: error?.message || String(error),
      });
    });

    return res.status(201).json({ data: mapRide(created) });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max,
              via_push, via_email, active, last_notified_at, created_at
       FROM covoit_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/alerts', authenticate, async (req, res, next) => {
  try {
    const { error, value } = alertSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM covoit_alerts WHERE user_id = $1 AND active = true`,
      [req.user.id]
    );
    const count = Number(countResult.rows[0]?.total || 0);
    if (count >= 3) {
      return res.status(429).json({ error: 'Vous pouvez créer jusqu’à 3 alertes trajet.' });
    }

    const inserted = await query(
      `INSERT INTO covoit_alerts
         (user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max, via_push, via_email, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max,
                 via_push, via_email, active, last_notified_at, created_at`,
      [
        req.user.id,
        value.from_commune?.trim() || null,
        value.to_commune?.trim() || null,
        value.jour_semaine ?? null,
        value.heure_min || null,
        value.heure_max || null,
        Boolean(value.via_push),
        Boolean(value.via_email),
        Boolean(value.active),
      ]
    );

    return res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/alerts/:id', authenticate, async (req, res, next) => {
  try {
    const { error, value } = updateAlertSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fields = [];
    const params = [];
    let index = 1;

    for (const key of ['from_commune', 'to_commune', 'jour_semaine', 'heure_min', 'heure_max', 'via_push', 'via_email', 'active']) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      fields.push(`${key} = $${index++}`);
      const raw = value[key];
      if (typeof raw === 'string') {
        params.push(raw.trim() || null);
      } else {
        params.push(raw);
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour.' });
    }

    fields.push('updated_at = NOW()');
    params.push(req.params.id, req.user.id);

    const result = await query(
      `UPDATE covoit_alerts
       SET ${fields.join(', ')}
       WHERE id = $${index++} AND user_id = $${index}
       RETURNING id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max,
                 via_push, via_email, active, last_notified_at, created_at`,
      params
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Alerte introuvable.' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/alerts/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM covoit_alerts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Alerte introuvable.' });
    }

    return res.json({ message: 'Alerte supprimée.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/book', authenticate, async (req, res, next) => {
  try {
    const { error, value } = bookingSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideId = Number(req.params.id);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return res.status(400).json({ error: 'Trajet invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const rideRes = await client.query(
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
         c.seats_remaining,
         c.booking_mode,
         c.recurrence_type,
         c.recurrence_days,
         c.recurrence_until,
         c.recurrence_count,
         c.recurrence_parent_id,
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
           u.email AS driver_email,
           u.avatar_url AS driver_avatar_url,
           u.trust_score AS driver_trust_score
         FROM covoiturages c
         JOIN users u ON u.id = c.user_id
         WHERE c.id = $1
         FOR UPDATE`,
        [rideId]
      );

      const ride = rideRes.rows[0];
      if (!ride) {
        throw Object.assign(new Error('Trajet introuvable.'), { statusCode: 404 });
      }
      if (Number(ride.user_id) === Number(req.user.id)) {
        throw Object.assign(new Error('Vous ne pouvez pas réserver votre propre trajet.'), { statusCode: 400 });
      }
      if (!['published', 'full'].includes(ride.status)) {
        throw Object.assign(new Error('Ce trajet ne peut plus être réservé.'), { statusCode: 400 });
      }

      const seatsRemaining = Number.isFinite(Number(ride.seats_remaining))
        ? Math.max(0, Number(ride.seats_remaining))
        : Math.max(0, Number(ride.seats_total || 0) - Number(ride.seats_reserved || 0));
      if (seatsRemaining < value.seats) {
        throw Object.assign(new Error('Plus assez de places disponibles.'), { statusCode: 400 });
      }

      const existing = await client.query(
        `SELECT id FROM ride_bookings WHERE ride_id = $1 AND passenger_id = $2`,
        [rideId, req.user.id]
      );
      if (existing.rows.length > 0) {
        throw Object.assign(new Error('Vous avez déjà réservé ce trajet.'), { statusCode: 400 });
      }

      const passengerRes = await client.query(
        `SELECT id, prenom, nom, email, avatar_url, trust_score
         FROM users
         WHERE id = $1`,
        [req.user.id]
      );
      const passenger = passengerRes.rows[0];
      if (!passenger) {
        throw Object.assign(new Error('Utilisateur introuvable.'), { statusCode: 404 });
      }

      const bookingMode = String(ride.booking_mode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto';
      const bookingStatus = bookingMode === 'manual' ? 'pending' : 'auto_confirmed';

      const bookingRes = await client.query(
        `INSERT INTO ride_bookings
           (ride_id, passenger_id, status, booking_mode, message, seats, responded_at)
         VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 THEN NOW() ELSE NULL END)
         RETURNING *`,
        [
          rideId,
          req.user.id,
          bookingStatus,
          bookingMode,
          value.message?.trim() || null,
          value.seats,
          bookingMode === 'auto',
        ]
      );

      let updatedRide = ride;
      if (bookingMode === 'auto') {
        const autoUpdated = await client.query(
          `UPDATE covoiturages
           SET seats_reserved = seats_reserved + $2,
               seats_remaining = GREATEST(COALESCE(seats_remaining, seats_total) - $2, 0),
               status = CASE
                 WHEN GREATEST(COALESCE(seats_remaining, seats_total) - $2, 0) = 0 THEN 'full'
                 ELSE status
               END,
               updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [rideId, value.seats]
        );
        updatedRide = autoUpdated.rows[0] || ride;

        await client.query(
          `UPDATE users
           SET rides_as_passenger = COALESCE(rides_as_passenger, 0) + 1
           WHERE id = $1`,
          [req.user.id]
        );
      }

      return {
        booking: bookingRes.rows[0],
        ride: updatedRide,
        passenger,
        driver: {
          id: ride.user_id,
          prenom: ride.driver_prenom,
          nom: ride.driver_nom,
          email: ride.driver_email,
          avatar_url: ride.driver_avatar_url,
          trust_score: ride.driver_trust_score,
        },
        seatsRemaining: bookingMode === 'auto'
          ? Math.max(0, Number(updatedRide.seats_remaining ?? (updatedRide.seats_total - updatedRide.seats_reserved)))
          : seatsRemaining,
        bookingMode,
      };
    });

    const rideLabel = buildRideLabel(result.ride);
    const rideDetails = {
      departure: result.ride.departure,
      destination: result.ride.destination,
      ride_date: result.ride.ride_date,
      ride_time: result.ride.ride_time,
      seats: result.booking.seats,
      price_xpf: result.ride.price_xpf,
      driverPrenom: result.driver.prenom,
      passengerPrenom: result.passenger.prenom,
    };

    if (result.bookingMode === 'auto') {
      await createNotification(result.ride.user_id, {
        type: 'ride_booking_auto',
        title: 'Nouvelle réservation !',
        body: `${result.passenger.prenom || 'Un passager'} a réservé une place pour ${rideLabel}`,
        href: '/covoiturage/reservations',
      }).catch(() => {});
      await createNotification(req.user.id, {
        type: 'ride_booking_auto_confirmed',
        title: '✅ Place réservée',
        body: `Votre place est confirmée sur ${rideLabel}`,
        href: '/covoiturage/reservations',
      }).catch(() => {});

      await sendPushToUser(result.ride.user_id, {
        title: 'Nouvelle réservation !',
        body: `${result.passenger.prenom || 'Un passager'} a réservé une place pour ${rideLabel}`,
        data: { type: 'ride_booking_auto', booking_id: result.booking.id, ride_id: result.ride.id },
      }).catch(() => {});
      await sendPushToUser(req.user.id, {
        title: '✅ Place réservée',
        body: `Votre place est confirmée sur ${rideLabel}`,
        data: { type: 'ride_booking_auto_confirmed', booking_id: result.booking.id, ride_id: result.ride.id },
      }).catch(() => {});

      await sendRideAutoBookingPassengerEmail(
        result.passenger.email,
        result.passenger.prenom || 'Bonjour',
        rideDetails,
        result.passenger.id
      ).catch(() => {});
      await sendRideAutoBookingDriverEmail(
        result.driver.email,
        result.driver.prenom || 'Bonjour',
        rideDetails,
        result.driver.id
      ).catch(() => {});
    } else {
      await createNotification(result.ride.user_id, {
        type: 'ride_booking_requested',
        title: 'Demande de réservation !',
        body: `${result.passenger.prenom || 'Un passager'} demande une place — vous avez 24h pour accepter.`,
        href: '/covoiturage/reservations',
      }).catch(() => {});

      await sendPushToUser(result.ride.user_id, {
        title: 'Demande de réservation !',
        body: `${result.passenger.prenom || 'Un passager'} demande une place — vous avez 24h pour accepter.`,
        data: { type: 'ride_booking_requested', booking_id: result.booking.id, ride_id: result.ride.id },
      }).catch(() => {});

      await sendRideManualRequestEmail(
        result.driver.email,
        result.driver.prenom || 'Bonjour',
        rideDetails,
        result.driver.id
      ).catch(() => {});
    }

    logger.info('covoiturage_booked', {
      user_id: req.user.id,
      covoiturage_id: rideId,
      booking_mode: result.bookingMode,
      booking_id: result.booking.id,
    });

    return res.status(201).json({
      data: {
        id: result.booking.id,
        ride_id: rideId,
        status: result.booking.status,
        booking_mode: result.booking.booking_mode,
        seats: result.booking.seats,
        message: result.booking.message,
        expires_at: result.booking.expires_at,
        responded_at: result.booking.responded_at,
        seats_remaining: result.seatsRemaining,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reservations/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         b.id AS booking_id,
         b.ride_id,
         b.status AS booking_status,
         b.booking_mode,
         b.message AS booking_message,
         b.seats AS booking_seats,
         b.created_at AS booking_created_at,
         b.responded_at AS booking_responded_at,
         b.expires_at AS booking_expires_at,
         c.user_id AS driver_id,
         c.departure,
         c.destination,
         c.ride_date,
         c.ride_time,
         c.price_xpf,
         c.seats_total,
         c.seats_reserved,
         COALESCE(c.seats_remaining, GREATEST(c.seats_total - c.seats_reserved, 0)) AS seats_remaining,
         c.booking_mode AS ride_booking_mode,
         c.status AS ride_status,
         d.prenom AS driver_prenom,
         d.nom AS driver_nom,
         d.avatar_url AS driver_avatar_url,
         d.trust_score AS driver_trust_score,
         p.id AS passenger_id,
         p.prenom AS passenger_prenom,
         p.nom AS passenger_nom,
         p.avatar_url AS passenger_avatar_url,
         p.trust_score AS passenger_trust_score,
         review.id AS review_id,
         CASE WHEN c.user_id = $1 THEN 'driver' ELSE 'passenger' END AS role,
         CASE WHEN c.user_id = $1 THEN p.id ELSE d.id END AS other_user_id,
         CASE WHEN c.user_id = $1 THEN p.prenom ELSE d.prenom END AS other_user_prenom,
         CASE WHEN c.user_id = $1 THEN p.nom ELSE d.nom END AS other_user_nom,
         CASE WHEN c.user_id = $1 THEN p.avatar_url ELSE d.avatar_url END AS other_user_avatar_url,
         CASE WHEN c.user_id = $1 THEN p.trust_score ELSE d.trust_score END AS other_user_trust_score
       FROM ride_bookings b
       JOIN covoiturages c ON c.id = b.ride_id
       JOIN users d ON d.id = c.user_id
       JOIN users p ON p.id = b.passenger_id
       LEFT JOIN LATERAL (
         SELECT r.id
         FROM covoiturage_reviews r
         WHERE r.booking_id = b.id
           AND r.reviewer_id = $1
           AND r.target_user_id = CASE WHEN c.user_id = $1 THEN p.id ELSE d.id END
         LIMIT 1
       ) review ON TRUE
       WHERE b.passenger_id = $1 OR c.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows.map((row) => mapBookingRow(row, req.user.id)) });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/accept', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT
           b.id AS booking_id,
           b.ride_id,
           b.passenger_id,
           b.status AS booking_status,
           b.booking_mode,
           b.message AS booking_message,
           b.seats AS booking_seats,
           b.created_at AS booking_created_at,
           b.responded_at AS booking_responded_at,
           b.expires_at AS booking_expires_at,
           c.id AS ride_id,
           c.user_id AS driver_id,
           c.departure,
           c.destination,
           c.ride_date,
           c.ride_time,
           c.price_xpf,
           c.seats_total,
           c.seats_reserved,
           c.seats_remaining,
           c.booking_mode AS ride_booking_mode,
           c.status AS ride_status,
           d.prenom AS driver_prenom,
           d.nom AS driver_nom,
           d.email AS driver_email,
           d.avatar_url AS driver_avatar_url,
           d.trust_score AS driver_trust_score,
           p.prenom AS passenger_prenom,
           p.nom AS passenger_nom,
           p.email AS passenger_email,
           p.avatar_url AS passenger_avatar_url,
           p.trust_score AS passenger_trust_score
         FROM ride_bookings b
         JOIN covoiturages c ON c.id = b.ride_id
         JOIN users d ON d.id = c.user_id
         JOIN users p ON p.id = b.passenger_id
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        throw Object.assign(new Error('Réservation introuvable.'), { statusCode: 404 });
      }

      if (Number(booking.driver_id) !== Number(req.user.id) && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (booking.booking_status !== 'pending') {
        throw Object.assign(new Error('Cette demande ne peut plus être acceptée.'), { statusCode: 400 });
      }

      if (booking.booking_mode !== 'manual') {
        throw Object.assign(new Error('Seules les demandes manuelles peuvent être validées.'), { statusCode: 400 });
      }

      if (booking.booking_expires_at && new Date(booking.booking_expires_at).getTime() < Date.now()) {
        throw Object.assign(new Error('Cette demande a expiré.'), { statusCode: 400 });
      }

      const newSeatsReserved = Number(booking.seats_reserved || 0) + Number(booking.booking_seats || 1);
      const updatedRideRes = await client.query(
        `UPDATE covoiturages
         SET seats_reserved = $2,
             seats_remaining = GREATEST(COALESCE(seats_remaining, seats_total) - $3, 0),
             status = CASE
               WHEN GREATEST(COALESCE(seats_remaining, seats_total) - $3, 0) = 0 THEN 'full'
               ELSE status
             END,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [booking.ride_id, newSeatsReserved, Number(booking.booking_seats || 1)]
      );

      await client.query(
        `UPDATE ride_bookings
         SET status = 'accepted',
             responded_at = NOW()
         WHERE id = $1`,
        [bookingId]
      );

      await client.query(
        `UPDATE users
         SET rides_as_passenger = COALESCE(rides_as_passenger, 0) + 1
         WHERE id = $1`,
        [booking.passenger_id]
      );

      return {
        booking,
        ride: updatedRideRes.rows[0] || booking,
        driver: {
          id: booking.driver_id,
          prenom: booking.driver_prenom,
          nom: booking.driver_nom,
          email: booking.driver_email,
          avatar_url: booking.driver_avatar_url,
          trust_score: booking.driver_trust_score,
        },
        passenger: {
          id: booking.passenger_id,
          prenom: booking.passenger_prenom,
          nom: booking.passenger_nom,
          email: booking.passenger_email,
          avatar_url: booking.passenger_avatar_url,
          trust_score: booking.passenger_trust_score,
        },
      };
    });

    const rideLabel = buildRideLabel(result.ride);
    const details = {
      departure: result.ride.departure,
      destination: result.ride.destination,
      ride_date: result.ride.ride_date,
      ride_time: result.ride.ride_time,
      seats: result.booking.booking_seats,
      price_xpf: result.ride.price_xpf,
      driverPrenom: result.driver.prenom,
      passengerPrenom: result.passenger.prenom,
    };

    await createNotification(result.passenger.id, {
      type: 'ride_booking_accepted',
      title: '✅ Réservation acceptée !',
      body: `${result.driver.prenom || 'Le conducteur'} vous attend sur ${rideLabel}`,
      href: '/covoiturage/reservations',
    }).catch(() => {});
    await createNotification(result.driver.id, {
      type: 'ride_booking_accepted_driver',
      title: '✅ Réservation confirmée',
      body: `Vous avez accepté la réservation de ${result.passenger.prenom || 'ce passager'} sur ${rideLabel}`,
      href: '/covoiturage/reservations',
    }).catch(() => {});

    await sendPushToUser(result.passenger.id, {
      title: '✅ Réservation acceptée !',
      body: `${result.driver.prenom || 'Le conducteur'} vous attend.`,
      data: { type: 'ride_booking_accepted', booking_id: result.booking.booking_id, ride_id: result.booking.ride_id },
    }).catch(() => {});
    await sendPushToUser(result.driver.id, {
      title: '✅ Réservation confirmée',
      body: `Vous avez accepté la réservation de ${result.passenger.prenom || 'ce passager'}.`,
      data: { type: 'ride_booking_accepted_driver', booking_id: result.booking.booking_id, ride_id: result.booking.ride_id },
    }).catch(() => {});

    await sendRideBookingAcceptedPassengerEmail(
      result.passenger.email,
      result.passenger.prenom || 'Bonjour',
      details,
      result.passenger.id
    ).catch(() => {});
    await sendRideBookingAcceptedDriverEmail(
      result.driver.email,
      result.driver.prenom || 'Bonjour',
      details,
      result.driver.id
    ).catch(() => {});

    return res.json({ data: { booking_id: bookingId, status: 'accepted' } });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/refuse', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT
           b.id AS booking_id,
           b.ride_id,
           b.passenger_id,
           b.status AS booking_status,
           b.booking_mode,
           b.message AS booking_message,
           b.seats AS booking_seats,
           b.expires_at AS booking_expires_at,
           c.id AS ride_id,
           c.user_id AS driver_id,
           c.departure,
           c.destination,
           c.ride_date,
           c.ride_time,
           c.price_xpf,
           d.prenom AS driver_prenom,
           d.email AS driver_email,
           p.prenom AS passenger_prenom,
           p.email AS passenger_email
         FROM ride_bookings b
         JOIN covoiturages c ON c.id = b.ride_id
         JOIN users d ON d.id = c.user_id
         JOIN users p ON p.id = b.passenger_id
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        throw Object.assign(new Error('Réservation introuvable.'), { statusCode: 404 });
      }

      if (Number(booking.driver_id) !== Number(req.user.id) && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (booking.booking_status !== 'pending') {
        throw Object.assign(new Error('Cette demande ne peut plus être refusée.'), { statusCode: 400 });
      }

      await client.query(
        `UPDATE ride_bookings
         SET status = 'refused',
             responded_at = NOW()
         WHERE id = $1`,
        [bookingId]
      );

      return booking;
    });

    await createNotification(result.passenger_id, {
      type: 'ride_booking_refused',
      title: '❌ Proposition refusée',
      body: `${result.driver_prenom || 'Le conducteur'} n'a pas pu accepter votre demande.`,
      href: '/covoiturage/reservations',
    }).catch(() => {});

    await sendPushToUser(result.passenger_id, {
      title: '❌ Proposition refusée',
      body: `${result.driver_prenom || 'Le conducteur'} n'a pas pu accepter votre demande.`,
      data: { type: 'ride_booking_refused', booking_id: result.booking_id, ride_id: result.ride_id },
    }).catch(() => {});

    return res.json({ data: { booking_id: bookingId, status: 'refused' } });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/cancel', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT
           b.id AS booking_id,
           b.ride_id,
           b.passenger_id,
           b.status AS booking_status,
           b.booking_mode,
           b.seats AS booking_seats,
           c.user_id AS driver_id,
           c.departure,
           c.destination,
           c.ride_date,
           c.ride_time,
           c.price_xpf,
           c.seats_total,
           c.seats_reserved,
           c.seats_remaining,
           d.prenom AS driver_prenom,
           d.email AS driver_email,
           p.prenom AS passenger_prenom,
           p.email AS passenger_email
         FROM ride_bookings b
         JOIN covoiturages c ON c.id = b.ride_id
         JOIN users d ON d.id = c.user_id
         JOIN users p ON p.id = b.passenger_id
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        throw Object.assign(new Error('Réservation introuvable.'), { statusCode: 404 });
      }

      const isParticipant = Number(booking.driver_id) === Number(req.user.id) || Number(booking.passenger_id) === Number(req.user.id);
      if (!isParticipant && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (booking.booking_status === 'cancelled') {
        throw Object.assign(new Error('Cette réservation est déjà annulée.'), { statusCode: 400 });
      }

      const shouldRestoreSeats = ['auto_confirmed', 'accepted'].includes(booking.booking_status);
      if (shouldRestoreSeats) {
        const restoredSeats = Number(booking.booking_seats || 1);
        await client.query(
          `UPDATE covoiturages
           SET seats_reserved = GREATEST(COALESCE(seats_reserved, 0) - $2, 0),
               seats_remaining = LEAST(COALESCE(seats_remaining, seats_total) + $2, seats_total),
               status = 'published',
               updated_at = NOW()
           WHERE id = $1`,
          [booking.ride_id, restoredSeats]
        );
      }

      await client.query(
        `UPDATE ride_bookings
         SET status = 'cancelled',
             responded_at = COALESCE(responded_at, NOW())
         WHERE id = $1`,
        [bookingId]
      );

      return booking;
    });

    const otherUserId = Number(result.driver_id) === Number(req.user.id) ? result.passenger_id : result.driver_id;
    const otherUserName = Number(result.driver_id) === Number(req.user.id)
      ? result.passenger_prenom
      : result.driver_prenom;

    await createNotification(otherUserId, {
      type: 'ride_booking_cancelled',
      title: 'Réservation annulée',
      body: `${otherUserName || 'Votre interlocuteur'} a annulé la réservation.`,
      href: '/covoiturage/reservations',
    }).catch(() => {});

    await sendPushToUser(otherUserId, {
      title: 'Réservation annulée',
      body: `${otherUserName || 'Votre interlocuteur'} a annulé la réservation.`,
      data: { type: 'ride_booking_cancelled', booking_id: result.booking_id, ride_id: result.ride_id },
    }).catch(() => {});

    return res.json({ data: { booking_id: bookingId, status: 'cancelled' } });
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
       SET status = 'cancelled',
           seats_reserved = 0,
           seats_remaining = seats_total,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await query(
      `UPDATE ride_bookings
       SET status = 'cancelled', responded_at = COALESCE(responded_at, NOW())
       WHERE ride_id = $1 AND status IN ('pending', 'auto_confirmed', 'accepted')`,
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
      `SELECT id, passenger_id FROM ride_bookings WHERE id = $1 AND ride_id = $2`,
      [value.booking_id || 0, req.params.id]
    );
    const booking = bookingRes.rows[0] || null;
    const canReview = Number(ride.user_id) === Number(req.user.id) || (booking && Number(booking.passenger_id) === Number(req.user.id));
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
