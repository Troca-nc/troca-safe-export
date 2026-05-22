// ============================================================
//  Routes — Messagerie
//  GET  /api/messages/conversations
//  GET  /api/messages/conversations/:id
//  POST /api/messages/conversations
//  POST /api/messages/conversations/:id
//  DELETE /api/messages/conversations/:id
// ============================================================

const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { messageLimiter } = require('../middleware/rateLimit');
const { emitNewMessage, emitConversationRead } = require('../services/websocketServer');
const { sendNewMessageEmail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { notifyNewMessage } = require('../services/notificationService');
const {
  archiveConversation,
  appendConversationMessage,
  listConversationsForUser,
  loadConversationThread,
  loadMessageNotificationTarget,
  markConversationMessagesRead,
  startConversation,
} = require('../services/messageConversationService');

const router = express.Router();
router.use(authenticate);

const startConversationSchema = Joi.object({
  annonce_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().trim()).optional(),
  listing_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().trim()).optional(),
  message: Joi.string().min(1).max(2000).required(),
}).or('annonce_id', 'listing_id');

const sendMessageSchema = Joi.object({
  type: Joi.string().valid('text', 'photo').default('text'),
  content: Joi.string().max(2000).allow('', null).optional(),
  photo_url: Joi.string().max(500).allow('', null).optional(),
});

router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await listConversationsForUser(req.user.id);
    res.json({ data: conversations });
  } catch (err) {
    next(err);
  }
});

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const before = req.query.before || null;

    const thread = await loadConversationThread(userId, id, page, limit, before);
    res.json({
      data: {
        conversation: thread.conversation,
        messages: thread.messages,
      },
      pagination: thread.pagination,
    });
  } catch (err) {
    next(err);
  }
});

// TODO: test E2E sur l'ouverture de conversation, le PATCH read et le double-check.
router.patch('/conversations/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const readCount = await markConversationMessagesRead(id, userId);
    if (readCount > 0) {
      await emitConversationRead(id, userId, readCount);
    }

    res.json({
      data: {
        conversation_id: Number(id),
        read_count: readCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations', messageLimiter, validate({ body: startConversationSchema }), async (req, res, next) => {
  try {
    const buyerId = req.user.id;
    const listingId = req.body.listing_id ?? req.body.annonce_id;
    const { message } = req.body;

    const result = await startConversation(buyerId, listingId, message);

    res.status(201).json({
      message: 'Conversation démarrée',
      data: {
        conversationId: result.conversationId,
        message: result.message,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations/:id', messageLimiter, validate({ body: sendMessageSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await appendConversationMessage(userId, id, req.body);
    const sender = `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() || 'Un utilisateur';

    emitNewMessage(id, { ...result.message, conversation_id: id }, result.recipientId);

    loadMessageNotificationTarget(id, result.recipientId).then((target) => {
      if (!target) return;

      sendNewMessageEmail(target.email, target.prenom, sender, target.titre, id).catch(() => {});
      sendPushToUser(result.recipientId, {
        title: `💬 ${sender}`,
        body: result.message.content?.slice(0, 100) ?? 'Nouveau message',
        data: { type: 'new_message', convId: id },
      }).catch(() => {});
      notifyNewMessage(result.recipientId, sender, target.titre ?? '', id).catch(() => {});
    }).catch(() => {});

    res.status(201).json({ data: result.message });
  } catch (err) {
    if (err.status === 422 && err.reason) {
      return res.status(422).json({
        error: err.message,
        reason: err.reason,
      });
    }
    next(err);
  }
});

router.delete('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await archiveConversation(userId, id);
    res.json({ message: 'Conversation archivée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
