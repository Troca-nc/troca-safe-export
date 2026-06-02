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
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { messageLimiter } = require('../middleware/rateLimit');
const { emitNewMessage, emitConversationRead } = require('../services/websocketServer');
const { sendNewMessageEmail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { notifyNewMessage } = require('../services/notificationService');
const { maybeSendAutoReply } = require('../services/autoReplyService');
const {
  archiveConversation,
  appendConversationMessage,
  createHttpError,
  listConversationsForUser,
  loadConversationThread,
  loadConversationAttachmentForUser,
  loadMessageNotificationTarget,
  markConversationMessagesRead,
  startConversation,
} = require('../services/messageConversationService');
const { verifyAttachmentDownloadToken } = require('../services/messageAttachmentAccess');

const router = express.Router();
router.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/attachments/') && req.query?.token) {
    return next();
  }
  return authenticate(req, res, next);
});

const startConversationSchema = Joi.object({
  annonce_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().trim()).optional(),
  listing_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().trim()).optional(),
  message: Joi.string().min(1).max(2000).required(),
}).or('annonce_id', 'listing_id');

const sendMessageSchema = Joi.object({
  type: Joi.string().valid('text', 'photo', 'audio', 'document').default('text'),
  content: Joi.string().max(2000).allow('', null).optional(),
  photo_url: Joi.string().max(500).allow('', null).optional(),
  audio_url: Joi.string().max(500).allow('', null).optional(),
  attachment_url: Joi.string().max(500).allow('', null).optional(),
  attachment_name: Joi.string().max(255).allow('', null).optional(),
  attachment_mime_type: Joi.string().max(120).allow('', null).optional(),
  attachment_size_bytes: Joi.number().integer().min(0).allow(null).optional(),
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

router.get('/attachments/:messageId/download', async (req, res, next) => {
  try {
    const messageId = Number(req.params.messageId);
    const token = String(req.query?.token || '').trim();
    let userId = req.user?.id || null;

    if (token) {
      const decoded = verifyAttachmentDownloadToken(token);
      if (Number(decoded.messageId) !== messageId) {
        throw createHttpError(401, 'Jeton de téléchargement invalide');
      }
      if (userId && Number(userId) !== Number(decoded.userId)) {
        throw createHttpError(403, 'Téléchargement non autorisé');
      }
      userId = decoded.userId;
    }

    if (!userId || !messageId) {
      throw createHttpError(401, 'Téléchargement non autorisé');
    }

    const attachment = await loadConversationAttachmentForUser(userId, messageId);
    await fs.access(attachment.filePath);
    res.download(attachment.filePath, attachment.attachment_name || path.basename(attachment.filePath));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Pièce jointe introuvable' });
    }
    if (err.status === 404) {
      return res.status(404).json({ error: err.message || 'Pièce jointe introuvable' });
    }
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

    const isTrocProposalMessage = result.message?.type === 'troc_proposal'
      || Boolean(result.message?.metadata?.proposal_id)
      || Boolean(result.message?.metadata?.troc_proposal_id);

    if (!isTrocProposalMessage) {
      loadMessageNotificationTarget(id, result.recipientId).then((target) => {
        if (!target) return;

        sendNewMessageEmail(target.email, target.prenom, sender, target.titre, id, result.recipientId).catch(() => {});
        const notificationBody = result.message.type === 'audio'
          ? 'Nouveau message vocal'
          : result.message.type === 'photo'
            ? 'Nouvelle photo partagée'
            : result.message.type === 'document'
              ? 'Nouveau document partagé'
              : result.message.content?.slice(0, 100) ?? 'Nouveau message';

        sendPushToUser(result.recipientId, {
          title: `💬 ${sender}`,
          body: notificationBody,
          data: { type: 'new_message', convId: id },
        }).catch(() => {});
        notifyNewMessage(result.recipientId, sender, target.titre ?? '', id).catch(() => {});
      }).catch(() => {});

      maybeSendAutoReply({
        conversationId: id,
        senderId: userId,
        recipientId: result.recipientId,
        sourceMessage: result.message,
      }).then((autoReply) => {
        if (!autoReply?.message) return;
        emitNewMessage(id, { ...autoReply.message, conversation_id: id }, autoReply.recipientId);
        sendPushToUser(autoReply.recipientId, {
          title: '💬 Réponse automatique',
          body: String(autoReply.message.content || '').slice(0, 120) || 'Réponse automatique',
          data: { type: 'new_message', convId: id },
        }).catch(() => {});
      }).catch(() => {});
    }

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
