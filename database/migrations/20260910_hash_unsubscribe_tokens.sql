CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE search_alerts
SET unsubscribe_token = encode(digest(unsubscribe_token, 'sha256'), 'hex');

UPDATE notification_preferences
SET new_message_unsubscribe_token = encode(digest(new_message_unsubscribe_token, 'sha256'), 'hex'),
    boost_activated_unsubscribe_token = encode(digest(boost_activated_unsubscribe_token, 'sha256'), 'hex'),
    offer_received_unsubscribe_token = encode(digest(offer_received_unsubscribe_token, 'sha256'), 'hex'),
    listing_expiring_unsubscribe_token = encode(digest(listing_expiring_unsubscribe_token, 'sha256'), 'hex'),
    listing_expired_unsubscribe_token = encode(digest(listing_expired_unsubscribe_token, 'sha256'), 'hex'),
    performance_report_unsubscribe_token = encode(digest(performance_report_unsubscribe_token, 'sha256'), 'hex');

UPDATE newsletter_subscriptions
SET unsubscribe_token = encode(digest(unsubscribe_token, 'sha256'), 'hex');