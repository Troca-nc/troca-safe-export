'use strict';

const express = require('express');
const { Joi, validate } = require('../middleware/validate');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { scanLimiter } = require('../middleware/rateLimit');
const { sendTicketEmail } = require('../services/emailService');
const {
  createEventAndBonPlan,
  expireEventTicketReservations,
  getPublicEventById,
  getTicketByToken,
  serializeTicketForViewer,
  listPublicEvents,
  reserveEventTickets,
  scanTicket,
} = require('../services/eventTicketingService');

const router = express.Router();

const eventCategoryValues = ['concert', 'festival', 'sport', 'marche', 'conference', 'exposition', 'cinema', 'spectacle', 'autre'];

const ticketTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow('', null),
  price_xpf: Joi.number().integer().min(0).required(),
  quantity_total: Joi.number().integer().min(1).required(),
  sale_starts_at: Joi.date().iso().allow(null, ''),
  sale_ends_at: Joi.date().iso().allow(null, ''),
  is_active: Joi.boolean().default(true),
  position: Joi.number().integer().min(0).default(0),
});

const createEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(5000).allow('', null),
  venue_name: Joi.string().trim().max(200).allow('', null),
  venue_address: Joi.string().trim().max(500).allow('', null),
  commune_id: Joi.number().integer().allow(null),
  event_date: Joi.date().iso().required(),
  event_time: Joi.string().trim().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  end_time: Joi.string().trim().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
  cover_image_url: Joi.string().uri().allow('', null),
  photos: Joi.array().items(Joi.string().uri().allow('', null)).max(12).default([]),
  booking_url: Joi.string().uri().allow('', null),
  room: Joi.string().trim().max(120).allow('', null),
  version: Joi.string().trim().max(30).allow('', null),
  is_3d: Joi.boolean().default(false),
  price_normal_xpf: Joi.number().integer().min(0).allow(null),
  price_reduced_xpf: Joi.number().integer().min(0).allow(null),
  category: Joi.string().valid(...eventCategoryValues).default('autre'),
  status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').default('published'),
  has_ticketing: Joi.boolean().default(false),
  max_capacity: Joi.number().integer().min(0).allow(null),
  is_free: Joi.boolean().default(false),
  organizer_name: Joi.string().trim().max(200).allow('', null),
  organizer_email: Joi.string().email().max(255).allow('', null),
  organizer_phone: Joi.string().trim().max(30).allow('', null),
  target_audience: Joi.string().valid('particulier', 'pro').default('particulier'),
  kind: Joi.string().valid('event', 'concert').default('event'),
  ticket_types: Joi.array().items(ticketTypeSchema).default([]),
  website_url: Joi.string().uri().allow('', null),
  price_xpf: Joi.number().integer().min(0).default(0),
});

const reserveSchema = Joi.object({
  buyer_email: Joi.string().email().max(255).required(),
  buyer_name: Joi.string().trim().min(2).max(200).required(),
  buyer_phone: Joi.string().trim().max(30).allow('', null),
  provider: Joi.string().valid('stripe').default('stripe'),
  items: Joi.array().items(
    Joi.object({
      ticket_type_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
});

const scanSchema = Joi.object({
  location: Joi.string().trim().max(255).allow('', null),
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 24);
    const events = await listPublicEvents({
      limit,
      category: req.query.category || req.query.kind || '',
      commune: req.query.commune || '',
    });
    return res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, validate(createEventSchema), async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Connexion requise.' });
    }

    const event = await createEventAndBonPlan({
      user: req.user,
      payload: req.body,
    });

    return res.status(201).json({
      data: event,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reservations', optionalAuth, validate(reserveSchema), async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const result = await reserveEventTickets({
      eventId,
      buyer: {
        userId: req.user?.id || null,
        email: req.body.buyer_email,
        name: req.body.buyer_name,
        phone: req.body.buyer_phone || null,
      },
      items: req.body.items,
      provider: req.body.provider,
      demoMode: process.env.DEMO_MODE === 'true',
    });

    if (result.order?.status === 'paid') {
      await sendTicketEmail(result.order, result.tickets).catch(() => {});
    }

    return res.status(201).json({
      data: {
        order: result.order,
        tickets: result.tickets,
        checkout_url: result.checkout_url,
        client_secret: result.client_secret || null,
        session_id: result.session_id || null,
        payment_id: result.payment_id || null,
        provider: result.provider,
        demo: Boolean(result.demo),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/tickets/:token', optionalAuth, async (req, res, next) => {
  try {
    const ticket = await getTicketByToken(req.params.token);
    if (!ticket) {
      return res.status(404).json({ error: 'Billet introuvable.' });
    }
    return res.json({ data: serializeTicketForViewer(ticket, req.user) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const event = await getPublicEventById(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable.' });
    }
    return res.json({ data: event });
  } catch (err) {
    next(err);
  }
});

router.post('/tickets/:token/scan', authenticate, scanLimiter, validate(scanSchema), async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Connexion requise.' });
    }

    const result = await scanTicket({
      token: req.params.token,
      scannerUser: req.user,
      location: req.body.location || null,
    });

    return res.json({
      data: {
        ticket: serializeTicketForViewer(result.ticket, req.user),
        already_scanned: Boolean(result.already_scanned),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/jobs/expire', authenticate, async (_req, res, next) => {
  try {
    const result = await expireEventTicketReservations();
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
