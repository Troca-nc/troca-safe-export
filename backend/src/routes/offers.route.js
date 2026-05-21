'use strict';

// ============================================================
//  Troca — Routes offres de prix (message_offers)
//  POST /api/messages/offers           — Créer une offre
//  POST /api/messages/offers/:id/respond — Accepter / Refuser / Contre-offre
//  GET  /api/messages/conversations/:id/offers — Offres d'une conversation
// ============================================================

const { Router }          = require('express');
const Joi                 = require('joi');
const { authenticate }    = require('../middleware/auth');
const { validate }        = require('../middleware/validate');
const { query, withTransaction } = require('../config/database');
const { emitNewMessage }  = require('../services/websocketServer');
const { sendPushToUser }  = require('../services/pushService');
const { notifyOfferReceived } = require('../services/notificationService');

const router = Router();
router.use(authenticate);

// ── Schémas Joi ───────────────────────────────────────────────

const createSchema = {
  body: Joi.object({
    conv_id:    Joi.number().integer().positive().required(),
    amount_xpf: Joi.number().integer().positive().max(100_000_000).required(),
  }),
};

const respondSchema = {
  body: Joi.object({
    response:       Joi.string().valid('accepted', 'declined', 'countered').required(),
    counter_amount: Joi.number().integer().positive().max(100_000_000).optional(),
  }),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};

// ── POST /api/messages/offers ─────────────────────────────────

router.post('/', validate(createSchema), async (req, res, next) => {
  const { conv_id, amount_xpf } = req.body;
  const userId = req.user.id;

  try {
    const result = await withTransaction(async (client) => {
      // Vérifier que l'utilisateur est bien l'acheteur de la conversation
      const conv = await client.query(
        `SELECT c.id, c.buyer_id, c.seller_id, a.titre
         FROM conversations c
         JOIN annonces a ON a.id = c.annonce_id
         WHERE c.id = $1`,
        [conv_id]
      );
      if (!conv.rows[0]) throw Object.assign(new Error('Conversation introuvable'), { status: 404 });
      if (conv.rows[0].buyer_id !== userId) {
        throw Object.assign(new Error('Seul l\'acheteur peut faire une offre'), { status: 403 });
      }

      const { seller_id, titre } = conv.rows[0];

      // Créer le message système
      const msg = await client.query(
        `INSERT INTO messages (conv_id, sender_id, type, content)
         VALUES ($1, $2, 'offer', $3)
         RETURNING id, conv_id, sender_id, type, content, created_at`,
        [conv_id, userId, `Offre : ${amount_xpf.toLocaleString('fr-FR')} XPF`]
      );

      // Créer l'offre liée
      const offer = await client.query(
        `INSERT INTO message_offers (message_id, conv_id, buyer_id, amount_xpf)
         VALUES ($1, $2, $3, $4)
         RETURNING id, amount_xpf, status, expires_at`,
        [msg.rows[0].id, conv_id, userId, amount_xpf]
      );

      await client.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conv_id]);

      // Notifier le vendeur
      const buyerName = `${req.user.prenom} ${req.user.nom}`.trim();
      emitNewMessage(conv_id, { ...msg.rows[0], offer: offer.rows[0] }, seller_id);
      sendPushToUser(seller_id, {
        title: `💰 ${buyerName} vous fait une offre`,
        body:  `${amount_xpf.toLocaleString('fr-FR')} XPF pour "${titre}"`,
        data:  { type: 'offer_received', convId: conv_id },
      }).catch(() => {});
      notifyOfferReceived(seller_id, buyerName, amount_xpf, conv.rows[0].annonce_id).catch(() => {});

      return { message: msg.rows[0], offer: offer.rows[0] };
    });

    return res.status(201).json({ data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ── POST /api/messages/offers/:id/respond ────────────────────

router.post('/:id/respond', validate(respondSchema), async (req, res, next) => {
  const { id } = req.params;
  const { response, counter_amount } = req.body;
  const userId = req.user.id;

  try {
    const result = await withTransaction(async (client) => {
      // Récupérer l'offre + vérifier que c'est bien le vendeur qui répond
      const offerRes = await client.query(
        `SELECT o.*, c.seller_id, c.buyer_id, a.titre
         FROM message_offers o
         JOIN conversations c ON c.id = o.conv_id
         JOIN annonces a ON a.id = c.annonce_id
         WHERE o.id = $1`,
        [id]
      );

      const offer = offerRes.rows[0];
      if (!offer)                          throw Object.assign(new Error('Offre introuvable'), { status: 404 });
      if (offer.seller_id !== userId)      throw Object.assign(new Error('Non autorisé'), { status: 403 });
      if (offer.status !== 'pending')      throw Object.assign(new Error('Cette offre a déjà été traitée'), { status: 409 });
      if (new Date(offer.expires_at) < new Date()) {
        throw Object.assign(new Error('Cette offre est expirée'), { status: 410 });
      }

      let newStatus = response === 'accepted' ? 'accepted'
                    : response === 'declined' ? 'declined'
                    : 'countered';

      // Mettre à jour l'offre originale
      await client.query(
        `UPDATE message_offers
         SET status = $1, responded_at = NOW()
         WHERE id = $2`,
        [newStatus, id]
      );

      // Créer le message système de réponse
      const replyContent = response === 'accepted'
        ? `✅ Offre de ${offer.amount_xpf.toLocaleString('fr-FR')} XPF acceptée !`
        : response === 'declined'
          ? `❌ Offre de ${offer.amount_xpf.toLocaleString('fr-FR')} XPF refusée`
          : `🔄 Contre-offre : ${counter_amount?.toLocaleString('fr-FR')} XPF`;

      const replyMsg = await client.query(
        `INSERT INTO messages (conv_id, sender_id, type, content)
         VALUES ($1, $2, 'system', $3)
         RETURNING id, conv_id, sender_id, type, content, created_at`,
        [offer.conv_id, userId, replyContent]
      );

      // Si contre-offre, créer une nouvelle offre
      let counterOffer = null;
      if (response === 'countered' && counter_amount) {
        const co = await client.query(
          `INSERT INTO message_offers (message_id, conv_id, buyer_id, amount_xpf)
           VALUES ($1, $2, $3, $4)
           RETURNING id, amount_xpf, status, expires_at`,
          [replyMsg.rows[0].id, offer.conv_id, offer.buyer_id, counter_amount]
        );
        // Relier
        await client.query(
          'UPDATE message_offers SET counter_offer_id = $1 WHERE id = $2',
          [co.rows[0].id, id]
        );
        counterOffer = co.rows[0];
      }

      await client.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [offer.conv_id]);

      // Notifier l'acheteur
      const sellerName = `${req.user.prenom} ${req.user.nom}`.trim();
      emitNewMessage(offer.conv_id, replyMsg.rows[0], offer.buyer_id);
      sendPushToUser(offer.buyer_id, {
        title: response === 'accepted' ? '✅ Offre acceptée !' : response === 'declined' ? '❌ Offre refusée' : `🔄 Contre-offre de ${counter_amount?.toLocaleString('fr-FR')} XPF`,
        body:  `Pour l'annonce "${offer.titre}"`,
        data:  { type: `offer_${response}`, convId: offer.conv_id },
      }).catch(() => {});

      return { message: replyMsg.rows[0], offer: { ...offer, status: newStatus }, counterOffer };
    });

    return res.json({ data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ── GET /api/messages/conversations/:id/offers ───────────────

router.get('/conversations/:id/offers', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.id, o.amount_xpf, o.status, o.expires_at, o.responded_at,
              o.buyer_id, o.message_id
       FROM message_offers o
       WHERE o.conv_id = $1
       ORDER BY o.id DESC`,
      [req.params.id]
    );
    return res.json({ data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
