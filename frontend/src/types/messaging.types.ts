// src/types/messaging.types.ts

export type MessageType    = 'text' | 'offer' | 'photo' | 'audio' | 'document' | 'system'
export type OfferStatus    = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired'
export type ConvStatus     = 'active' | 'archived' | 'blocked'

// ── Conversation ──────────────────────────────────────────────────────────────

export interface Conversation {
  id:              number
  annonce_id:      number
  buyer_id:        number
  seller_id:       number
  status:          ConvStatus
  last_message?:   Message
  unread_count:    number
  created_at:      string
  updated_at:      string
  annonce: {
    id:      number
    titre:   string
    prix:    number | null
    image?:  string
    statut:  string
  }
  other_user: {
    id:         number
    prenom:     string
    nom:        string
    avatar_url: string | null
    telephone_verifie: boolean
    is_pro:     boolean
    last_seen?: string
    is_online?: boolean
    last_seen_at?: string | null
    last_seen_label?: string | null
    note_moyenne?: number | null
    nb_avis?: number | null
    avg_response_time_minutes?: number | null
    avg_response_time_label?: string | null
  }
}

// ── Message ───────────────────────────────────────────────────────────────────

export interface Message {
  id:          number
  conv_id:     number
  sender_id:   number
  type:        MessageType
  content:     string | null       // texte pour type=text/system
  photo_url?:  string | null       // pour type=photo/audio
  attachment_url?: string | null
  attachment_download_url?: string | null
  attachment_name?: string | null
  attachment_mime_type?: string | null
  attachment_size_bytes?: number | null
  offer?:      MessageOffer        // pour type=offer
  read_at?:    string | null
  created_at:  string
  // client-side only
  pending?:    boolean             // optimistic update
  failed?:     boolean
}

export interface MessageOffer {
  id:          number
  amount_xpf:  number
  status:      OfferStatus
  expires_at:  string
  responded_at?: string
}

// ── WebSocket events ──────────────────────────────────────────────────────────

export type WsEventType =
  | 'message:new'
  | 'message:read'
  | 'offer:updated'
  | 'conv:typing'
  | 'conv:stop_typing'
  | 'user:online'
  | 'user:offline'

export interface WsEvent<T = unknown> {
  type:    WsEventType
  payload: T
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  conv_id:   number
  type:      MessageType
  content?:  string
  photo_url?: string
  attachment_url?: string
  attachment_name?: string
  attachment_mime_type?: string
  attachment_size_bytes?: number
  offer_amount?: number          // pour type=offer
}

export interface MakeOfferPayload {
  conv_id:      number
  amount_xpf:   number
}

export interface RespondOfferPayload {
  offer_id:     number
  response:     'accepted' | 'declined' | 'countered'
  counter_amount?: number        // si response=countered
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface PushToken {
  user_id:   number
  token:     string              // token Expo
  platform:  'ios' | 'android'
  created_at: string
}
