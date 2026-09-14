CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE pro_bookings
SET booking_access_token = encode(digest(booking_access_token, 'sha256'), 'hex')
WHERE booking_access_token IS NOT NULL;
