'use strict';

const path = require('path');
const { query, withTransaction } = require('../config/database');
const {
  filterMessage,
  decodeStructuredMessage,
  maskPhoneNumbers,
  mapConversationRow,
  mapMessageRow,
} = require('./messagePresentation');
const { getSellerResponseTime } = require('./sellerInsightsService');

function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function encodeCursor(createdAt, id) {
  if (!createdAt || !id) return null;
  return Buffer.from(JSON.stringify({ created_at: createdAt, id })).toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    if (!parsed?.created_at || !parsed?.id) return null;
    return {
      created_at: parsed.created_at,
      id: Number(parsed.id),
    };
  } catch {
    return null;
  }
}

function getUploadRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
}

function resolveAttachmentFilePath(attachmentUrl) {
  const raw = String(attachmentUrl || '').trim();
  if (!raw) return null;

  try {
    const base = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const parsed = raw.startsWith('http://') || raw.startsWith('https://')
      ? new URL(raw)
      : new URL(raw, base);
    const marker = '/uploads/';
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;

    const relativePath = parsed.pathname.slice(index + marker.length).replace(/^\/+/, '');
    if (!relativePath) return null;

    const filePath = path.resolve(getUploadRoot(), relativePath);
    const root = `${getUploadRoot()}${path.sep}`;
    if (!filePath.startsWith(root) && filePath !== getUploadRoot()) return null;
    return filePath;
  } catch {
    return null;
  }
}

function buildConversationAccessClause(userParam = '$1') {
  return `(
    (COALESCE(c.conversation_type, 'listing_chat') = 'listing_chat' AND (c.buyer_id = ${userParam} OR c.seller_id = ${userParam}))
    OR (
      COALESCE(c.conversation_type, 'listing_chat') <> 'listing_chat'
      AND (
        c.buyer_id = ${userParam}
        OR c.seller_id = ${userParam}
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(c.metadata->'participant_ids', '[]'::jsonb)) AS participant_id(value)
          WHERE participant_id.value::int = ${userParam}
        )
      )
    )
  )`;
}

async function listConversationsForUser(userId) {
  const result = await query(`
    SELECT
      c.id, c.annonce_id, c.buyer_id, c.seller_id, c.status, c.conversation_type, c.metadata, c.created_at, c.updated_at,
      l.id AS listing_id,
      l.titre AS listing_title,
      l.prix AS listing_price,
      l.status AS listing_status,
      img.thumbnail_url AS listing_image,
      buyer.prenom AS buyer_first_name,
      buyer.nom AS buyer_last_name,
      buyer.avatar_url AS buyer_avatar,
      buyer.phone_verified AS buyer_phone_verified,
      CASE WHEN buyer.is_pro = TRUE AND (buyer.pro_expires_at IS NULL OR buyer.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS buyer_is_pro,
      buyer.trust_score AS buyer_trust_score,
      buyer.trust_level AS buyer_trust_level,
      buyer.note_moyenne AS buyer_note_moyenne,
      buyer.nb_avis AS buyer_nb_avis,
      seller.prenom AS seller_first_name,
      seller.nom AS seller_last_name,
      seller.avatar_url AS seller_avatar,
      seller.phone_verified AS seller_phone_verified,
      CASE WHEN seller.is_pro = TRUE AND (seller.pro_expires_at IS NULL OR seller.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS seller_is_pro,
      seller.trust_score AS seller_trust_score,
      seller.trust_level AS seller_trust_level,
      seller.note_moyenne AS seller_note_moyenne,
      seller.nb_avis AS seller_nb_avis,
      last_msg.content AS last_message,
      last_msg.created_at AS last_message_at,
      last_msg.type AS last_message_type,
      last_msg.sender_id AS last_sender_id,
      (SELECT COUNT(*) FROM messages m
       WHERE m.conv_id = c.id
         AND m.sender_id != $1
         AND m.read_at IS NULL) AS unread_count
    FROM conversations c
    JOIN users buyer  ON buyer.id = c.buyer_id
    JOIN users seller ON seller.id = c.seller_id
    LEFT JOIN annonces l ON l.id = c.annonce_id
    LEFT JOIN LATERAL (
      SELECT thumbnail_url FROM annonce_images
       WHERE annonce_id = c.annonce_id AND is_cover = TRUE
       LIMIT 1
    ) img ON TRUE
    LEFT JOIN LATERAL (
      SELECT id AS last_message_id, content, created_at, sender_id, type, attachment_name AS last_message_attachment_name
      FROM messages
      WHERE conv_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) last_msg ON TRUE
    WHERE ${buildConversationAccessClause('$1')}
      AND CASE
            WHEN COALESCE(c.conversation_type, 'listing_chat') = 'listing_chat'
              THEN CASE WHEN c.buyer_id = $1 THEN c.is_archived_buyer = FALSE
                        ELSE c.is_archived_seller = FALSE END
            ELSE TRUE
          END
    ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
  `, [userId]);

  const sellerIds = [...new Set(
    result.rows
      .map((row) => Number(row.seller_id))
      .filter((value) => Number.isFinite(value) && value > 0)
  )];
  const sellerInsights = new Map();
  await Promise.all(sellerIds.map(async (sellerId) => {
    const response = await getSellerResponseTime(query, sellerId).catch(() => ({
      avg_response_time_minutes: null,
      avg_response_time_label: null,
    }));
    sellerInsights.set(sellerId, response);
  }));

  return result.rows.map((row) => {
    const insight = sellerInsights.get(Number(row.seller_id)) || {};
    return mapConversationRow({
      ...row,
      seller_avg_response_time_minutes: insight.avg_response_time_minutes ?? null,
      seller_avg_response_time_label: insight.avg_response_time_label ?? null,
      buyer_avg_response_time_minutes: null,
      buyer_avg_response_time_label: null,
    }, userId);
  });
}

async function loadConversationThread(userId, conversationId, page = 1, limit = 30, before = null) {
  const convResult = await query(
    `SELECT c.id, c.annonce_id, c.buyer_id, c.seller_id, c.status, c.conversation_type, c.metadata, c.created_at, c.updated_at,
            a.titre AS listing_title, a.prix AS listing_price, a.status AS listing_status,
            img.thumbnail_url AS listing_image
     FROM conversations c
     JOIN annonces a ON a.id = c.annonce_id
     LEFT JOIN LATERAL (
       SELECT thumbnail_url FROM annonce_images
       WHERE annonce_id = c.annonce_id AND is_cover = TRUE
       LIMIT 1
     ) img ON TRUE
     WHERE c.id = $1 AND ${buildConversationAccessClause('$2')}`,
    [conversationId, userId]
  );

  if (!convResult.rows[0]) {
    throw createHttpError(403, 'Conversation introuvable');
  }

  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 30));
  const cursor = decodeCursor(before);
  let messages;

  if (cursor) {
    messages = await query(`
      SELECT
        m.id, m.content, m.photo_url, m.attachment_url, m.attachment_name, m.attachment_mime_type, m.attachment_size_bytes, m.type, m.read_at, m.created_at, m.sender_id,
        o.id AS offer_id,
        o.amount_xpf AS offer_amount_xpf,
        o.status AS offer_status,
        o.expires_at AS offer_expires_at,
        o.responded_at AS offer_responded_at
      FROM messages m
      LEFT JOIN message_offers o ON o.message_id = m.id
      WHERE m.conv_id = $1
        AND (
          m.created_at < $2::timestamptz
          OR (m.created_at = $2::timestamptz AND m.id < $3)
        )
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $4
    `, [conversationId, cursor.created_at, cursor.id, safeLimit]);
  } else {
    const offset = (page - 1) * safeLimit;
    messages = await query(`
      SELECT
        m.id, m.content, m.photo_url, m.attachment_url, m.attachment_name, m.attachment_mime_type, m.attachment_size_bytes, m.type, m.read_at, m.created_at, m.sender_id,
        o.id AS offer_id,
        o.amount_xpf AS offer_amount_xpf,
        o.status AS offer_status,
        o.expires_at AS offer_expires_at,
        o.responded_at AS offer_responded_at
      FROM messages m
      LEFT JOIN message_offers o ON o.message_id = m.id
      WHERE m.conv_id = $1
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $2 OFFSET $3
    `, [conversationId, safeLimit, offset]);
  }

  const conversation = convResult.rows[0];
  const proposalIds = [...new Set(
    messages.rows
      .map((row) => decodeStructuredMessage(row.content))
      .map((decoded) => Number(decoded.metadata?.proposal_id || decoded.metadata?.troc_proposal_id || 0))
      .filter((value) => Number.isFinite(value) && value > 0)
  )];

  let proposalStatusMap = new Map();
  if (proposalIds.length > 0) {
    const proposalStatusResult = await query(
      `SELECT id, status FROM troc_proposals WHERE id = ANY($1::int[])`,
      [proposalIds]
    );
    proposalStatusMap = new Map(proposalStatusResult.rows.map((row) => [Number(row.id), row.status]));
  }

  const orderedMessages = messages.rows.reverse().map((row) => {
    const decoded = decodeStructuredMessage(row.content);
    const proposalId = Number(decoded.metadata?.proposal_id || decoded.metadata?.troc_proposal_id || 0);
    if (proposalId && proposalStatusMap.has(proposalId)) {
      return {
        ...row,
        proposal_status: proposalStatusMap.get(proposalId),
      };
    }
    return row;
  });
  const nextCursor = orderedMessages[0]
    ? encodeCursor(orderedMessages[0].created_at, orderedMessages[0].id)
    : null;
  return {
    conversation: {
      id: conversation.id,
      annonce_id: conversation.annonce_id,
      buyer_id: conversation.buyer_id,
      seller_id: conversation.seller_id,
      status: conversation.status,
      conversation_type: conversation.conversation_type || 'listing_chat',
      metadata: conversation.metadata || {},
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      annonce: {
        id: conversation.annonce_id,
        titre: conversation.listing_title,
        prix: conversation.listing_price,
        image: conversation.listing_image,
        statut: conversation.listing_status,
      },
    },
    messages: orderedMessages.map((msg) => mapMessageRow(msg, conversationId, userId)),
    pagination: {
      page,
      limit: safeLimit,
      has_more: messages.rows.length === safeLimit,
      before: nextCursor,
    },
  };
}

async function markConversationMessagesRead(conversationId, userId) {
  const result = await query(`
    UPDATE messages
    SET read_at = NOW()
    WHERE conv_id = $1
      AND sender_id != $2
      AND read_at IS NULL
    RETURNING id
  `, [conversationId, userId]);

  return result.rowCount ?? result.rows.length ?? 0;
}

async function startConversation(userId, listingId, message) {
  const listingResult = await query(
    'SELECT id, user_id, titre, status FROM annonces WHERE id = $1',
    [listingId]
  );
  const listing = listingResult.rows[0];

  if (!listing) {
    throw createHttpError(404, 'Annonce introuvable');
  }
  if (Number(listing.user_id) === Number(userId)) {
    throw createHttpError(400, 'Vous ne pouvez pas vous écrire à vous-même');
  }
  if (listing.status !== 'active') {
    throw createHttpError(400, "Cette annonce n'est plus disponible");
  }

  const trustResult = await query(
    `SELECT trust_score, trust_level, banned_until
     FROM users
     WHERE id = $1`,
    [listing.user_id]
  );
  const sellerTrust = trustResult.rows[0];
  if (sellerTrust?.banned_until && new Date(sellerTrust.banned_until) > new Date()) {
    throw createHttpError(403, 'Ce vendeur est temporairement suspendu.');
  }

  const pendingReports = await query(
    `SELECT COUNT(*) AS pending
     FROM signalements s
     JOIN annonces a ON a.id = s.annonce_id
     WHERE a.user_id = $1 AND s.status = 'pending'`,
    [listing.user_id]
  );

  if (parseInt(pendingReports.rows[0].pending, 10) > 3) {
    throw createHttpError(403, 'Ce vendeur est temporairement suspendu suite à des signalements en cours.');
  }

  return withTransaction(async (client) => {
    let conv = await client.query(
      'SELECT id FROM conversations WHERE annonce_id = $1 AND buyer_id = $2',
      [listingId, userId]
    );

    let conversationId;
    if (conv.rows[0]) {
      conversationId = conv.rows[0].id;
    } else {
      const newConv = await client.query(`
        INSERT INTO conversations (annonce_id, buyer_id, seller_id)
        VALUES ($1, $2, $3) RETURNING id
      `, [listingId, userId, listing.user_id]);
      conversationId = newConv.rows[0].id;
    }

    const msg = await client.query(`
      INSERT INTO messages (conv_id, sender_id, type, content)
      VALUES ($1, $2, 'text', $3)
      RETURNING id, content, created_at, type, sender_id
    `, [conversationId, userId, message]);

    return {
      conversationId,
      message: mapMessageRow(msg.rows[0], conversationId, userId),
      sellerId: listing.user_id,
    };
  });
}

async function appendConversationMessage(userId, conversationId, payload) {
  const conv = await query(
    `SELECT id, buyer_id, seller_id, conversation_type, metadata
     FROM conversations
     WHERE id = $1 AND ${buildConversationAccessClause('$2')}`,
    [conversationId, userId]
  );
  if (!conv.rows[0]) {
    throw createHttpError(403, 'Conversation introuvable');
  }

  const type = payload.type || 'text';
  let content = payload.content || '';
  const photoUrl = payload.photo_url || payload.audio_url || null;
  const attachmentUrl = payload.attachment_url || null;
  const attachmentName = payload.attachment_name || null;
  const attachmentMimeType = payload.attachment_mime_type || null;
  const attachmentSizeBytes = Number.isFinite(Number(payload.attachment_size_bytes))
    ? Number(payload.attachment_size_bytes)
    : null;

  if (type === 'text') {
    const { blocked, reason } = filterMessage(content);
    if (blocked) {
      const message = reason === 'lien_externe'
        ? 'Les liens externes ne sont pas autorisés dans les messages pour votre sécurité. Échangez directement via Troca.'
        : 'Ce message a été bloqué car il contient du contenu potentiellement frauduleux. Échangez directement via Troca.';
      const err = createHttpError(422, message);
      err.reason = reason;
      throw err;
    }
    content = maskPhoneNumbers(content);
  }

  if ((type === 'photo' || type === 'audio') && !photoUrl) {
    throw createHttpError(400, 'Fichier joint manquant');
  }

  if (type === 'document') {
    if (!attachmentUrl) {
      throw createHttpError(400, 'Document joint manquant');
    }
    if (!attachmentName) {
      throw createHttpError(400, 'Nom du document manquant');
    }
  }

  const result = await withTransaction(async (client) => {
    const msg = await client.query(`
      INSERT INTO messages (
        conv_id, sender_id, type, content, photo_url,
        attachment_url, attachment_name, attachment_mime_type, attachment_size_bytes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, content, photo_url, attachment_url, attachment_name, attachment_mime_type, attachment_size_bytes, sender_id, type, read_at, created_at
    `, [
      conversationId,
      userId,
      type,
      type === 'text' ? content : null,
      type === 'photo' || type === 'audio' ? photoUrl : null,
      type === 'document' ? attachmentUrl : null,
      type === 'document' ? attachmentName : null,
      type === 'document' ? attachmentMimeType : null,
      type === 'document' ? attachmentSizeBytes : null,
    ]);

    await client.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    return msg.rows[0];
  });

  const recipientId = Number(conv.rows[0].buyer_id) === Number(userId)
    ? conv.rows[0].seller_id
    : conv.rows[0].buyer_id;

  return {
    message: mapMessageRow(result, conversationId, userId),
    recipientId,
    conversationId,
  };
}

async function loadConversationAttachmentForUser(userId, messageId) {
  const result = await query(`
    SELECT
      m.id,
      m.conv_id,
      m.sender_id,
      m.type,
      m.attachment_url,
      m.attachment_name,
      m.attachment_mime_type,
      m.attachment_size_bytes,
      c.buyer_id,
      c.seller_id,
      c.conversation_type,
      c.metadata
    FROM messages m
    JOIN conversations c ON c.id = m.conv_id
    WHERE m.id = $1
      AND ${buildConversationAccessClause('$2')}
  `, [messageId, userId]);

  const row = result.rows[0];
  if (!row) {
    throw createHttpError(404, 'Pièce jointe introuvable');
  }

  if (!row.attachment_url || !row.attachment_name) {
    throw createHttpError(404, 'Pièce jointe introuvable');
  }

  const filePath = resolveAttachmentFilePath(row.attachment_url);
  if (!filePath) {
    throw createHttpError(404, 'Pièce jointe introuvable');
  }

  return {
    messageId: row.id,
    conv_id: row.conv_id,
    attachment_url: row.attachment_url,
    attachment_name: row.attachment_name,
    attachment_mime_type: row.attachment_mime_type,
    attachment_size_bytes: row.attachment_size_bytes,
    filePath,
  };
}

async function loadMessageNotificationTarget(conversationId, recipientId) {
  const result = await query(`
    SELECT u.email, u.prenom, a.titre
    FROM users u
    JOIN conversations c ON c.id = $1
    JOIN annonces a ON a.id = c.annonce_id
    WHERE u.id = $2
  `, [conversationId, recipientId]);

  return result.rows[0] || null;
}

async function archiveConversation(userId, conversationId) {
  const conv = await query(
    `SELECT id, buyer_id, seller_id, conversation_type, metadata
     FROM conversations
     WHERE id = $1 AND ${buildConversationAccessClause('$2')}`,
    [conversationId, userId]
  );
  if (!conv.rows[0]) {
    throw createHttpError(404, 'Conversation introuvable');
  }

  const isBuyer = Number(conv.rows[0].buyer_id) === Number(userId);
  const field = isBuyer ? 'is_archived_buyer' : 'is_archived_seller';

  await query(`UPDATE conversations SET ${field} = TRUE WHERE id = $1`, [conversationId]);
  return true;
}

module.exports = {
  archiveConversation,
  appendConversationMessage,
  decodeCursor,
  createHttpError,
  encodeCursor,
  listConversationsForUser,
  loadConversationThread,
  loadMessageNotificationTarget,
  loadConversationAttachmentForUser,
  markConversationMessagesRead,
  startConversation,
};
