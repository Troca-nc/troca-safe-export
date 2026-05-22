'use strict';

const BLOCKED_PATTERNS = [
  { pattern: /https?:\/\//i, reason: 'lien_externe' },
  { pattern: /www\.[a-z0-9-]+\.[a-z]{2,}/i, reason: 'lien_externe' },
  { pattern: /western.?union/i, reason: 'arnaque_paiement' },
  { pattern: /moneygram/i, reason: 'arnaque_paiement' },
  { pattern: /paypal\.me\//i, reason: 'arnaque_paiement' },
  { pattern: /bit\.?coin|crypto|ethereum/i, reason: 'crypto_paiement' },
  { pattern: /t\.me\/|telegram\.me\//i, reason: 'redirect_externe' },
  { pattern: /je suis.{0,30}(Ã©tranger|voyage|expatriÃ©)/i, reason: 'arnaque_eloignement' },
];

function filterMessage(content) {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return { blocked: true, reason };
    }
  }
  return { blocked: false };
}

function maskPhoneNumbers(content) {
  return content.replace(
    /(\+687|00687)?[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}/g,
    '[numéro masqué — échangez via Troca]'
  );
}

function mapConversationRow(row, currentUserId) {
  const isBuyer = Number(row.buyer_id) === Number(currentUserId);
  const other = isBuyer
    ? {
        id: row.seller_id,
        prenom: row.seller_first_name,
        nom: row.seller_last_name,
        avatar_url: row.seller_avatar,
        telephone_verifie: row.seller_phone_verified,
        is_pro: row.seller_is_pro,
        trust_score: row.seller_trust_score,
        trust_level: row.seller_trust_level,
      }
    : {
        id: row.buyer_id,
        prenom: row.buyer_first_name,
        nom: row.buyer_last_name,
        avatar_url: row.buyer_avatar,
        telephone_verifie: row.buyer_phone_verified,
        is_pro: row.buyer_is_pro,
        trust_score: row.buyer_trust_score,
        trust_level: row.buyer_trust_level,
      };

  return {
    id: row.id,
    annonce_id: row.annonce_id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    status: row.status,
    unread_count: Number(row.unread_count || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    annonce: {
      id: row.listing_id,
      titre: row.listing_title,
      prix: row.listing_price,
      image: row.listing_image,
      statut: row.listing_status,
    },
    other_user: other,
    last_message: row.last_message
      ? {
          type: row.last_message_type,
          content: row.last_message,
          sender_id: row.last_sender_id,
          created_at: row.last_message_at,
        }
      : undefined,
  };
}

function mapMessageRow(msg, convId) {
  return {
    id: msg.id,
    conv_id: Number(convId),
    sender_id: msg.sender_id,
    type: msg.type,
    content: msg.content,
    photo_url: msg.photo_url,
    is_offer: msg.is_offer,
    offer: msg.offer || null,
    read_at: msg.read_at || null,
    created_at: msg.created_at,
  };
}

module.exports = {
  filterMessage,
  maskPhoneNumbers,
  mapConversationRow,
  mapMessageRow,
};
