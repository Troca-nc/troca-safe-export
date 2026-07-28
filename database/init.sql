\set ON_ERROR_STOP on

-- ============================================================
-- Kalico - initialisation complète de la base vide
-- Ordre:
--   1) schema.sql
--   2) migrations chronologiques
-- ============================================================

\echo '[init] Loading base schema...'
\i /docker-entrypoint-initdb-src/schema.sql

\echo '[init] Applying migrations...'
\i /docker-entrypoint-initdb-src/migrations/001_add_messaging.sql
\i /docker-entrypoint-initdb-src/migrations/002_add_monetisation.sql
\i /docker-entrypoint-initdb-src/migrations/003_add_phone_verification.sql
\i /docker-entrypoint-initdb-src/migrations/004_add_search_alerts.sql
\i /docker-entrypoint-initdb-src/migrations/005_add_push_tokens.sql
\i /docker-entrypoint-initdb-src/migrations/006_add_email_verification.sql
\i /docker-entrypoint-initdb-src/migrations/007_add_message_read.sql
\i /docker-entrypoint-initdb-src/migrations/008_add_image_variants_and_subscription_payment_status.sql
\i /docker-entrypoint-initdb-src/migrations/009_add_onboarding_step_and_listing_cursor_index.sql
\i /docker-entrypoint-initdb-src/migrations/010_add_payment_provider_tracking.sql
\i /docker-entrypoint-initdb-src/migrations/20260522_bon_plans.sql
\i /docker-entrypoint-initdb-src/migrations/20260522_categories_v2.sql
\i /docker-entrypoint-initdb-src/migrations/20260522_covoit_alerts.sql
\i /docker-entrypoint-initdb-src/migrations/20260522_pricing_v2.sql
\i /docker-entrypoint-initdb-src/migrations/20260522_troc.sql
\i /docker-entrypoint-initdb-src/migrations/20260527_add_annonce_images_sort_order.sql
\i /docker-entrypoint-initdb-src/migrations/20260527_add_users_commune_fk.sql
\i /docker-entrypoint-initdb-src/migrations/20260530_notification_preferences.sql
\i /docker-entrypoint-initdb-src/migrations/20260530_notifications.sql
\i /docker-entrypoint-initdb-src/migrations/20260531_categories_taxonomy.sql
\i /docker-entrypoint-initdb-src/migrations/20260531_message_attachments.sql
\i /docker-entrypoint-initdb-src/migrations/20260601_notification_alert_emails.sql
\i /docker-entrypoint-initdb-src/migrations/20260602_covoiturage_booking_modes.sql
\i /docker-entrypoint-initdb-src/migrations/20260602_pro_space.sql
\i /docker-entrypoint-initdb-src/migrations/20260603_pro_dashboard.sql
\i /docker-entrypoint-initdb-src/migrations/20260604_pro_transport.sql
\i /docker-entrypoint-initdb-src/migrations/20260605_covoit_review_reminders.sql
\i /docker-entrypoint-initdb-src/migrations/20260605_phase4_reviews_newsletter.sql
\i /docker-entrypoint-initdb-src/migrations/20260605_pro_booking_exceptions.sql
\i /docker-entrypoint-initdb-src/migrations/20260605_pro_quotes.sql
\i /docker-entrypoint-initdb-src/migrations/20260606_covoiturage_recurrence.sql
\i /docker-entrypoint-initdb-src/migrations/20260607_pro_quote_requests.sql
\i /docker-entrypoint-initdb-src/migrations/20260607_products_catalog.sql
\i /docker-entrypoint-initdb-src/migrations/20260608_pro_quote_template.sql
\i /docker-entrypoint-initdb-src/migrations/20260609_pro_bookings.sql
\i /docker-entrypoint-initdb-src/migrations/20260610_pro_catalog_categories.sql
\i /docker-entrypoint-initdb-src/migrations/20260610_pro_launch_pack.sql
\i /docker-entrypoint-initdb-src/migrations/20260611_pro_booking_access_tokens.sql
\i /docker-entrypoint-initdb-src/migrations/20260611_pro_booking_services_and_pack_welcome.sql
\i /docker-entrypoint-initdb-src/migrations/20260612_pro_referral_codes.sql
\i /docker-entrypoint-initdb-src/migrations/20260613_launch_features.sql
\i /docker-entrypoint-initdb-src/migrations/20260616_sprint2_features.sql
\i /docker-entrypoint-initdb-src/migrations/20260617_billetterie_native.sql
\i /docker-entrypoint-initdb-src/migrations/20260618_import_jobs.sql
\i /docker-entrypoint-initdb-src/migrations/20260619_sprint4_features.sql
\i /docker-entrypoint-initdb-src/migrations/20260701_fret_offers.sql
\i /docker-entrypoint-initdb-src/migrations/20260702_appels_offres_v2.sql
\i /docker-entrypoint-initdb-src/migrations/20260702_campaigns_publicity.sql
\i /docker-entrypoint-initdb-src/migrations/20260702_pro_fret_plan.sql
\i /docker-entrypoint-initdb-src/migrations/20260703_envoi_livraison.sql
\i /docker-entrypoint-initdb-src/migrations/20260705_tours_seen.sql

\echo '[init] Database initialization complete.'
