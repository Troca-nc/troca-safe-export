ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_boost_activated BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_offer_received BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_listing_expiring BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_listing_expired BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS boost_activated_unsubscribe_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS offer_received_unsubscribe_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS listing_expiring_unsubscribe_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS listing_expired_unsubscribe_token VARCHAR(64);

UPDATE notification_preferences
SET boost_activated_unsubscribe_token = COALESCE(
      boost_activated_unsubscribe_token,
      substr(md5(random()::text || clock_timestamp()::text || user_id::text) || md5(clock_timestamp()::text || random()::text || user_id::text), 1, 64)
    ),
    offer_received_unsubscribe_token = COALESCE(
      offer_received_unsubscribe_token,
      substr(md5(random()::text || clock_timestamp()::text || user_id::text || 'offer') || md5(clock_timestamp()::text || random()::text || user_id::text || 'offer'), 1, 64)
    ),
    listing_expiring_unsubscribe_token = COALESCE(
      listing_expiring_unsubscribe_token,
      substr(md5(random()::text || clock_timestamp()::text || user_id::text || 'expiring') || md5(clock_timestamp()::text || random()::text || user_id::text || 'expiring'), 1, 64)
    ),
    listing_expired_unsubscribe_token = COALESCE(
      listing_expired_unsubscribe_token,
      substr(md5(random()::text || clock_timestamp()::text || user_id::text || 'expired') || md5(clock_timestamp()::text || random()::text || user_id::text || 'expired'), 1, 64)
    )
WHERE boost_activated_unsubscribe_token IS NULL
   OR offer_received_unsubscribe_token IS NULL
   OR listing_expiring_unsubscribe_token IS NULL
   OR listing_expired_unsubscribe_token IS NULL;

ALTER TABLE notification_preferences
  ALTER COLUMN boost_activated_unsubscribe_token SET NOT NULL,
  ALTER COLUMN offer_received_unsubscribe_token SET NOT NULL,
  ALTER COLUMN listing_expiring_unsubscribe_token SET NOT NULL,
  ALTER COLUMN listing_expired_unsubscribe_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_boost_unsubscribe
  ON notification_preferences (boost_activated_unsubscribe_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_offer_unsubscribe
  ON notification_preferences (offer_received_unsubscribe_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_listing_expiring_unsubscribe
  ON notification_preferences (listing_expiring_unsubscribe_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_listing_expired_unsubscribe
  ON notification_preferences (listing_expired_unsubscribe_token);
