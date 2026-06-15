'use strict';

const express = require('express');
const Joi = require('joi');
const Stripe = require('stripe');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isConfiguredValue } = require('../config/env');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');
const { sendMail } = require('../services/emailService');
const { getOrCreateStripeCustomer, xpfToEurCents, formatXpfEur } = require('../services/paymentHelpers');

const router = express.Router();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const demoModeEnabled = process.env.DEMO_MODE === 'true';
const stripe = isConfiguredValue(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' })
  : null;

const TRANSPORT_TYPE_LABELS = {
  taxi: 'Taxi / VTC',
  navette: 'Navette',
  aeroport: 'Transfert aéroport',
  excursion: 'Excursion',
  scolaire: 'Transport scolaire',
  chauffeur: 'Location avec chauffeur',
  location: 'Location avec chauffeur',
};

const TRANSPORT_TYPES = ['taxi', 'navette', 'aeroport', 'excursion', 'scolaire', 'chauffeur', 'location'];

const applySchema = Joi.object({
  company_name: Joi.string().trim().min(2).max(200).required(),
  transport_type: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid(...TRANSPORT_TYPES)).min(1),
    Joi.string().valid(...TRANSPORT_TYPES)
  ).required(),
  vehicle_description: Joi.string().trim().max(500).allow('', null).optional(),
  vehicle_capacity: Joi.number().integer().min(1).max(80).default(4),
  vehicle_photo_url: Joi.string().trim().uri().allow('', null).optional(),
  license_number: Joi.string().trim().max(120).allow('', null).optional(),
  insurance_number: Joi.string().trim().max(120).allow('', null).optional(),
  pro_phone: Joi.string().trim().max(50).allow('', null).optional(),
  pro_website: Joi.string().trim().uri().allow('', null).optional(),
  pro_hours: Joi.string().trim().max(500).allow('', null).optional(),
  pro_siret: Joi.string().trim().max(120).allow('', null).optional(),
  base_price_xpf: Joi.number().integer().min(0).default(0),
  price_per_km_xpf: Joi.number().integer().min(0).default(0),
  service_zones: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1).max(120)).min(1),
    Joi.string().allow('', null)
  ).required(),
  availability: Joi.array().items(
    Joi.object({
      day_of_week: Joi.number().integer().min(0).max(6).required(),
      start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      is_active: Joi.boolean().default(true),
    })
  ).default([]),
  exceptions: Joi.array().items(
    Joi.object({
      exception_date: Joi.string().isoDate().required(),
      is_unavailable: Joi.boolean().default(true),
      start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null).optional(),
      end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null).optional(),
      reason: Joi.string().trim().max(255).allow('', null).optional(),
    })
  ).default([]),
});

const quoteSchema = Joi.object({
  departure: Joi.string().trim().min(2).max(200).required(),
  destination: Joi.string().trim().min(2).max(200).required(),
  date: Joi.string().isoDate().required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  passengers: Joi.number().integer().min(1).max(8).default(1),
});

const rideCreateSchema = Joi.object({
  transporter_id: Joi.number().integer().positive().required(),
  transport_type: Joi.string().valid(...TRANSPORT_TYPES).required(),
  departure: Joi.string().trim().min(2).max(200).required(),
  destination: Joi.string().trim().min(2).max(200).required(),
  departure_lat: Joi.number().allow(null).optional(),
  departure_lng: Joi.number().allow(null).optional(),
  destination_lat: Joi.number().allow(null).optional(),
  destination_lng: Joi.number().allow(null).optional(),
  ride_date: Joi.string().isoDate().required(),
  ride_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  passengers: Joi.number().integer().min(1).max(8).default(1),
  price_xpf: Joi.number().integer().min(0).required(),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
});

const rideReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('', null).optional(),
});

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeTransportTypes(value) {
  return asArray(value).filter((type) => TRANSPORT_TYPES.includes(type));
}

function getTransportTypeLabel(type) {
  return TRANSPORT_TYPE_LABELS[type] || type;
}

function formatRideLabel(ride) {
  return `${ride.departure} → ${ride.destination}`;
}

function normalizeTimeLabel(value) {
  return String(value || '').slice(0, 5);
}

function buildTransporterDisplayName(row) {
  return row.company_name
    || row.pro_company_name
    || [row.prenom, row.nom].filter(Boolean).join(' ').trim()
    || 'Transporteur Kalico';
}

function mapTransporterRow(row) {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    company_name: row.company_name,
    display_name: buildTransporterDisplayName(row),
    prenom: row.prenom ?? null,
    nom: row.nom ?? null,
    pro_logo_url: row.pro_logo_url ?? null,
    transport_type: asArray(row.transport_type),
    vehicle_description: row.vehicle_description ?? null,
    vehicle_capacity: Number(row.vehicle_capacity ?? 4),
    vehicle_photo_url: row.vehicle_photo_url ?? null,
    license_number: row.license_number ?? null,
    insurance_number: row.insurance_number ?? null,
    pro_phone: row.pro_phone ?? null,
    pro_website: row.pro_website ?? null,
    pro_hours: row.pro_hours ?? null,
    pro_siret: row.pro_siret ?? null,
    base_price_xpf: Number(row.base_price_xpf ?? 0),
    price_per_km_xpf: Number(row.price_per_km_xpf ?? 0),
    service_zones: asArray(row.service_zones),
    is_verified: Boolean(row.is_verified),
    is_available: Boolean(row.is_available),
    rating: Number(row.rating ?? 0),
    rides_completed: Number(row.rides_completed ?? 0),
    total_rides: Number(row.total_rides ?? 0),
    avg_rating: Number(row.avg_rating ?? 0),
  };
}

function mapRideRow(row) {
  return {
    id: Number(row.id),
    transporter_id: Number(row.transporter_id),
    client_id: Number(row.client_id),
    transport_type: row.transport_type,
    departure: row.departure,
    destination: row.destination,
    departure_lat: row.departure_lat ?? null,
    departure_lng: row.departure_lng ?? null,
    destination_lat: row.destination_lat ?? null,
    destination_lng: row.destination_lng ?? null,
    ride_date: row.ride_date,
    ride_time: row.ride_time,
    passengers: Number(row.passengers ?? 1),
    distance_km: Number(row.distance_km ?? 0),
    price_xpf: Number(row.price_xpf ?? 0),
    status: row.status,
    payment_status: row.payment_status,
    stripe_payment_id: row.stripe_payment_id ?? null,
    invoice_number: row.invoice_number ?? null,
    notes: row.notes ?? null,
    client_rating: row.client_rating ?? null,
    client_review: row.client_review ?? null,
    created_at: row.created_at,
    confirmed_at: row.confirmed_at ?? null,
    completed_at: row.completed_at ?? null,
    transporter: row.transporter_id ? {
      id: Number(row.transporter_id),
      company_name: row.company_name ?? null,
      display_name: row.company_name ?? null,
      pro_logo_url: row.pro_logo_url ?? null,
      transport_type: asArray(row.transporter_transport_type),
      service_zones: asArray(row.service_zones),
      rating: Number(row.transporter_rating ?? 0),
    } : null,
    client: row.client_id ? {
      id: Number(row.client_id),
      prenom: row.client_prenom ?? null,
      nom: row.client_nom ?? null,
      avatar_url: row.client_avatar_url ?? null,
      email: row.client_email ?? null,
    } : null,
  };
}

function estimateDistanceKm({ departure, destination, departureCommune, destinationCommune }) {
  const dep = normalizeMaybeText(departure).toLowerCase();
  const dest = normalizeMaybeText(destination).toLowerCase();
  if (!dep || !dest) return 18;
  if (dep === dest) return 8;
  if (departureCommune && destinationCommune && departureCommune === destinationCommune) return 12;
  if (departureCommune && destinationCommune && departureCommune.province_id === destinationCommune.province_id) return 58;
  return 120;
}

function computeTransportQuote(transporter, distanceKm) {
  const base = Math.max(0, Number(transporter.base_price_xpf ?? 0));
  const perKm = Math.max(0, Number(transporter.price_per_km_xpf ?? 0));
  const distancePrice = Math.round(distanceKm * perKm);
  const total = base + distancePrice;
  return {
    base_price_xpf: base,
    distance_price_xpf: distancePrice,
    total_price_xpf: total,
    estimated_duration_minutes: Math.max(20, Math.round(distanceKm * 1.6 + 10)),
  };
}

function isAvailableOnDate({ schedules, exceptions, date }) {
  const target = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(target.getTime())) return false;
  const isoDate = target.toISOString().slice(0, 10);
  const dayOfWeek = target.getUTCDay();
  const exception = exceptions.find((entry) => entry.exception_date === isoDate);
  if (exception && exception.is_unavailable) return false;
  const specialOpen = exception && !exception.is_unavailable;
  const weeklyOpen = schedules.some((slot) => slot.day_of_week === dayOfWeek && slot.is_active);
  return specialOpen || weeklyOpen;
}

async function loadTransporterById(transporterId) {
  const result = await query(
    `SELECT
       pt.*,
       u.prenom,
       u.nom,
       u.pro_company_name,
       u.pro_logo_url
     FROM pro_transporters pt
     JOIN users u ON u.id = pt.user_id
     WHERE pt.id = $1
       AND pt.is_verified = TRUE
       AND pt.is_available = TRUE
     LIMIT 1`,
    [transporterId]
  );
  return result.rows[0] ? mapTransporterRow(result.rows[0]) : null;
}

async function loadTransporterAvailability(transporterId) {
  const [weeklyRes, exceptionsRes] = await Promise.all([
    query(
      `SELECT id, transporter_id, day_of_week, start_time, end_time, is_active
       FROM pro_availability
       WHERE transporter_id = $1
       ORDER BY day_of_week ASC, start_time ASC`,
      [transporterId]
    ),
    query(
      `SELECT id, transporter_id, exception_date, is_unavailable, start_time, end_time, reason
       FROM pro_availability_exceptions
       WHERE transporter_id = $1
       ORDER BY exception_date DESC`,
      [transporterId]
    ),
  ]);

  return {
    weekly: weeklyRes.rows,
    exceptions: exceptionsRes.rows,
  };
}

async function refreshTransporterRating(transporterId, client) {
  const statsRes = await client.query(
    `SELECT
       COALESCE(ROUND(AVG(client_rating)::numeric, 2), 0) AS avg_rating,
       COUNT(*) FILTER (WHERE status = 'completed')::int AS rides_completed
     FROM pro_rides
     WHERE transporter_id = $1
       AND client_rating IS NOT NULL`,
    [transporterId]
  );

  const avgRating = Number(statsRes.rows[0]?.avg_rating ?? 0);
  const ridesCompleted = Number(statsRes.rows[0]?.rides_completed ?? 0);

  await client.query(
    `UPDATE pro_transporters
     SET rating = $2,
         rides_completed = $3
     WHERE id = $1`,
    [transporterId, avgRating, ridesCompleted]
  );

  return { avgRating, ridesCompleted };
}

async function ensureTransporterOwner(transporterId, userId) {
  const res = await query(
    `SELECT id, user_id, company_name
     FROM pro_transporters
     WHERE id = $1
     LIMIT 1`,
    [transporterId]
  );
  const transporter = res.rows[0];
  if (!transporter) return null;
  if (Number(transporter.user_id) !== Number(userId)) return null;
  return transporter;
}

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 12)));
    const type = normalizeMaybeText(req.query.type);
    const zone = normalizeMaybeText(req.query.zone);
    const passengers = Math.max(1, Number(req.query.passengers || 1));
    const date = normalizeMaybeText(req.query.date);
    const time = normalizeMaybeText(req.query.time);

    const result = await query(
      `SELECT
         pt.*,
         u.prenom,
         u.nom,
         u.pro_company_name,
         u.pro_logo_url,
         COALESCE(COUNT(pr.id), 0)::int AS total_rides,
         COALESCE(ROUND(AVG(pr.client_rating)::numeric, 2), 0) AS avg_rating
       FROM pro_transporters pt
       JOIN users u ON u.id = pt.user_id
       LEFT JOIN pro_rides pr
         ON pr.transporter_id = pt.id
        AND pr.status = 'completed'
       WHERE pt.is_verified = TRUE
         AND pt.is_available = TRUE
         AND ($1::text IS NULL OR $1 = ANY(pt.transport_type))
         AND ($2::text IS NULL OR $2 = ANY(pt.service_zones))
         AND (COALESCE(pt.vehicle_capacity, 4) >= $3)
       GROUP BY pt.id, u.id
       ORDER BY avg_rating DESC, total_rides DESC, pt.created_at DESC
       LIMIT $4`,
      [type || null, zone || null, passengers, limit]
    );

    let transporters = result.rows.map(mapTransporterRow);

    if (date || time) {
      const filtered = [];
      for (const transporter of transporters) {
        const availability = await loadTransporterAvailability(transporter.id);
        if (!date || isAvailableOnDate({
          schedules: availability.weekly,
          exceptions: availability.exceptions,
          date,
        })) {
          filtered.push({
            ...transporter,
            weekly_availability: availability.weekly,
            exceptions: availability.exceptions,
          });
        }
      }
      transporters = filtered;
    }

    return res.json({
      data: transporters.map((item) => ({
        ...item,
        transport_type_labels: item.transport_type.map(getTransportTypeLabel),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const { error, value } = applySchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const isPro = Boolean(req.user?.is_pro);
    if (!isPro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }

    const transporterId = await withTransaction(async (client) => {
      const existingRes = await client.query(
        `SELECT id, is_verified
         FROM pro_transporters
         WHERE user_id = $1
         LIMIT 1`,
        [req.user.id]
      );

      const transportTypes = normalizeTransportTypes(value.transport_type);
      const serviceZones = asArray(value.service_zones);

      let transporterIdLocal = existingRes.rows[0]?.id ?? null;
      if (transporterIdLocal) {
        await client.query(
          `UPDATE pro_transporters
           SET company_name = $2,
               transport_type = $3,
               vehicle_description = $4,
               vehicle_capacity = $5,
               vehicle_photo_url = $6,
               license_number = $7,
               insurance_number = $8,
               pro_phone = $9,
               pro_website = $10,
               pro_hours = $11,
               pro_siret = $12,
               base_price_xpf = $13,
               price_per_km_xpf = $14,
               service_zones = $15,
               is_available = TRUE
           WHERE id = $1`,
          [
            transporterIdLocal,
            normalizeMaybeText(value.company_name),
            transportTypes,
            normalizeMaybeText(value.vehicle_description),
            Number(value.vehicle_capacity ?? 4),
            normalizeMaybeText(value.vehicle_photo_url),
            normalizeMaybeText(value.license_number),
            normalizeMaybeText(value.insurance_number),
            normalizeMaybeText(value.pro_phone),
            normalizeMaybeText(value.pro_website),
            normalizeMaybeText(value.pro_hours),
            normalizeMaybeText(value.pro_siret),
            Number(value.base_price_xpf ?? 0),
            Number(value.price_per_km_xpf ?? 0),
            serviceZones,
          ]
        );
      } else {
        const insertRes = await client.query(
          `INSERT INTO pro_transporters
             (user_id, company_name, transport_type, vehicle_description, vehicle_capacity,
              vehicle_photo_url, license_number, insurance_number, pro_phone, pro_website,
              pro_hours, pro_siret, base_price_xpf, price_per_km_xpf, service_zones, is_verified, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, FALSE, TRUE)
           RETURNING id`,
          [
            req.user.id,
            normalizeMaybeText(value.company_name),
            transportTypes,
            normalizeMaybeText(value.vehicle_description),
            Number(value.vehicle_capacity ?? 4),
            normalizeMaybeText(value.vehicle_photo_url),
            normalizeMaybeText(value.license_number),
            normalizeMaybeText(value.insurance_number),
            normalizeMaybeText(value.pro_phone),
            normalizeMaybeText(value.pro_website),
            normalizeMaybeText(value.pro_hours),
            normalizeMaybeText(value.pro_siret),
            Number(value.base_price_xpf ?? 0),
            Number(value.price_per_km_xpf ?? 0),
            serviceZones,
          ]
        );
        transporterIdLocal = insertRes.rows[0].id;
      }

      await client.query('DELETE FROM pro_availability WHERE transporter_id = $1', [transporterIdLocal]);
      if (Array.isArray(value.availability)) {
        for (const slot of value.availability) {
          await client.query(
            `INSERT INTO pro_availability (transporter_id, day_of_week, start_time, end_time, is_active)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              transporterIdLocal,
              slot.day_of_week,
              slot.start_time,
              slot.end_time,
              Boolean(slot.is_active),
            ]
          );
        }
      }

      await client.query('DELETE FROM pro_availability_exceptions WHERE transporter_id = $1', [transporterIdLocal]);
      if (Array.isArray(value.exceptions)) {
        for (const exception of value.exceptions) {
          await client.query(
            `INSERT INTO pro_availability_exceptions
               (transporter_id, exception_date, is_unavailable, start_time, end_time, reason)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              transporterIdLocal,
              exception.exception_date,
              Boolean(exception.is_unavailable),
              normalizeMaybeText(exception.start_time),
              normalizeMaybeText(exception.end_time),
              normalizeMaybeText(exception.reason),
            ]
          );
        }
      }

      return transporterIdLocal;
    });

    const transporter = await loadTransporterById(transporterId);
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail && transporter) {
      await sendMail({
        to: adminEmail,
        subject: 'Nouvelle demande transport pro',
        html: `
          <p>Une nouvelle demande transport pro a été soumise sur Kalico.</p>
          <ul>
            <li><strong>Entreprise :</strong> ${transporter.company_name}</li>
            <li><strong>Transport :</strong> ${transporter.transport_type.map(getTransportTypeLabel).join(', ')}</li>
            <li><strong>Zones :</strong> ${transporter.service_zones.join(', ') || 'NC'}</li>
            <li><strong>Capacité :</strong> ${transporter.vehicle_capacity}</li>
            <li><strong>Téléphone :</strong> ${normalizeMaybeText(value.pro_phone) || 'Non renseigné'}</li>
            <li><strong>Site web :</strong> ${normalizeMaybeText(value.pro_website) || 'Non renseigné'}</li>
            <li><strong>Horaires :</strong> ${normalizeMaybeText(value.pro_hours) || 'Non renseignés'}</li>
            <li><strong>RIDET :</strong> ${normalizeMaybeText(value.pro_siret) || 'Non renseigné'}</li>
          </ul>
          <p>Validation manuelle possible depuis l'admin.</p>
        `,
      }).catch(() => {});
    }

    return res.status(201).json({
      data: {
        transporter_id: transporterId,
        is_verified: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    const transporterId = Number(req.params.id);
    const month = Math.min(12, Math.max(1, Number(req.query.month || new Date().getMonth() + 1)));
    const year = Number(req.query.year || new Date().getFullYear());
    if (!Number.isFinite(transporterId) || transporterId <= 0) {
      return res.status(400).json({ error: 'Transporteur invalide.' });
    }

    const transporter = await loadTransporterById(transporterId);
    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur introuvable.' });
    }

    const { weekly, exceptions } = await loadTransporterAvailability(transporterId);
    const availableDates = [];
    const unavailableDates = [];

    const first = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
    const last = new Date(Date.UTC(year, month, 0, 12, 0, 0));
    for (let current = new Date(first); current <= last; current.setUTCDate(current.getUTCDate() + 1)) {
      const iso = current.toISOString().slice(0, 10);
      if (isAvailableOnDate({ schedules: weekly, exceptions, date: iso })) {
        availableDates.push(iso);
      } else {
        unavailableDates.push(iso);
      }
    }

    return res.json({
      data: {
        transporter_id: transporterId,
        month,
        year,
        available_dates: availableDates,
        unavailable_dates: unavailableDates,
        weekly,
        exceptions,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/quote', async (req, res, next) => {
  try {
    const transporterId = Number(req.params.id);
    if (!Number.isFinite(transporterId) || transporterId <= 0) {
      return res.status(400).json({ error: 'Transporteur invalide.' });
    }

    const { error, value } = quoteSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const transporterRes = await query(
      `SELECT
         pt.*,
         u.prenom,
         u.nom,
         u.pro_company_name,
         u.pro_logo_url
       FROM pro_transporters pt
       JOIN users u ON u.id = pt.user_id
       WHERE pt.id = $1
         AND pt.is_verified = TRUE
         AND pt.is_available = TRUE
       LIMIT 1`,
      [transporterId]
    );
    const transporterRow = transporterRes.rows[0];
    if (!transporterRow) {
      return res.status(404).json({ error: 'Transporteur introuvable.' });
    }

    const { weekly, exceptions } = await loadTransporterAvailability(transporterId);
    if (!isAvailableOnDate({ schedules: weekly, exceptions, date: value.date })) {
      return res.status(400).json({ error: 'Le transporteur n’est pas disponible à cette date.' });
    }

    const communeRes = await query(
      `SELECT c.id, c.name, c.province_id, p.name AS province_name
       FROM communes c
       JOIN provinces p ON p.id = c.province_id
       WHERE lower(c.name) = lower($1)
       LIMIT 1`,
      [value.departure]
    );
    const departureCommune = communeRes.rows[0] || null;

    const destinationRes = await query(
      `SELECT c.id, c.name, c.province_id, p.name AS province_name
       FROM communes c
       JOIN provinces p ON p.id = c.province_id
       WHERE lower(c.name) = lower($1)
       LIMIT 1`,
      [value.destination]
    );
    const destinationCommune = destinationRes.rows[0] || null;

    const distanceKm = estimateDistanceKm({
      departure: value.departure,
      destination: value.destination,
      departureCommune,
      destinationCommune,
    });
    const quote = computeTransportQuote(transporterRow, distanceKm);

    return res.json({
      data: {
        transporter_id: transporterId,
        distance_km: Number(distanceKm.toFixed(2)),
        ...quote,
        estimated_duration_minutes: quote.estimated_duration_minutes,
        passengers: value.passengers,
        departure: value.departure,
        destination: value.destination,
        date: value.date,
        time: value.time,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/rides', authenticate, async (req, res, next) => {
  try {
    const { error, value } = rideCreateSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const transporterRes = await query(
      `SELECT pt.*, u.prenom, u.nom, u.email, u.pro_logo_url
       FROM pro_transporters pt
       JOIN users u ON u.id = pt.user_id
       WHERE pt.id = $1
         AND pt.is_verified = TRUE
         AND pt.is_available = TRUE
       LIMIT 1`,
      [value.transporter_id]
    );
    const transporter = transporterRes.rows[0];
    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur introuvable.' });
    }

    const { weekly, exceptions } = await loadTransporterAvailability(value.transporter_id);
    if (!isAvailableOnDate({ schedules: weekly, exceptions, date: value.ride_date })) {
      return res.status(400).json({ error: 'Le transporteur n’est pas disponible à cette date.' });
    }

    const quotePrice = Number(value.price_xpf || 0);
    if (!Number.isFinite(quotePrice) || quotePrice < 0) {
      return res.status(400).json({ error: 'Prix invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const rideInsert = await client.query(
        `INSERT INTO pro_rides
           (transporter_id, client_id, transport_type, departure, destination,
            departure_lat, departure_lng, destination_lat, destination_lng,
            ride_date, ride_time, passengers, distance_km, price_xpf, status,
            payment_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NULL, $13, 'pending', 'pending', $14)
         RETURNING *`,
        [
          value.transporter_id,
          req.user.id,
          value.transport_type,
          value.departure,
          value.destination,
          value.departure_lat ?? null,
          value.departure_lng ?? null,
          value.destination_lat ?? null,
          value.destination_lng ?? null,
          value.ride_date,
          value.ride_time,
          value.passengers,
          quotePrice,
          normalizeMaybeText(value.notes),
        ]
      );

      const ride = rideInsert.rows[0];
      const customerId = stripe
        ? await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email)
        : null;
      const paymentIntent = stripe
        ? await stripe.paymentIntents.create({
            amount: xpfToEurCents(quotePrice),
            currency: 'eur',
            customer: customerId,
            payment_method_types: ['card'],
            description: `Transport pro — ${ride.departure} → ${ride.destination}`,
            metadata: {
              payment_type: 'pro_transport_ride',
              ride_id: String(ride.id),
              transporter_id: String(value.transporter_id),
              client_id: String(req.user.id),
              amount_xpf: String(quotePrice),
            },
          })
        : null;

      if (paymentIntent) {
        await client.query(
          `UPDATE pro_rides
           SET stripe_payment_id = $2
           WHERE id = $1`,
          [ride.id, paymentIntent.id]
        );

        await client.query(
          `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
           VALUES ($1, 'pro_transport_ride', 'stripe', $2, $3, 'pending', $4)`,
          [
            req.user.id,
            paymentIntent.id,
            quotePrice,
            JSON.stringify({
              payment_type: 'pro_transport_ride',
              ride_id: ride.id,
              transporter_id: value.transporter_id,
              amount_xpf: quotePrice,
            }),
          ]
        );
      }

      return {
        ride,
        paymentIntent,
      };
    });

    const rideLabel = formatRideLabel(result.ride);

    await createNotification(transporter.user_id, {
      type: 'pro_transport_request',
      title: 'Nouvelle demande de course !',
      body: `${req.user.prenom || 'Un client'} demande ${rideLabel} le ${value.ride_date}`,
      href: '/pro/dashboard/transport',
    }).catch(() => {});

    await sendPushToUser(transporter.user_id, {
      title: 'Nouvelle demande de course !',
      body: `${req.user.prenom || 'Un client'} demande ${rideLabel} le ${value.ride_date}`,
      data: { type: 'pro_transport_request', ride_id: result.ride.id, transporter_id: value.transporter_id },
    }).catch(() => {});

    await sendMail({
      to: transporter.email,
      subject: 'Nouvelle demande de course sur Kalico',
      html: `
        <p>Bonjour ${transporter.prenom || 'Transporteur'},</p>
        <p>Une nouvelle demande de course a été envoyée sur Kalico :</p>
        <p><strong>${value.departure}</strong> → <strong>${value.destination}</strong><br>
        Date : ${value.ride_date} à ${normalizeTimeLabel(value.ride_time)}<br>
        Passagers : ${value.passengers}<br>
        Prix : ${formatXpfEur(quotePrice)}</p>
        <p>Consultez votre espace transport pour confirmer cette course.</p>
      `,
    }).catch(() => {});

    return res.status(201).json({
      data: {
        ride_id: result.ride.id,
        stripe_client_secret: result.paymentIntent?.client_secret ?? null,
        payment_status: 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/rides/:id/confirm', authenticate, async (req, res, next) => {
  try {
    const rideId = Number(req.params.id);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return res.status(400).json({ error: 'Course invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const rideRes = await client.query(
        `SELECT
           r.*,
           pt.user_id AS transporter_user_id,
           pt.company_name,
           pt.pro_logo_url,
           u.prenom AS transporter_prenom,
           u.nom AS transporter_nom,
           u.email AS transporter_email,
           c.prenom AS client_prenom,
           c.nom AS client_nom,
           c.email AS client_email
         FROM pro_rides r
         JOIN pro_transporters pt ON pt.id = r.transporter_id
         JOIN users u ON u.id = pt.user_id
         JOIN users c ON c.id = r.client_id
         WHERE r.id = $1
         FOR UPDATE`,
        [rideId]
      );

      const ride = rideRes.rows[0];
      if (!ride) {
        throw Object.assign(new Error('Course introuvable.'), { statusCode: 404 });
      }

      if (Number(ride.transporter_user_id) !== Number(req.user.id) && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (ride.status !== 'pending') {
        throw Object.assign(new Error('Cette course ne peut plus être confirmée.'), { statusCode: 400 });
      }

      await client.query(
        `UPDATE pro_rides
         SET status = 'confirmed',
             confirmed_at = NOW()
         WHERE id = $1`,
        [rideId]
      );

      return ride;
    });

    const rideLabel = formatRideLabel(result);

    await createNotification(result.client_id, {
      type: 'pro_transport_confirmed',
      title: 'Course confirmée !',
      body: `${result.transporter_prenom || 'Votre transporteur'} sera là le ${result.ride_date} à ${normalizeTimeLabel(result.ride_time)}.`,
      href: '/covoiturage/mes-courses',
    }).catch(() => {});

    await sendPushToUser(result.client_id, {
      title: 'Course confirmée !',
      body: `${result.transporter_prenom || 'Votre transporteur'} sera là le ${result.ride_date} à ${normalizeTimeLabel(result.ride_time)}.`,
      data: { type: 'pro_transport_confirmed', ride_id: result.id },
    }).catch(() => {});

    await sendMail({
      to: result.client_email,
      subject: 'Votre course a été confirmée sur Kalico',
      html: `
        <p>Bonjour ${result.client_prenom || 'Client'},</p>
        <p><strong>${result.transporter_prenom || 'Votre transporteur'}</strong> a confirmé votre course.</p>
        <p>${rideLabel}<br>
        Date : ${result.ride_date} à ${normalizeTimeLabel(result.ride_time)}<br>
        Passagers : ${result.passengers}</p>
        <p>Retrouvez les détails dans vos courses.</p>
      `,
    }).catch(() => {});

    return res.json({ data: { ride_id: rideId, status: 'confirmed' } });
  } catch (err) {
    next(err);
  }
});

router.post('/rides/:id/complete', authenticate, async (req, res, next) => {
  try {
    const rideId = Number(req.params.id);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return res.status(400).json({ error: 'Course invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const rideRes = await client.query(
        `SELECT
           r.*,
           pt.user_id AS transporter_user_id,
           u.prenom AS transporter_prenom,
           u.email AS transporter_email,
           c.prenom AS client_prenom,
           c.email AS client_email
         FROM pro_rides r
         JOIN pro_transporters pt ON pt.id = r.transporter_id
         JOIN users u ON u.id = pt.user_id
         JOIN users c ON c.id = r.client_id
         WHERE r.id = $1
         FOR UPDATE`,
        [rideId]
      );

      const ride = rideRes.rows[0];
      if (!ride) {
        throw Object.assign(new Error('Course introuvable.'), { statusCode: 404 });
      }

      if (Number(ride.transporter_user_id) !== Number(req.user.id) && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (ride.status === 'completed') {
        throw Object.assign(new Error('Cette course est déjà terminée.'), { statusCode: 400 });
      }

      await client.query(
        `UPDATE pro_rides
         SET status = 'completed',
             completed_at = NOW()
         WHERE id = $1`,
        [rideId]
      );

      return ride;
    });

    await createNotification(result.client_id, {
      type: 'pro_transport_completed',
      title: 'Course terminée',
      body: `Course terminée avec ${result.transporter_prenom || 'votre transporteur'}. Laissez un avis !`,
      href: `/pro-transport/rides/${rideId}/review`,
    }).catch(() => {});

    await sendPushToUser(result.client_id, {
      title: 'Course terminée',
      body: `Course terminée avec ${result.transporter_prenom || 'votre transporteur'}. Laissez un avis !`,
      data: { type: 'pro_transport_completed', ride_id: rideId },
    }).catch(() => {});

    return res.json({ data: { ride_id: rideId, status: 'completed' } });
  } catch (err) {
    next(err);
  }
});

router.post('/rides/:id/review', authenticate, async (req, res, next) => {
  try {
    const rideId = Number(req.params.id);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return res.status(400).json({ error: 'Course invalide.' });
    }

    const { error, value } = rideReviewSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const created = await withTransaction(async (client) => {
      const rideRes = await client.query(
        `SELECT r.*, pt.id AS transporter_id, pt.user_id AS transporter_user_id
         FROM pro_rides r
         JOIN pro_transporters pt ON pt.id = r.transporter_id
         WHERE r.id = $1
         FOR UPDATE`,
        [rideId]
      );

      const ride = rideRes.rows[0];
      if (!ride) throw Object.assign(new Error('Course introuvable.'), { statusCode: 404 });
      if (Number(ride.client_id) !== Number(req.user.id)) {
        throw Object.assign(new Error('Seul le client peut laisser un avis.'), { statusCode: 403 });
      }
      if (ride.status !== 'completed') {
        throw Object.assign(new Error('La course doit être terminée pour laisser un avis.'), { statusCode: 400 });
      }
      if (ride.client_rating) {
        throw Object.assign(new Error('Un avis a déjà été déposé.'), { statusCode: 409 });
      }

      const reviewRes = await client.query(
        `UPDATE pro_rides
         SET client_rating = $2,
             client_review = $3
         WHERE id = $1
         RETURNING *`,
        [rideId, value.rating, normalizeMaybeText(value.comment)]
      );

      await refreshTransporterRating(ride.transporter_id, client);

      return reviewRes.rows[0];
    });

    return res.status(201).json({
      data: {
        ride_id: rideId,
        rating: created.client_rating,
        review: created.client_review,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/rides/:id/notify-payment', authenticate, async (req, res, next) => {
  try {
    const rideId = Number(req.params.id);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return res.status(400).json({ error: 'Course invalide.' });
    }
    return res.json({ ok: true, ride_id: rideId });
  } catch (err) {
    next(err);
  }
});

router.get('/rides/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         r.*,
         pt.company_name,
         pt.transport_type AS transporter_transport_type,
         pt.service_zones,
         pt.rating AS transporter_rating,
         pt.rides_completed AS transporter_rides_completed,
         u.prenom AS transporter_prenom,
         u.nom AS transporter_nom,
         u.pro_logo_url,
         c.prenom AS client_prenom,
         c.nom AS client_nom,
         c.avatar_url AS client_avatar_url,
         c.email AS client_email
       FROM pro_rides r
       JOIN pro_transporters pt ON pt.id = r.transporter_id
       JOIN users u ON u.id = pt.user_id
       JOIN users c ON c.id = r.client_id
       WHERE r.client_id = $1 OR pt.user_id = $1
       ORDER BY r.ride_date DESC, r.ride_time DESC, r.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map((row) => ({
        ...mapRideRow(row),
        role: Number(row.client_id) === Number(req.user.id) ? 'client' : 'transporter',
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const transporterRes = await query(
      `SELECT pt.*, u.prenom, u.nom, u.email, u.pro_logo_url, u.pro_company_name
       FROM pro_transporters pt
       JOIN users u ON u.id = pt.user_id
       WHERE pt.user_id = $1
       LIMIT 1`,
      [req.user.id]
    );
    const transporter = transporterRes.rows[0];
    if (!transporter) {
      return res.status(404).json({ error: 'Profil transporteur introuvable.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { rows: ridesToday } = await query(
      `SELECT
         r.*,
         c.prenom AS client_prenom,
         c.nom AS client_nom,
         c.avatar_url AS client_avatar_url,
         u.prenom AS transporter_prenom,
         u.nom AS transporter_nom,
         pt.company_name
       FROM pro_rides r
       JOIN users c ON c.id = r.client_id
       JOIN pro_transporters pt ON pt.id = r.transporter_id
       JOIN users u ON u.id = pt.user_id
       WHERE pt.user_id = $1
         AND r.ride_date = $2
       ORDER BY r.ride_time ASC`,
      [req.user.id, today]
    );

    const { rows: ridesUpcoming } = await query(
      `SELECT
         r.*,
         c.prenom AS client_prenom,
         c.nom AS client_nom,
         c.avatar_url AS client_avatar_url,
         u.prenom AS transporter_prenom,
         u.nom AS transporter_nom
       FROM pro_rides r
       JOIN users c ON c.id = r.client_id
       JOIN pro_transporters pt ON pt.id = r.transporter_id
       JOIN users u ON u.id = pt.user_id
       WHERE pt.user_id = $1
         AND r.ride_date >= $2
         AND r.status IN ('pending', 'confirmed', 'in_progress')
       ORDER BY r.ride_date ASC, r.ride_time ASC
       LIMIT 8`,
      [req.user.id, today]
    );

    const statsRes = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed')::int AS rides_completed_count,
         COALESCE(SUM(price_xpf) FILTER (WHERE payment_status = 'paid'), 0)::int AS revenue_total_xpf,
         COALESCE(SUM(price_xpf) FILTER (WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days'), 0)::int AS revenue_30d_xpf,
         COALESCE(ROUND(AVG(client_rating)::numeric, 2), 0) AS avg_rating,
         COUNT(*) FILTER (WHERE status = 'completed' AND client_rating IS NULL)::int AS pending_reviews
       FROM pro_rides
       WHERE transporter_id = $1`,
      [transporter.id]
    );

    return res.json({
      data: {
        transporter: mapTransporterRow(transporter),
        rides_today: ridesToday.map(mapRideRow),
        rides_upcoming: ridesUpcoming.map(mapRideRow),
        rides_completed_count: Number(statsRes.rows[0]?.rides_completed_count ?? 0),
        revenue_total_xpf: Number(statsRes.rows[0]?.revenue_total_xpf ?? 0),
        revenue_30d_xpf: Number(statsRes.rows[0]?.revenue_30d_xpf ?? 0),
        avg_rating: Number(statsRes.rows[0]?.avg_rating ?? 0),
        pending_reviews: Number(statsRes.rows[0]?.pending_reviews ?? 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const transporterId = Number(req.params.id);
    if (!Number.isFinite(transporterId) || transporterId <= 0) {
      return res.status(400).json({ error: 'Transporteur invalide.' });
    }

    const transporter = await loadTransporterById(transporterId);
    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur introuvable.' });
    }

    const [availability, reviewsRes, ridesRes] = await Promise.all([
      loadTransporterAvailability(transporterId),
      query(
        `SELECT
           r.id,
           r.client_id,
           r.client_rating,
           r.client_review,
           r.completed_at,
           u.prenom AS reviewer_prenom,
           u.nom AS reviewer_nom
         FROM pro_rides r
         LEFT JOIN users u ON u.id = r.client_id
         WHERE r.transporter_id = $1
           AND r.client_rating IS NOT NULL
         ORDER BY r.completed_at DESC NULLS LAST, r.created_at DESC
         LIMIT 5`,
        [transporterId]
      ),
      query(
        `SELECT *
         FROM pro_rides
         WHERE transporter_id = $1
           AND status IN ('pending', 'confirmed', 'in_progress', 'completed')
         ORDER BY ride_date DESC, ride_time DESC
         LIMIT 8`,
        [transporterId]
      ),
    ]);

    return res.json({
      data: {
        ...transporter,
        availability: availability.weekly,
        exceptions: availability.exceptions,
        reviews: reviewsRes.rows.map((row) => ({
          id: Number(row.id),
          rating: Number(row.client_rating),
          comment: row.client_review ?? null,
          completed_at: row.completed_at ?? null,
          reviewer_prenom: row.reviewer_prenom ?? null,
          reviewer_nom: row.reviewer_nom ?? null,
        })),
        rides: ridesRes.rows.map(mapRideRow),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
