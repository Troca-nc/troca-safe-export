'use strict';

const { query, withTransaction } = require('../config/database');
const {
  filterMessage,
  maskPhoneNumbers,
  mapConversationRow,
  mapMessageRow,
} = require('./messagePresentation');

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

async function listConversationsForUser(userId) {
  const result = await query(`
    SELECT
      c.id, c.annonce_id, c.buyer_id, c.seller_id, c.status, c.created_at, c.updated_at,
      l.id AS listing_id,
      l.titre AS listing_title,
      l.prix AS listing_price,
      l.status AS listing_status,
      img.url AS listing_image,
      buyer.prenom AS buyer_first_name,
      buyer.nom AS buyer_last_name,
      buyer.avatar_url AS buyer_avatar,
      buyer.phone_verified AS buyer_phone_verified,
      buyer.is_pro AS buyer_is_pro,
      buyer.trust_score AS buyer_trust_score,
      buyer.trust_level AS buyer_trust_level,
      seller.prenom AS seller_first_name,
      seller.nom AS seller_last_name,
      seller.avatar_url AS seller_avatar,
      seller.phone_verified AS seller_phone_verified,
      seller.is_pro AS seller_is_pro,
      seller.trust_score AS seller_trust_score,
      seller.trust_level AS seller_trust_level,
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
      SELECT url FROM annonce_images
      WHERE annonce_id = c.annonce_id AND is_cover = TRUE
      LIMIT 1
    ) img ON TRUE
    LEFT JOIN LATERAL (
      SELECT content, created_at, sender_id, type
      FROM messages
      WHERE conv_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) last_msg ON TRUE
    WHERE (c.buyer_id = $1 OR c.seller_id = $1)
      AND CASE WHEN c.buyer_id = $1 THEN c.is_archived_buyer = FALSE
               ELSE c.is_archived_seller = FALSE END
    ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
  `, [userId]);

  return result.rows.map((row) => mapConversationRow(row, userId));
}

async function loadConversationThread(userId, conversationId, page = 1, limit = 30, before = null) {
  const convResult = await query(
    `SELECT c.id, c.annonce_id, c.buyer_id, c.seller_id, c.status, c.created_at, c.updated_at,
            a.titre AS listing_title, a.prix AS listing_price, a.status AS listing_status,
            img.url AS listing_image
     FROM conversations c
     JOIN annonces a ON a.id = c.annonce_id
     LEFT JOIN LATERAL (
       SELECT url FROM annonce_images
       WHERE annonce_id = c.annonce_id AND is_cover = TRUE
       LIMIT 1
     ) img ON TRUE
     WHERE c.id = $1 AND (c.buyer_id = $2 OR c.seller_id = $2)`,
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
        m.id, m.content, m.photo_url, m.type, m.read_at, m.created_at, m.sender_id,
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
        m.id, m.content, m.photo_url, m.type, m.read_at, m.created_at, m.sender_id,
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

  await query(`
    UPDATE messages SET read_at = NOW()
    WHERE conv_id = $1 AND sender_id != $2 AND read_at IS NULL
  `, [conversationId, userId]);

  const conversation = convResult.rows[0];
  const orderedMessages = messages.rows.reverse();
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
    messages: orderedMessages.map((msg) => mapMessageRow(msg, conversationId)),
    pagination: {
      page,
      limit: safeLimit,
      has_more: messages.rows.length === safeLimit,
      before: nextCursor,
    },
  };
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
      message: msg.rows[0],
      sellerId: listing.user_id,
    };
  });
}

async function appendConversationMessage(userId, conversationId, payload) {
  const conv = await query(
    'SELECT id, buyer_id, seller_id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
    [conversationId, userId]
  );
  if (!conv.rows[0]) {
    throw createHttpError(403, 'Conversation introuvable');
  }

  const type = payload.type || 'text';
  let content = payload.content || '';
  const photoUrl = payload.photo_url || null;

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

  const result = await withTransaction(async (client) => {
    const msg = await client.query(`
      INSERT INTO messages (conv_id, sender_id, type, content, photo_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, content, photo_url, sender_id, type, read_at, created_at
    `, [conversationId, userId, type, type === 'photo' ? null : content, type === 'photo' ? photoUrl : null]);

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
    message: result,
    recipientId,
    conversationId,
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
    'SELECT id, buyer_id, seller_id FROM conversations WHERE id = $1',
    [conversationId]
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
  startConversation,
};
