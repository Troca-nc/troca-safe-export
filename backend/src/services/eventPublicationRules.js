'use strict';

// Pure, unconnected publication quote. No entitlement, payment or activation.
// Callers must authenticate, count validated media, normalize dates and persist
// an immutable order before using a confirmed provider payment for activation.
const DAY_MS = 24 * 60 * 60 * 1000;
const EVENT_PUBLICATION_OFFER = Object.freeze({
  code: 'event_publication_v1',
  currency: 'XPF',
  amount_xpf: 490,
  max_photos: 6,
  max_visibility_days: 30,
  automatic_renewal: false,
});

function invalid(field) {
  const error = new TypeError(`Invalid publication field: ${field}`);
  error.code = 'INVALID_EVENT_PUBLICATION';
  error.field = field;
  return error;
}

function timestamp(value, field) {
  // Milliseconds since Unix epoch, explicitly normalized by the caller.
  // Reject strings and invalid Date ranges rather than guessing a time zone.
  if (!Number.isSafeInteger(value) || !Number.isFinite(new Date(value).getTime())) {
    throw invalid(field);
  }
  return value;
}

function quoteEventPublication(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('input');
  const now = timestamp(input.now_ms, 'now_ms');
  const starts = timestamp(input.visibility_starts_at_ms, 'visibility_starts_at_ms');
  const eventEnds = timestamp(input.event_ends_at_ms, 'event_ends_at_ms');
  if (starts < now) throw invalid('visibility_starts_at_ms');
  if (eventEnds <= starts) throw invalid('event_ends_at_ms');
  if (!Number.isInteger(input.photo_count) || input.photo_count < 0
      || input.photo_count > EVENT_PUBLICATION_OFFER.max_photos) throw invalid('photo_count');

  // Bound the addition by subtraction first to avoid overflowing the Date range.
  const duration = Math.min(eventEnds - starts, EVENT_PUBLICATION_OFFER.max_visibility_days * DAY_MS);
  return Object.freeze({
    ...EVENT_PUBLICATION_OFFER,
    visibility_starts_at_ms: starts,
    visibility_ends_at_ms: starts + duration,
    event_ends_at_ms: eventEnds,
    ends_before_event_end: starts + duration < eventEnds,
  });
}

module.exports = { EVENT_PUBLICATION_OFFER, quoteEventPublication };
