'use strict';

const express = require('express');

const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  createQuoteRequest,
  submitQuoteOffer,
  selectQuoteOffer,
  getQuoteRequestWithOffers,
  getMyQuoteRequests,
  getProQuoteRequests,
  getProOfferHistory,
  cancelQuoteRequest,
} = require('../services/quoteRequestService');

const router = express.Router();

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const request = await createQuoteRequest(req.body, req.user?.id ?? null);
    return res.status(201).json({ data: request });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.json({ data: [] });
    }
    const requests = await getMyQuoteRequests(req.user.id);
    return res.json({ data: requests });
  } catch (error) {
    next(error);
  }
});

router.get('/pro/incoming', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }
    const requests = await getProQuoteRequests(req.user.id);
    return res.json({ data: requests });
  } catch (error) {
    next(error);
  }
});

router.get('/pro/offers', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }
    const offers = await getProOfferHistory(req.user.id);
    return res.json({ data: offers });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const request = await getQuoteRequestWithOffers(Number(req.params.id), req.user?.id ?? null);
    return res.json({ data: request });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/offers', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }
    const offer = await submitQuoteOffer(Number(req.params.id), Number(req.user.id), Number(req.user.id), req.body);
    return res.status(201).json({ data: offer });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/select', authenticate, async (req, res, next) => {
  try {
    const offerId = Number(req.body?.offer_id);
    if (!Number.isFinite(offerId) || offerId <= 0) {
      return res.status(400).json({ error: 'Offre invalide.' });
    }
    const selection = await selectQuoteOffer(Number(req.params.id), offerId, Number(req.user.id), req.body?.method || 'manual');
    return res.json({ data: selection });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const cancelled = await cancelQuoteRequest(Number(req.params.id), Number(req.user.id));
    return res.json({ data: cancelled });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
