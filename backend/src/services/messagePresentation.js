'use strict';

const { buildAttachmentDownloadUrl } = require('./messageAttachmentAccess');
const { getPresenceLabel, getUserPresence } = require('./presenceService');

const BLOCKED_PATTERNS = [
  { pattern: /https?:\/\//i, reason: 'lien_externe' },
  { pattern: /www\.[a-z0-9-]+\.[a-z]{2,}/i, reason: 'lien_externe' },
  { pattern: /western.?union/i, reason: 'arnaque_paiement' },
  { pattern: /moneygram/i, reason: 'arnaque_paiement' },
  { pattern: /paypal\.me\//i, reason: 'arnaque_paiement' },
  { pattern: /bit\.?coin|crypto|ethereum/i, reason: 'crypto_paiement' },
  { pattern: /t\.me\/|telegram\.me\//i, reason: 'redirect_externe' },
  { pattern: /je suis.{0,30}(étranger|voyage|expatrié)/i, reason: 'arnaque_eloignement' },
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

function formatPreviewText(type, content) {
  if (content) return content;
  if (type === 'photo') return 'Photo';
  if (type === 'audio') return 'Message vocal';
  if (type === 'document') return 'Document partagé';
  if (type === 'offer') return 'Offre de prix';
  if (type === 'system') return 'Message système';
  return '';
}

function mapMessageRow(row, conversationId, currentUserId = null) {
  return {
    id: row.id,
    conv_id: Number(conversationId ?? row.conv_id),
    sender_id: row.sender_id,
    type: row.type,
    content: row.content ?? null,
    photo_url: row.photo_url ?? null,
    attachment_url: row.attachment_url ?? null,
    attachment_download_url: buildAttachmentDownloadUrl(row.id, currentUserId),
    attachment_name: row.attachment_name ?? null,
    attachment_mime_type: row.attachment_mime_type ?? null,
    attachment_size_bytes: row.attachment_size_bytes ?? null,
    read_at: row.read_at ?? null,
    created_at: row.created_at,
    offer: row.offer_id
      ? {
          id: row.offer_id,
          amount_xpf: row.offer_amount_xpf,
          status: row.offer_status,
          expires_at: row.offer_expires_at,
          responded_at: row.offer_responded_at,
        }
      : undefined,
  };
}

function mapConversationRow(row, currentUserId) {
  const isBuyer = Number(row.buyer_id) === Number(currentUserId);
  const baseOther = isBuyer
    ? {
        id: row.seller_id,
        prenom: row.seller_first_name,
        nom: row.seller_last_name,
        avatar_url: row.seller_avatar,
        telephone_verifie: row.seller_phone_verified,
        is_pro: row.seller_is_pro,
        trust_score: row.seller_trust_score,
        trust_level: row.seller_trust_level,
        note_moyenne: row.seller_note_moyenne,
        nb_avis: row.seller_nb_avis,
        avg_response_time_minutes: row.seller_avg_response_time_minutes ?? null,
        avg_response_time_label: row.seller_avg_response_time_label ?? null,
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
        note_moyenne: row.buyer_note_moyenne,
        nb_avis: row.buyer_nb_avis,
        avg_response_time_minutes: row.buyer_avg_response_time_minutes ?? null,
        avg_response_time_label: row.buyer_avg_response_time_label ?? null,
      };

  const presence = getUserPresence(baseOther.id);

  return {
    id: row.id,
    annonce_id: row.annonce_id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    status: row.status,
    conversation_type: row.conversation_type || 'listing_chat',
    metadata: row.metadata || {},
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
    other_user: {
      ...baseOther,
      is_online: presence.is_online,
      last_seen_at: presence.last_seen_at,
      last_seen_label: getPresenceLabel(presence),
    },
    last_message: row.last_message
      ? {
          type: row.last_message_type,
          content: formatPreviewText(row.last_message_type, row.last_message),
          attachment_download_url: buildAttachmentDownloadUrl(row.last_message_id, currentUserId),
          attachment_name: row.last_message_attachment_name ?? null,
          sender_id: row.last_sender_id,
          created_at: row.last_message_at,
        }
      : undefined,
  };
}

module.exports = {
  filterMessage,
  maskPhoneNumbers,
  mapConversationRow,
  mapMessageRow,
};
