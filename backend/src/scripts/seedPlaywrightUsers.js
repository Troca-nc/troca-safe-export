'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { loadDemoEnv } = require('../../../scripts/loadDemoEnv');
loadDemoEnv();

const { withTransaction } = require('../config/database');
const { seedDemoDataset } = require('../services/demoSeedService');

const PASSWORD = 'Playwright123!';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

const USERS = [
  {
    email: 'particulier@playwright.troca.nc',
    prenom: 'Emma',
    nom: 'Test',
    telephone: '+687700001',
    commune_slug: 'noumea',
    bio: 'Compte particulier de test pour Playwright.',
    account_type: 'personal',
    is_admin: false,
    is_pro: false,
    email_verified: true,
    phone_verified: true,
    trust_score: 84,
    nb_annonces: 1,
    nb_avis: 2,
  },
  {
    email: 'vendeur@playwright.troca.nc',
    prenom: 'Victor',
    nom: 'Vendeur',
    telephone: '+687700002',
    commune_slug: 'dumbea',
    bio: 'Vendeur particulier avec trois annonces de test.',
    account_type: 'personal',
    is_admin: false,
    is_pro: false,
    email_verified: true,
    phone_verified: true,
    trust_score: 87,
    nb_annonces: 3,
    nb_avis: 4,
  },
  {
    email: 'pro@playwright.troca.nc',
    prenom: 'Entreprise',
    nom: 'Test NC',
    telephone: '+687700003',
    commune_slug: 'noumea',
    bio: 'Professionnel vérifié pour le dashboard Playwright.',
    account_type: 'professional',
    is_admin: false,
    is_pro: true,
    pro_plan: 'pro',
    pro_verified: true,
    pro_company_name: 'Entreprise Test NC',
    pro_category: 'Services',
    pro_description: 'Entreprise de test pour la vitrine, les devis et les rendez-vous.',
    pro_phone: '+687700003',
    pro_hours: 'Lun - Ven : 08h00 - 17h30',
    pro_commune: 'Nouméa',
    pro_siret: 'RIDET-PLAYWRIGHT-PRO',
    pro_referral_code: 'PW-PRO-2026',
    email_verified: true,
    phone_verified: true,
    trust_score: 96,
    nb_annonces: 1,
    nb_avis: 12,
  },
  {
    email: 'conducteur@playwright.troca.nc',
    prenom: 'Claude',
    nom: 'Conducteur',
    telephone: '+687700004',
    commune_slug: 'paita',
    bio: 'Conducteur de test pour le covoiturage et les réservations.',
    account_type: 'personal',
    is_admin: false,
    is_pro: false,
    email_verified: true,
    phone_verified: true,
    trust_score: 82,
    nb_annonces: 0,
    nb_avis: 3,
  },
  {
    email: 'admin@playwright.troca.nc',
    prenom: 'Ada',
    nom: 'Admin',
    telephone: '+687700005',
    commune_slug: 'noumea',
    bio: 'Administratrice de test pour l’espace admin.',
    account_type: 'professional',
    is_admin: true,
    is_pro: true,
    pro_plan: 'pro',
    pro_verified: true,
    pro_company_name: 'Troca Admin Test',
    pro_category: 'Plateforme',
    pro_description: 'Compte d’administration pour les tests E2E.',
    pro_phone: '+687700005',
    pro_hours: 'Lun - Ven : 09h00 - 17h00',
    pro_commune: 'Nouméa',
    pro_siret: 'RIDET-PLAYWRIGHT-ADMIN',
    pro_referral_code: 'PW-ADMIN-2026',
    email_verified: true,
    phone_verified: true,
    trust_score: 99,
    nb_annonces: 0,
    nb_avis: 18,
  },
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function makeToken(prefix, value) {
  return `${prefix}-${crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 16)}`;
}

async function ensureCompatSchema() {
  await withTransaction(async (client) => {
    const statements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_verified BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_verified_at TIMESTAMPTZ`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_company_name TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_category TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_description TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_logo_url TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_banner_url TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_website TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_phone TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_hours TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_commune TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_siret TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_referral_code TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_quote_template JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS note_moyenne NUMERIC(3,2)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) NOT NULL DEFAULT 'inconnu'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_verified BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'personal'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS rides_as_driver INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS rides_as_passenger INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS nb_annonces INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS nb_avis INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,

      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS is_troc BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS troc_accepts_complement_xpf BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS troc_complement_max_xpf INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS troc_wants TEXT[] NOT NULL DEFAULT '{}'::text[]`,
      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS troc_status TEXT NOT NULL DEFAULT 'open'`,
      `ALTER TABLE annonces ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`,

      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS seats_reserved INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS seats_remaining INTEGER NOT NULL DEFAULT 3`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(20) NOT NULL DEFAULT 'auto'`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) NOT NULL DEFAULT 'none'`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS recurrence_days JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS recurrence_until DATE`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS recurrence_count INTEGER`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS recurrence_parent_id INTEGER`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS price_xpf INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS vehicle VARCHAR(120)`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS comfort VARCHAR(120)`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS luggage_allowed VARCHAR(120)`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS music_allowed BOOLEAN NOT NULL DEFAULT TRUE`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS no_smoking BOOLEAN NOT NULL DEFAULT TRUE`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS animals_allowed BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published'`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS departure_commune_id INTEGER`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS destination_commune_id INTEGER`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS is_verified_driver BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE covoiturages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 days')`,

      `CREATE TABLE IF NOT EXISTS ride_bookings (
        id               SERIAL PRIMARY KEY,
        ride_id          INTEGER      NOT NULL REFERENCES covoiturages(id) ON DELETE CASCADE,
        passenger_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
        booking_mode     VARCHAR(20)  NOT NULL DEFAULT 'auto',
        message          TEXT         DEFAULT NULL,
        seats            INTEGER      NOT NULL DEFAULT 1,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        responded_at     TIMESTAMPTZ  DEFAULT NULL,
        expires_at       TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
        review_reminder_sent_at TIMESTAMPTZ DEFAULT NULL,
        UNIQUE (ride_id, passenger_id)
      )`,
      `CREATE TABLE IF NOT EXISTS pro_reviews (
        id                SERIAL PRIMARY KEY,
        pro_id            INTEGER      REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id       INTEGER      REFERENCES users(id),
        rating            INTEGER      CHECK (rating BETWEEN 1 AND 5),
        comment           TEXT,
        verified_purchase BOOLEAN      DEFAULT FALSE,
        created_at        TIMESTAMPTZ  DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS verified_reviews (
        id SERIAL PRIMARY KEY,
        pro_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reviewer_prenom TEXT,
        reviewer_avatar_url TEXT,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title TEXT,
        comment TEXT,
        verified_purchase BOOLEAN DEFAULT FALSE,
        source TEXT DEFAULT 'invite',
        status TEXT NOT NULL DEFAULT 'published'
          CHECK (status IN ('published', 'reported', 'hidden')),
        helpful_count INTEGER NOT NULL DEFAULT 0,
        report_count INTEGER NOT NULL DEFAULT 0,
        report_reason TEXT,
        reply_content TEXT,
        reply_at TIMESTAMPTZ,
        reply_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS review_helpful (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES verified_reviews(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        helpful BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (review_id, user_id)
      )`,

      `CREATE TABLE IF NOT EXISTS pro_booking_settings (
        id                    SERIAL PRIMARY KEY,
        pro_id                INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        is_enabled            BOOLEAN      NOT NULL DEFAULT FALSE,
        title                 TEXT         NOT NULL DEFAULT 'Prendre rendez-vous',
        subtitle              TEXT         NOT NULL DEFAULT 'Réservez un créneau directement avec ce professionnel.',
        location_label        TEXT         NOT NULL DEFAULT 'Lieu du rendez-vous',
        location_text         TEXT         DEFAULT NULL,
        instructions          TEXT         DEFAULT NULL,
        slot_duration_minutes INTEGER      NOT NULL DEFAULT 30,
        advance_notice_hours  INTEGER      NOT NULL DEFAULT 24,
        max_days_ahead        INTEGER      NOT NULL DEFAULT 30,
        services_json         JSONB        NOT NULL DEFAULT '[]'::jsonb,
        weekly_hours_json     JSONB        NOT NULL DEFAULT '{}'::jsonb,
        created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pro_booking_slots (
        id          SERIAL PRIMARY KEY,
        pro_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        starts_at   TIMESTAMPTZ  NOT NULL,
        ends_at     TIMESTAMPTZ  NOT NULL,
        label       TEXT         DEFAULT NULL,
        status      VARCHAR(20)  NOT NULL DEFAULT 'available',
        source      VARCHAR(20)  NOT NULL DEFAULT 'manual',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pro_bookings (
        id                  SERIAL PRIMARY KEY,
        pro_id              INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requester_user_id   INTEGER      DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
        slot_id             INTEGER      DEFAULT NULL REFERENCES pro_booking_slots(id) ON DELETE SET NULL,
        booking_access_token TEXT        DEFAULT NULL,
        service_title       TEXT         DEFAULT NULL,
        service_price_xpf   INTEGER      DEFAULT NULL,
        service_duration_minutes INTEGER DEFAULT NULL,
        requester_name      TEXT         NOT NULL,
        requester_email     TEXT         NOT NULL,
        requester_phone     TEXT         DEFAULT NULL,
        commune             TEXT         DEFAULT NULL,
        subject             TEXT         NOT NULL,
        details             TEXT         DEFAULT NULL,
        starts_at           TIMESTAMPTZ  NOT NULL,
        ends_at             TIMESTAMPTZ  DEFAULT NULL,
        status              VARCHAR(20)  NOT NULL DEFAULT 'pending',
        source              VARCHAR(20)  NOT NULL DEFAULT 'public',
        confirmed_at        TIMESTAMPTZ  DEFAULT NULL,
        declined_at         TIMESTAMPTZ  DEFAULT NULL,
        cancelled_at        TIMESTAMPTZ  DEFAULT NULL,
        completed_at        TIMESTAMPTZ  DEFAULT NULL,
        reminder_24h_sent_at TIMESTAMPTZ  DEFAULT NULL,
        reminder_2h_sent_at  TIMESTAMPTZ  DEFAULT NULL,
        created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pro_quote_requests (
        id                 SERIAL PRIMARY KEY,
        pro_id             INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requester_user_id  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
        requester_name     TEXT         NOT NULL,
        requester_email    TEXT         NOT NULL,
        requester_phone    TEXT,
        need_type          TEXT         NOT NULL,
        commune            TEXT         NOT NULL,
        budget_xpf         INTEGER,
        desired_date       TEXT,
        details            TEXT,
        created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pro_quotes (
        id                     SERIAL PRIMARY KEY,
        pro_id                 INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requester_user_id      INTEGER      DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
        source_quote_request_id INTEGER     DEFAULT NULL REFERENCES pro_quote_requests(id) ON DELETE SET NULL,
        quote_number           TEXT         NOT NULL UNIQUE,
        share_token            TEXT         NOT NULL UNIQUE,
        requester_name         TEXT         NOT NULL,
        requester_email        TEXT         NOT NULL,
        requester_phone        TEXT         DEFAULT NULL,
        commune                TEXT         NOT NULL,
        subject                TEXT         NOT NULL,
        client_note            TEXT         DEFAULT NULL,
        items                  JSONB        NOT NULL DEFAULT '[]'::jsonb,
        subtotal_xpf           INTEGER      NOT NULL DEFAULT 0,
        tax_rate               NUMERIC(5,2) NOT NULL DEFAULT 0,
        tax_amount_xpf         INTEGER      NOT NULL DEFAULT 0,
        total_xpf              INTEGER      NOT NULL DEFAULT 0,
        validity_days          INTEGER      NOT NULL DEFAULT 30,
        status                 VARCHAR(20)  NOT NULL DEFAULT 'draft',
        valid_until            TIMESTAMPTZ  DEFAULT NULL,
        sent_at                TIMESTAMPTZ  DEFAULT NULL,
        viewed_at              TIMESTAMPTZ  DEFAULT NULL,
        accepted_at            TIMESTAMPTZ  DEFAULT NULL,
        refused_at             TIMESTAMPTZ  DEFAULT NULL,
        refused_reason         TEXT         DEFAULT NULL,
        converted_listing_id   INTEGER      DEFAULT NULL REFERENCES annonces(id) ON DELETE SET NULL,
        created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pro_booking_exceptions (
        id              SERIAL PRIMARY KEY,
        pro_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exception_date  DATE         NOT NULL,
        is_unavailable  BOOLEAN      NOT NULL DEFAULT TRUE,
        reason          TEXT         DEFAULT NULL,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (pro_id, exception_date)
      )`,
      `CREATE TABLE IF NOT EXISTS pro_launch_packs (
        id                       SERIAL PRIMARY KEY,
        pro_id                   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        status                   VARCHAR(20)  NOT NULL DEFAULT 'active',
        call_scheduled_at        TIMESTAMPTZ  DEFAULT NULL,
        call_phone               TEXT         DEFAULT NULL,
        call_notes               TEXT         DEFAULT NULL,
        welcome_email_sent_at    TIMESTAMPTZ  DEFAULT NULL,
        completed_at             TIMESTAMPTZ  DEFAULT NULL,
        expires_at               TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS pro_onboarding_steps (
        id              SERIAL PRIMARY KEY,
        pack_id         INTEGER      NOT NULL REFERENCES pro_launch_packs(id) ON DELETE CASCADE,
        pro_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        step_key        VARCHAR(60)  NOT NULL,
        title           TEXT         NOT NULL,
        points          INTEGER      NOT NULL DEFAULT 1,
        completed_at    TIMESTAMPTZ  DEFAULT NULL,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (pro_id, step_key)
      )`,
    ];

    for (const statement of statements) {
      await client.query(statement);
    }
  });
}

async function upsertUsers(client, communeRows) {
  const communeBySlug = new Map(communeRows.map((row) => [row.slug, row.id]));
  const userRows = [];

  for (const user of USERS) {
    const result = await client.query(
      `INSERT INTO users (
        email, password_hash, prenom, nom, telephone, phone_verified, email_verified,
        avatar_url, commune_id, bio, member_since, rides_as_driver, rides_as_passenger,
        trust_score, is_admin, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at,
        pro_verified, pro_verified_at, pro_company_name, pro_category, pro_description,
        pro_logo_url, pro_banner_url, pro_website, pro_phone, pro_hours, pro_commune,
        pro_siret, pro_referral_code, account_type, nb_annonces, nb_avis, deleted_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NULL, $8, $9, NOW() - INTERVAL '20 days', 0, 0,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        NULL, NULL, NULL, $21, $22, $23,
        $24, $25, $26, $27, $28, NULL
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        prenom = EXCLUDED.prenom,
        nom = EXCLUDED.nom,
        telephone = EXCLUDED.telephone,
        phone_verified = EXCLUDED.phone_verified,
        email_verified = EXCLUDED.email_verified,
        commune_id = EXCLUDED.commune_id,
        bio = EXCLUDED.bio,
        trust_score = EXCLUDED.trust_score,
        is_admin = EXCLUDED.is_admin,
        is_pro = EXCLUDED.is_pro,
        pro_plan = EXCLUDED.pro_plan,
        pro_expires_at = EXCLUDED.pro_expires_at,
        pro_verified = EXCLUDED.pro_verified,
        pro_verified_at = EXCLUDED.pro_verified_at,
        pro_company_name = EXCLUDED.pro_company_name,
        pro_category = EXCLUDED.pro_category,
        pro_description = EXCLUDED.pro_description,
        pro_phone = EXCLUDED.pro_phone,
        pro_hours = EXCLUDED.pro_hours,
        pro_commune = EXCLUDED.pro_commune,
        pro_siret = EXCLUDED.pro_siret,
        pro_referral_code = EXCLUDED.pro_referral_code,
        account_type = EXCLUDED.account_type,
        nb_annonces = EXCLUDED.nb_annonces,
        nb_avis = EXCLUDED.nb_avis,
        updated_at = NOW()
      RETURNING id, email`,
      [
        user.email,
        PASSWORD_HASH,
        user.prenom,
        user.nom,
        user.telephone,
        user.phone_verified,
        user.email_verified,
        communeBySlug.get(user.commune_slug) ?? null,
        user.bio,
        user.trust_score,
        user.is_admin,
        user.is_pro,
        user.pro_plan ?? null,
        user.is_pro ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 45) : null,
        user.is_pro ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) : null,
        user.pro_verified ?? false,
        user.is_pro ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) : null,
        user.pro_company_name ?? null,
        user.pro_category ?? null,
        user.pro_description ?? null,
        user.pro_phone ?? null,
        user.pro_hours ?? null,
        user.pro_commune ?? null,
        user.pro_siret ?? null,
        user.pro_referral_code ?? null,
        user.account_type ?? 'personal',
        user.nb_annonces ?? 0,
        user.nb_avis ?? 0,
      ]
    );

    userRows.push(result.rows[0]);
  }

  return {
    byEmail: new Map(userRows.map((row) => [row.email, row.id])),
    communes: communeBySlug,
  };
}

async function resetUserListings(client, userId) {
  await client.query(
    `DELETE FROM annonce_images
     WHERE annonce_id IN (SELECT id FROM annonces WHERE user_id = $1)`,
    [userId]
  );

  await client.query(`DELETE FROM annonces WHERE user_id = $1`, [userId]);
}

async function insertListing(client, { userId, categoryId, communeId, title, description, prix, condition, isTroc, wants, acceptsComplement, complementMax, slugSuffix, boostType }) {
  const inserted = await client.query(
    `INSERT INTO annonces (
      user_id, category_id, commune_id, titre, description, prix, condition, status,
      is_boosted, boost_type, nb_vues, nb_favoris, slug, expires_at, published_at,
      is_troc, troc_accepts_complement_xpf, troc_complement_max_xpf, troc_wants, troc_status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,'active',
      $8,$9,0,0,$10, NOW() + INTERVAL '45 days', NOW() - INTERVAL '2 days',
      $11,$12,$13,$14::text[],'open'
    )
    RETURNING id`,
    [
      userId,
      categoryId,
      communeId,
      title,
      description,
      prix,
      condition,
      Boolean(boostType),
      boostType || null,
      `${slugify(title)}-${slugSuffix}`,
      Boolean(isTroc),
      Boolean(acceptsComplement),
      complementMax ?? 0,
      wants ?? [],
    ]
  );

  const annonceId = inserted.rows[0].id;
  const baseSeed = `${slugify(title)}-${slugSuffix}`;
  const coverUrl = `https://picsum.photos/seed/${encodeURIComponent(baseSeed)}/1200/900`;

  await client.query(
    `INSERT INTO annonce_images (annonce_id, url, thumbnail_url, variants, position, sort_order, is_cover)
     VALUES ($1, $2, $3, $4::jsonb, 0, 0, TRUE)`,
    [
      annonceId,
      coverUrl,
      coverUrl,
      JSON.stringify({ original: coverUrl, medium: coverUrl }),
    ]
  );

  return annonceId;
}

async function seedSellerContent(client, ids) {
  const sellerId = ids.byEmail.get('vendeur@playwright.troca.nc');
  const particulierId = ids.byEmail.get('particulier@playwright.troca.nc');
  const communeNoumea = ids.communes.get('noumea');
  const communeDumbea = ids.communes.get('dumbea');
  const communePaita = ids.communes.get('paita');
  const vehiculeCategory = (await client.query(`SELECT id FROM categories WHERE slug = 'vehicules'`)).rows[0]?.id;
  const multimediaCategory = (await client.query(`SELECT id FROM categories WHERE slug = 'multimedia'`)).rows[0]?.id;
  const diversCategory = (await client.query(`SELECT id FROM categories WHERE slug = 'divers'`)).rows[0]?.id;

  if (!sellerId || !particulierId || !vehiculeCategory || !multimediaCategory || !diversCategory) return;

  await resetUserListings(client, sellerId);

  const listingIds = [];
  listingIds.push(await insertListing(client, {
    userId: sellerId,
    categoryId: vehiculeCategory,
    communeId: communeDumbea,
    title: 'Toyota Hilux 2019 4x4 diesel',
    description: 'Pickup de test avec historique complet et badge Troc possible.',
    prix: 3200000,
    condition: 'good',
    isTroc: true,
    wants: ['Moto trail', 'Bateau semi-rigide'],
    acceptsComplement: true,
    complementMax: 250000,
    slugSuffix: 'hilux',
    boostType: 'une',
  }));
  listingIds.push(await insertListing(client, {
    userId: sellerId,
    categoryId: multimediaCategory,
    communeId: communeNoumea,
    title: 'MacBook Air M2 15 pouces',
    description: 'Machine de démonstration pour tester les cartes annonce et le détail vendeur.',
    prix: 185000,
    condition: 'like_new',
    isTroc: false,
    wants: [],
    acceptsComplement: false,
    complementMax: 0,
    slugSuffix: 'macbook',
    boostType: null,
  }));
  listingIds.push(await insertListing(client, {
    userId: sellerId,
    categoryId: diversCategory,
    communeId: communePaita,
    title: 'Bon plan week-end musique live',
    description: 'Annonce de test pour les états mis en avant et les parcours de contact.',
    prix: 2500,
    condition: 'new',
    isTroc: false,
    wants: [],
    acceptsComplement: false,
    complementMax: 0,
    slugSuffix: 'event',
    boostType: 'urgent',
  }));

  await client.query(`UPDATE users SET nb_annonces = 3, updated_at = NOW() WHERE id = $1`, [sellerId]);

  const firstListingId = listingIds[0];
  if (firstListingId) {
    await client.query(
      `DELETE FROM conversations WHERE annonce_id = $1`,
      [firstListingId]
    );
    const conversation = await client.query(
      `INSERT INTO conversations (annonce_id, buyer_id, seller_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'active', NOW() - INTERVAL '2 days', NOW())
       RETURNING id`,
      [firstListingId, particulierId, sellerId]
    );
    const convId = conversation.rows[0].id;
    await client.query(
      `INSERT INTO messages (conv_id, sender_id, type, content, created_at)
       VALUES
         ($1, $2, 'text', $3, NOW() - INTERVAL '1 day 3 hours'),
         ($1, $4, 'text', $5, NOW() - INTERVAL '23 hours')`,
      [
        convId,
        particulierId,
        'Bonjour, le véhicule est-il encore disponible ?',
        sellerId,
        'Oui, il est disponible et prêt pour la visite.',
      ]
    );
  }
}

async function seedProContent(client, ids) {
  const proId = ids.byEmail.get('pro@playwright.troca.nc');
  const particulierId = ids.byEmail.get('particulier@playwright.troca.nc');
  const communId = ids.communes.get('noumea');
  const servicesCategory = (await client.query(`SELECT id FROM categories WHERE slug = 'services'`)).rows[0]?.id;
  const vehiculesCategory = (await client.query(`SELECT id FROM categories WHERE slug = 'vehicules'`)).rows[0]?.id;

  if (!proId || !particulierId || !servicesCategory || !vehiculesCategory) return;

  await resetUserListings(client, proId);
  const proListingId = await insertListing(client, {
    userId: proId,
    categoryId: servicesCategory,
    communeId: communId,
    title: 'Entreprise Test NC - Diagnostic rapide',
    description: 'Annonce de service pour la vitrine publique et le catalogue pro.',
    prix: 15000,
    condition: 'new',
    isTroc: false,
    wants: [],
    acceptsComplement: false,
    complementMax: 0,
    slugSuffix: 'service',
    boostType: 'photos',
  });

  await client.query(
    `INSERT INTO pro_booking_settings (
      pro_id, is_enabled, title, subtitle, location_label, location_text, instructions,
      slot_duration_minutes, advance_notice_hours, max_days_ahead, services_json, weekly_hours_json
    ) VALUES (
      $1, TRUE, 'Prendre rendez-vous', 'Réservez un créneau avec Entreprise Test NC.', 'Lieu du rendez-vous',
      'Centre-ville de Nouméa', 'Merci d’arriver 10 minutes en avance.', 30, 24, 30,
      $2::jsonb, $3::jsonb
    )
    ON CONFLICT (pro_id) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      location_label = EXCLUDED.location_label,
      location_text = EXCLUDED.location_text,
      instructions = EXCLUDED.instructions,
      slot_duration_minutes = EXCLUDED.slot_duration_minutes,
      advance_notice_hours = EXCLUDED.advance_notice_hours,
      max_days_ahead = EXCLUDED.max_days_ahead,
      services_json = EXCLUDED.services_json,
      weekly_hours_json = EXCLUDED.weekly_hours_json,
      updated_at = NOW()`,
    [
      proId,
      JSON.stringify([
        { id: 'audit', title: 'Diagnostic rapide', duration_minutes: 30, price_xpf: 15000, description: 'Audit express sur site.' },
        { id: 'devis', title: 'Devis sur mesure', duration_minutes: 45, price_xpf: 0, description: 'Consultation et chiffrage.' },
      ]),
      JSON.stringify({
        mon: [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '17:30' }],
        tue: [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '17:30' }],
        wed: [{ start: '08:00', end: '12:00' }],
        thu: [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '17:30' }],
        fri: [{ start: '08:00', end: '12:00' }, { start: '13:30', end: '16:30' }],
      }),
    ]
  );

  await client.query(`DELETE FROM pro_booking_slots WHERE pro_id = $1`, [proId]);
  const now = new Date();
  const slotDates = [
    new Date(now.getTime() + 1000 * 60 * 60 * 26),
    new Date(now.getTime() + 1000 * 60 * 60 * 50),
    new Date(now.getTime() + 1000 * 60 * 60 * 74),
  ];
  for (const [index, startsAt] of slotDates.entries()) {
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    await client.query(
      `INSERT INTO pro_booking_slots (pro_id, starts_at, ends_at, label, status, source)
       VALUES ($1, $2, $3, $4, $5, 'dashboard')`,
      [
        proId,
        startsAt,
        endsAt,
        index === 0 ? 'Matin' : index === 1 ? 'Après-midi' : 'Visio',
        index === 1 ? 'booked' : 'available',
      ]
    );
  }

  await client.query(`DELETE FROM pro_booking_exceptions WHERE pro_id = $1`, [proId]);
  await client.query(
    `INSERT INTO pro_booking_exceptions (pro_id, exception_date, is_unavailable, reason)
     VALUES ($1, CURRENT_DATE + INTERVAL '5 days', TRUE, 'Formation interne')
     ON CONFLICT (pro_id, exception_date) DO UPDATE SET reason = EXCLUDED.reason, is_unavailable = EXCLUDED.is_unavailable`,
    [proId]
  );

  await client.query(`DELETE FROM pro_quote_requests WHERE pro_id = $1`, [proId]);
  const quoteRequest = await client.query(
    `INSERT INTO pro_quote_requests (
      pro_id, requester_user_id, requester_name, requester_email, requester_phone,
      need_type, commune, budget_xpf, desired_date, details
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    ) RETURNING id`,
    [
      proId,
      particulierId,
      'Emma Test',
      'particulier@playwright.troca.nc',
      '+687700001',
      'Rénovation cuisine',
      'Nouméa',
      250000,
      '2026-07-12',
      'Besoin de deux rendez-vous et d’un devis détaillé.',
    ]
  );

  await client.query(`DELETE FROM pro_quotes WHERE pro_id = $1`, [proId]);
  await client.query(
    `INSERT INTO pro_quotes (
      pro_id, requester_user_id, source_quote_request_id, quote_number, share_token,
      requester_name, requester_email, requester_phone, commune, subject, client_note,
      items, subtotal_xpf, tax_rate, tax_amount_xpf, total_xpf, validity_days, status,
      valid_until, sent_at, viewed_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11,
      $12::jsonb, $13, $14, $15, $16, $17, $18,
      $19, $20, $21
    )
    ON CONFLICT (quote_number) DO UPDATE SET
      requester_name = EXCLUDED.requester_name,
      requester_email = EXCLUDED.requester_email,
      requester_phone = EXCLUDED.requester_phone,
      commune = EXCLUDED.commune,
      subject = EXCLUDED.subject,
      client_note = EXCLUDED.client_note,
      items = EXCLUDED.items,
      subtotal_xpf = EXCLUDED.subtotal_xpf,
      tax_rate = EXCLUDED.tax_rate,
      tax_amount_xpf = EXCLUDED.tax_amount_xpf,
      total_xpf = EXCLUDED.total_xpf,
      validity_days = EXCLUDED.validity_days,
      status = EXCLUDED.status,
      valid_until = EXCLUDED.valid_until,
      sent_at = EXCLUDED.sent_at,
      viewed_at = EXCLUDED.viewed_at,
      updated_at = NOW()`,
    [
      proId,
      particulierId,
      quoteRequest.rows[0].id,
      'PW-2026-0001',
      'pw-quote-token-1',
      'Emma Test',
      'particulier@playwright.troca.nc',
      '+687700001',
      'Nouméa',
      'Rénovation cuisine',
      'Merci de détailler la main d’œuvre et les fournitures.',
      JSON.stringify([
        { label: 'Déplacement', quantity: 1, unit_price_xpf: 5000, total_xpf: 5000 },
        { label: 'Main d’œuvre', quantity: 4, unit_price_xpf: 22500, total_xpf: 90000 },
      ]),
      95000,
      11,
      10450,
      105450,
      30,
      'sent',
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      new Date(Date.now() - 1000 * 60 * 60 * 12),
      null,
    ]
  );

  await client.query(`DELETE FROM pro_launch_packs WHERE pro_id = $1`, [proId]);
  const pack = await client.query(
    `INSERT INTO pro_launch_packs (pro_id, status, call_scheduled_at, call_phone, call_notes, welcome_email_sent_at, completed_at, expires_at)
     VALUES ($1, 'active', NOW() + INTERVAL '2 days', '+687700003', 'Appel de bienvenue Playwright', NOW() - INTERVAL '1 day', NULL, NOW() + INTERVAL '10 days')
     ON CONFLICT (pro_id) DO UPDATE SET
       status = EXCLUDED.status,
       call_scheduled_at = EXCLUDED.call_scheduled_at,
       call_phone = EXCLUDED.call_phone,
       call_notes = EXCLUDED.call_notes,
       welcome_email_sent_at = EXCLUDED.welcome_email_sent_at,
       completed_at = EXCLUDED.completed_at,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()
     RETURNING id`,
    [proId]
  );

  await client.query(`DELETE FROM pro_onboarding_steps WHERE pro_id = $1`, [proId]);
  const steps = [
    { key: 'profile_complete', title: 'Compléter le profil', points: 10, completed: true },
    { key: 'first_listing', title: 'Publier une annonce', points: 8, completed: true },
    { key: 'catalog_created', title: 'Créer le catalogue', points: 6, completed: true },
    { key: 'booking_active', title: 'Activer les rendez-vous', points: 6, completed: false },
    { key: 'first_quote', title: 'Envoyer un devis', points: 10, completed: true },
  ];

  for (const step of steps) {
    await client.query(
      `INSERT INTO pro_onboarding_steps (pack_id, pro_id, step_key, title, points, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (pro_id, step_key) DO UPDATE SET
         pack_id = EXCLUDED.pack_id,
         title = EXCLUDED.title,
         points = EXCLUDED.points,
         completed_at = EXCLUDED.completed_at,
         updated_at = NOW()`,
      [
        pack.rows[0].id,
        proId,
        step.key,
        step.title,
        step.points,
        step.completed ? new Date(Date.now() - 1000 * 60 * 60 * 24 * (step.points / 2 + 1)) : null,
      ]
    );
  }

  await client.query(`DELETE FROM pro_booking_exceptions WHERE pro_id = $1`, [proId]);
  await client.query(
    `INSERT INTO pro_booking_exceptions (pro_id, exception_date, is_unavailable, reason)
     VALUES ($1, CURRENT_DATE + INTERVAL '3 days', TRUE, 'Congé de test')
     ON CONFLICT (pro_id, exception_date) DO UPDATE SET reason = EXCLUDED.reason, is_unavailable = EXCLUDED.is_unavailable`,
    [proId]
  );

  await client.query(`DELETE FROM pro_bookings WHERE pro_id = $1`, [proId]);
  await client.query(
    `INSERT INTO pro_bookings (
      pro_id, requester_user_id, slot_id, booking_access_token, service_title, service_price_xpf,
      service_duration_minutes, requester_name, requester_email, requester_phone, commune, subject,
      details, starts_at, ends_at, status, source, confirmed_at, declined_at, cancelled_at, completed_at
    ) VALUES (
      $1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      $12, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 30 minutes', 'pending', 'public', NULL, NULL, NULL, NULL
    )`,
    [
      proId,
      particulierId,
      'pw-booking-token-1',
      'Diagnostic rapide',
      15000,
      30,
      'Emma Test',
      'particulier@playwright.troca.nc',
      '+687700001',
      'Nouméa',
      'Demande de rendez-vous',
      'Besoin de confirmer le créneau pour un devis.',
    ]
  );

  await client.query(
    `INSERT INTO pro_bookings (
      pro_id, requester_user_id, slot_id, booking_access_token, service_title, service_price_xpf,
      service_duration_minutes, requester_name, requester_email, requester_phone, commune, subject,
      details, starts_at, ends_at, status, source, confirmed_at, declined_at, cancelled_at, completed_at
    ) VALUES (
      $1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      $12, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days 30 minutes', 'completed', 'dashboard', NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '1 day'
    )`,
    [
      proId,
      particulierId,
      'pw-booking-token-2',
      'Visite technique',
      0,
      45,
      'Emma Test',
      'particulier@playwright.troca.nc',
      '+687700001',
      'Nouméa',
      'Rendez-vous terminé',
      'Exemple de rendez-vous terminé pour le flux d’avis.',
    ]
  );

  await client.query(`UPDATE users SET nb_annonces = COALESCE(nb_annonces, 0) + 1, updated_at = NOW() WHERE id = $1`, [proId]);
}

async function seedDriverContent(client, ids) {
  const driverId = ids.byEmail.get('conducteur@playwright.troca.nc');
  const passengerId = ids.byEmail.get('particulier@playwright.troca.nc');
  const communeNoumea = ids.communes.get('noumea');
  const communePaita = ids.communes.get('paita');

  if (!driverId || !passengerId) return;

  await client.query(`DELETE FROM covoiturage_reviews WHERE covoiturage_id IN (SELECT id FROM covoiturages WHERE user_id = $1)`, [driverId]);
  await client.query(`DELETE FROM covoiturage_bookings WHERE covoiturage_id IN (SELECT id FROM covoiturages WHERE user_id = $1)`, [driverId]);
  await client.query(`DELETE FROM covoiturages WHERE user_id = $1`, [driverId]);

  const ride = await client.query(
    `INSERT INTO covoiturages (
      user_id, departure, destination, stops, ride_date, ride_time, seats_total, seats_reserved, seats_remaining,
      booking_mode, recurrence_type, recurrence_days, recurrence_until, recurrence_count, recurrence_parent_id,
      price_xpf, vehicle, comfort, luggage_allowed, music_allowed, no_smoking, animals_allowed, description,
      status, departure_commune_id, destination_commune_id, trust_score, is_verified_driver, expires_at, created_at, updated_at
    ) VALUES (
      $1, 'Nouméa', 'Païta', $2::jsonb, CURRENT_DATE + INTERVAL '2 days', '08:30', 3, 1, 2,
      'manual', 'none', '[]'::jsonb, NULL, NULL, NULL,
      1200, 'SUV', 'Confort', 'Petit sac', TRUE, TRUE, FALSE, 'Trajet de test pour le conducteur Playwright.',
      'published', $3, $4, 82, TRUE, NOW() + INTERVAL '4 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
    )
    RETURNING id`,
    [
      driverId,
      JSON.stringify(['Nouméa', 'Païta']),
      communeNoumea,
      communePaita,
    ]
  );

  await client.query(
    `INSERT INTO covoiturage_bookings (covoiturage_id, user_id, seats, status, created_at)
     VALUES ($1, $2, 1, 'confirmed', NOW() - INTERVAL '10 hours')
     ON CONFLICT DO NOTHING`,
    [ride.rows[0].id, passengerId]
  );
}

async function main() {
  await ensureCompatSchema();
  try {
    await seedDemoDataset();
  } catch (err) {
    console.warn('[playwright-seed] demo seed skipped:', err.message);
  }

  const summary = await withTransaction(async (client) => {
    const communes = await client.query(`SELECT id, slug, name FROM communes ORDER BY id ASC`);
    const users = await upsertUsers(client, communes.rows);

    await client.query(`DELETE FROM search_alerts WHERE user_id = ANY($1::int[])`, [[...users.byEmail.values()]]);
    await client.query(`DELETE FROM notifications WHERE user_id = ANY($1::int[])`, [[...users.byEmail.values()]]);
    await client.query(`DELETE FROM rgpd_consentements WHERE user_id = ANY($1::int[])`, [[...users.byEmail.values()]]);
    await client.query(`DELETE FROM rgpd_logs WHERE user_id = ANY($1::int[])`, [[...users.byEmail.values()]]);

    await seedSellerContent(client, users);
    await seedProContent(client, users);
    await seedDriverContent(client, users);

    const proId = users.byEmail.get('pro@playwright.troca.nc');
    const particulierId = users.byEmail.get('particulier@playwright.troca.nc');
    const vendeurId = users.byEmail.get('vendeur@playwright.troca.nc');
    const conducteurId = users.byEmail.get('conducteur@playwright.troca.nc');
    const adminId = users.byEmail.get('admin@playwright.troca.nc');

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, href, is_read, created_at)
       VALUES
        ($1, 'review', 'Compte prêt pour les tests', 'Votre compte Playwright est opérationnel.', '/profil', FALSE, NOW() - INTERVAL '4 hours'),
        ($2, 'search_alert', 'Nouvelle annonce de test', 'Une annonce correspond à vos critères.', '/annonces', FALSE, NOW() - INTERVAL '3 hours'),
        ($3, 'booking', 'Rendez-vous à confirmer', 'Un créneau est disponible pour le pro de test.', '/mes-rdv', FALSE, NOW() - INTERVAL '2 hours'),
        ($4, 'ride', 'Trajet confirmé', 'Votre trajet de test a été réservé.', '/covoiturage/reservations', FALSE, NOW() - INTERVAL '1 hour'),
        ($5, 'admin', 'Modération en attente', 'Des éléments nécessitent votre attention.', '/admin/dashboard', FALSE, NOW() - INTERVAL '30 minutes')
       ON CONFLICT DO NOTHING`,
      [particulierId, vendeurId, proId, conducteurId, adminId]
    );

    return {
      users: [
        'particulier@playwright.troca.nc',
        'vendeur@playwright.troca.nc',
        'pro@playwright.troca.nc',
        'conducteur@playwright.troca.nc',
        'admin@playwright.troca.nc',
      ],
      password: PASSWORD,
      proCompany: 'Entreprise Test NC',
    };
  });

  console.log('[playwright-seed] OK', JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error('[playwright-seed]', err.message);
  process.exit(1);
});
