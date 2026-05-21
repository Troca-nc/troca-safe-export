'use strict';

const bcrypt = require('bcryptjs');
const { withTransaction } = require('../config/database');

const DEMO_DOMAIN = '@demo.troca';
const DEMO_PASSWORD = 'Demo1234!';

function isDemoRuntimeEnabled() {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
}

const DEMO_USERS = [
  {
    email: 'admin@demo.troca',
    prenom: 'Ari',
    nom: 'Admin',
    is_admin: true,
    is_pro: true,
    pro_plan: 'pro_plus',
    commune_slug: 'noumea',
    bio: 'Administratrice locale pour les démonstrations et le QA.',
    rating: 5,
    nb_avis: 18,
    nb_annonces: 6,
    trust_score: 98,
    trust_level: 'excellent',
  },
  {
    email: 'particulier@demo.troca',
    prenom: 'Emma',
    nom: 'Martin',
    is_pro: false,
    commune_slug: 'noumea',
    bio: 'Particulière qui vend ses équipements, suit ses messages et teste les favoris.',
    rating: 4.8,
    nb_avis: 21,
    nb_annonces: 4,
    trust_score: 87,
    trust_level: 'excellent',
  },
  {
    email: 'pro@demo.troca',
    prenom: 'Atelier',
    nom: 'Kalo',
    is_pro: true,
    pro_plan: 'pro_plus',
    commune_slug: 'dumbea',
    bio: 'Vendeur professionnel avec statistiques, boosts et gestion du catalogue.',
    rating: 4.9,
    nb_avis: 47,
    nb_annonces: 18,
    trust_score: 94,
    trust_level: 'excellent',
  },
  {
    email: 'bonplan@demo.troca',
    prenom: 'Troca',
    nom: 'BonPlan',
    is_pro: true,
    pro_plan: 'pro',
    commune_slug: 'noumea',
    bio: 'Annonceur de promos, événements et offres locales mises en avant.',
    rating: 5,
    nb_avis: 12,
    nb_annonces: 8,
    trust_score: 96,
    trust_level: 'excellent',
  },
  {
    email: 'loueur@demo.troca',
    prenom: 'Lou',
    nom: 'Bourail',
    is_pro: false,
    commune_slug: 'bourail',
    bio: 'Utilisateur particulier qui consulte les annonces, enregistre des alertes et discute.',
    rating: 4.7,
    nb_avis: 9,
    nb_annonces: 2,
    trust_score: 81,
    trust_level: 'bon',
  },
  {
    email: 'marine@demo.troca',
    prenom: 'Marine',
    nom: 'Voh',
    is_pro: false,
    commune_slug: 'voh',
    bio: 'Acheteuse locale pour les parcours web et mobile en conditions réelles.',
    rating: 4.6,
    nb_avis: 11,
    nb_annonces: 1,
    trust_score: 79,
    trust_level: 'bon',
  },
];

const DEMO_LISTINGS = [
  {
    seller: 'pro@demo.troca',
    category_slug: 'vehicules',
    commune_slug: 'dumbea',
    titre: 'Toyota Hilux 2019 4x4 diesel',
    description: 'Pickup entretenu, historique complet, prêt pour le chantier ou les trajets longue distance.',
    prix: 3200000,
    condition: 'good',
    is_boosted: true,
    boost_type: 'une',
    boost_days: 7,
    tags: ['vehicule', '4x4', 'diesel'],
  },
  {
    seller: 'particulier@demo.troca',
    category_slug: 'immobilier',
    commune_slug: 'noumea',
    titre: 'Studio rénové avec vue mer',
    description: 'Studio lumineux proche des services, parfait pour un premier achat ou un investissement locatif.',
    prix: 19500000,
    condition: 'like_new',
    is_boosted: false,
    tags: ['immobilier', 'studio', 'vue mer'],
  },
  {
    seller: 'bonplan@demo.troca',
    category_slug: 'divers',
    commune_slug: 'noumea',
    titre: 'Bon plan week-end musique live',
    description: 'Carte sponsorisée pour un événement local avec réduction, lieu précis et conditions d’accès.',
    prix: 2500,
    condition: 'new',
    is_boosted: true,
    boost_type: 'urgent',
    boost_days: 3,
    tags: ['evenement', 'concert', 'promo'],
  },
  {
    seller: 'particulier@demo.troca',
    category_slug: 'nautisme',
    commune_slug: 'paita',
    titre: 'Kayak de mer 2 places avec pagaies',
    description: 'Idéal pour les sorties du week-end. Très bon état, peu utilisé, stockage à l’ombre.',
    prix: 48000,
    condition: 'good',
    is_boosted: false,
    tags: ['nautisme', 'sport', 'plein air'],
  },
  {
    seller: 'pro@demo.troca',
    category_slug: 'multimedia',
    commune_slug: 'noumea',
    titre: 'MacBook Air M2 15 pouces',
    description: 'Machine de démonstration pour les utilisateurs qui comparent les performances et la finition.',
    prix: 185000,
    condition: 'like_new',
    is_boosted: false,
    tags: ['ordinateur', 'apple', 'portable'],
  },
  {
    seller: 'marine@demo.troca',
    category_slug: 'divers',
    commune_slug: 'voh',
    titre: 'Canapé 3 places tissu beige',
    description: 'Canapé confortable pour mettre en avant favoris, messages et navigation rapide.',
    prix: 18000,
    condition: 'good',
    is_boosted: false,
    tags: ['maison', 'mobilier', 'salon'],
  },
  {
    seller: 'loueur@demo.troca',
    category_slug: 'sports-loisirs',
    commune_slug: 'bourail',
    titre: 'VTT tout suspendu taille L',
    description: 'Vélo prêt à rouler, parfait pour tester les filtres et les recherches par commune.',
    prix: 65000,
    condition: 'fair',
    is_boosted: false,
    tags: ['velo', 'sport', 'loisirs'],
  },
  {
    seller: 'pro@demo.troca',
    category_slug: 'emploi',
    commune_slug: 'dumbea',
    titre: 'Offre emploi vendeur terrain',
    description: 'Annonce de test pour parcourir les états de listing, les favoris et les dashboards pro.',
    prix: null,
    condition: 'new',
    is_boosted: true,
    boost_type: 'photos',
    boost_days: 14,
    tags: ['emploi', 'offre', 'pro'],
  },
];

const DEMO_MESSAGES = [
  {
    annonce_title: 'Toyota Hilux 2019 4x4 diesel',
    buyer: 'particulier@demo.troca',
    seller: 'pro@demo.troca',
    subject: 'Bonsoir, le véhicule est-il encore disponible ?',
    replies: [
      'Oui, il est toujours disponible et visible sur le tableau de bord local.',
      'Parfait, je passe le voir demain en fin de journée.',
      'À demain, je vous réserve le créneau.',
    ],
  },
  {
    annonce_title: 'Studio rénové avec vue mer',
    buyer: 'loueur@demo.troca',
    seller: 'particulier@demo.troca',
    subject: 'Bonjour, le studio est-il proche des services ?',
    replies: [
      'Oui, marché, pharmacie et arrêt de bus à moins de 5 minutes.',
      'Super, je suis intéressé pour une visite cette semaine.',
      'Je vous envoie les disponibilités dans la conversation.',
    ],
  },
];

const DEMO_PAYMENTS = [
  {
    email: 'pro@demo.troca',
    type: 'subscription',
    provider: 'stripe',
    provider_ref: 'demo-subscription-001',
    amount_xpf: 5900,
    status: 'succeeded',
    metadata: { plan_id: 'pro_plus', billing_period: 'monthly' },
    document_type: 'invoice',
  },
  {
    email: 'pro@demo.troca',
    type: 'boost',
    provider: 'payplug',
    provider_ref: 'demo-boost-001',
    amount_xpf: 1200,
    status: 'succeeded',
    metadata: { annonce_title: 'Toyota Hilux 2019 4x4 diesel', boost_type: 'une' },
    document_type: 'receipt',
  },
  {
    email: 'bonplan@demo.troca',
    type: 'boost',
    provider: 'stripe',
    provider_ref: 'demo-boost-002',
    amount_xpf: 990,
    status: 'pending',
    metadata: { annonce_title: 'Bon plan week-end musique live', boost_type: 'urgent' },
    document_type: 'invoice',
  },
];

function buildSvgDataUri({ title, accent, secondary }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)" rx="48"/>
      <circle cx="960" cy="130" r="180" fill="white" fill-opacity="0.16"/>
      <circle cx="220" cy="760" r="220" fill="white" fill-opacity="0.12"/>
      <text x="80" y="170" fill="white" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" opacity="0.88">Troca Démo</text>
      <text x="80" y="270" fill="white" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="800">${title}</text>
      <text x="80" y="360" fill="white" font-family="Inter, Arial, sans-serif" font-size="28" opacity="0.92">Données locales générées automatiquement</text>
      <rect x="80" y="610" width="360" height="88" rx="22" fill="rgba(255,255,255,0.18)"/>
      <text x="115" y="666" fill="white" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700">QA visuel local</text>
    </svg>
  `.trim().replace(/\s+/g, ' ');

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function lookupBySlug(rows, slug) {
  return rows.find((row) => row.slug === slug);
}

async function ensureDemoTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      body TEXT DEFAULT '',
      href VARCHAR(500) DEFAULT '/',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`ALTER TABLE annonce_images ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`);
  await client.query(`ALTER TABLE annonce_images ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT FALSE`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS href VARCHAR(500) DEFAULT '/'`);
  await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT DEFAULT ''`);
}

async function clearExistingDemoData(client) {
  const demoUserIds = await client.query(`SELECT id FROM users WHERE email LIKE $1`, [`%${DEMO_DOMAIN}`]);
  const ids = demoUserIds.rows.map((row) => row.id);

  if (ids.length === 0) return;

  await client.query(`DELETE FROM notifications WHERE user_id = ANY($1::int[])`, [ids]);
  await client.query(`DELETE FROM rgpd_consentements WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM rgpd_logs WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM analytics_events WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM billing_documents WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM payments WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM push_tokens WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM search_alerts WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM favoris WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM avis WHERE auteur_id = ANY($1::int[]) OR destinataire_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM refresh_tokens WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM password_reset_tokens WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM phone_verifications WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM messages WHERE sender_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM conversations WHERE buyer_id = ANY($1::int[]) OR seller_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM bon_plans WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM covoiturage_reviews WHERE reviewer_id = ANY($1::int[]) OR target_user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM covoiturage_bookings WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM covoiturages WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM annonces WHERE user_id = ANY($1::int[])`, [ids]).catch(() => {});
  await client.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [ids]).catch(() => {});
}

async function seedDemoDataset() {
  if (!isDemoRuntimeEnabled()) {
    throw new Error('Le seed démo est désactivé hors environnement local.');
  }

  await withTransaction(async (client) => {
    await ensureDemoTables(client);
    await clearExistingDemoData(client);

    const [categoriesRes, communesRes] = await Promise.all([
      client.query(`SELECT id, slug FROM categories`),
      client.query(`SELECT id, slug FROM communes`),
    ]);

    const categories = categoriesRes.rows;
    const communes = communesRes.rows;
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const usersByEmail = new Map();

    for (const seedUser of DEMO_USERS) {
      const commune = lookupBySlug(communes, seedUser.commune_slug);
      const result = await client.query(
        `INSERT INTO users (
          email, password_hash, prenom, nom, telephone,
          phone_verified, email_verified, avatar_url, commune_id,
          bio, is_admin, is_pro, pro_plan, pro_expires_at,
          last_bon_plan_offer_at, nb_annonces, note_moyenne, nb_avis,
          trust_score, trust_level, pro_since, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          TRUE, TRUE, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, NOW(), NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          prenom = EXCLUDED.prenom,
          nom = EXCLUDED.nom,
          telephone = EXCLUDED.telephone,
          phone_verified = EXCLUDED.phone_verified,
          email_verified = EXCLUDED.email_verified,
          avatar_url = EXCLUDED.avatar_url,
          commune_id = EXCLUDED.commune_id,
          bio = EXCLUDED.bio,
          is_admin = EXCLUDED.is_admin,
          is_pro = EXCLUDED.is_pro,
          pro_plan = EXCLUDED.pro_plan,
          pro_expires_at = EXCLUDED.pro_expires_at,
          last_bon_plan_offer_at = EXCLUDED.last_bon_plan_offer_at,
          nb_annonces = EXCLUDED.nb_annonces,
          note_moyenne = EXCLUDED.note_moyenne,
          nb_avis = EXCLUDED.nb_avis,
          trust_score = EXCLUDED.trust_score,
          trust_level = EXCLUDED.trust_level,
          pro_since = EXCLUDED.pro_since,
          updated_at = NOW()
        RETURNING id, email`,
        [
          seedUser.email,
          passwordHash,
          seedUser.prenom,
          seedUser.nom,
          seedUser.email === 'admin@demo.troca' ? '+687999000' : null,
          null,
          commune?.id ?? null,
          seedUser.bio,
          seedUser.is_admin ?? false,
          seedUser.is_pro ?? false,
          seedUser.pro_plan ?? null,
          seedUser.is_pro ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 45) : null,
          seedUser.email === 'bonplan@demo.troca' ? new Date() : null,
          seedUser.nb_annonces ?? 0,
          seedUser.rating ?? 0,
          seedUser.nb_avis ?? 0,
          seedUser.trust_score ?? 75,
          seedUser.trust_level ?? 'bon',
          seedUser.is_pro ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) : null,
        ]
      );

      usersByEmail.set(seedUser.email, result.rows[0]);
    }

    const listingRows = [];

    for (const seedListing of DEMO_LISTINGS) {
      const seller = usersByEmail.get(seedListing.seller);
      const category = lookupBySlug(categories, seedListing.category_slug);
      const commune = lookupBySlug(communes, seedListing.commune_slug);
      const accent = seedListing.is_boosted ? '#0A7EA4' : '#FF7A59';
      const secondary = seedListing.category_slug === 'immobilier' ? '#48CAE4' : '#1D3557';
      const cover = buildSvgDataUri({ title: seedListing.titre, accent, secondary });
      const thumbnail = buildSvgDataUri({
        title: seedListing.titre.slice(0, 16),
        accent: secondary,
        secondary: accent,
      });
      const listing = await client.query(
        `INSERT INTO annonces (
          user_id, category_id, commune_id, titre, description, prix,
          condition, status, is_boosted, boost_type, boost_expires_at,
          nb_vues, nb_favoris, slug, published_at, created_at, updated_at,
          is_negotiable, contre_quoi
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, 'active', $8, $9, $10,
          $11, $12, $13, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW(),
          $14, $15
        )
        RETURNING id, titre`,
        [
          seller.id,
          category?.id ?? null,
          commune?.id ?? null,
          seedListing.titre,
          seedListing.description,
          seedListing.prix,
          seedListing.condition,
          Boolean(seedListing.is_boosted),
          seedListing.boost_type ?? null,
          seedListing.is_boosted ? new Date(Date.now() + (seedListing.boost_days || 7) * 24 * 60 * 60 * 1000) : null,
          Math.floor(Math.random() * 240) + 20,
          Math.floor(Math.random() * 38) + 2,
          `${seedListing.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${Date.now()}`,
          /troc|promo|event|concert|promo/i.test(seedListing.tags.join(' ')),
          seedListing.tags.join(', '),
        ]
      );

      const listingId = listing.rows[0].id;
      listingRows.push({ ...seedListing, id: listingId, seller: seller.email, cover });

      await client.query(
        `INSERT INTO annonce_images (annonce_id, url, thumbnail_url, position, sort_order, is_cover)
         VALUES ($1, $2, $3, 0, 0, TRUE)`,
        [listingId, cover, thumbnail]
      );

      await client.query(
        `INSERT INTO annonce_images (annonce_id, url, thumbnail_url, position, sort_order, is_cover)
         VALUES ($1, $2, $3, 1, 1, FALSE)`,
        [listingId, cover, thumbnail]
      );
    }

    const listingIdByTitle = new Map();
    for (const item of listingRows) {
      listingIdByTitle.set(item.titre, item.id);
    }

    const favorites = [
      ['particulier@demo.troca', 'Toyota Hilux 2019 4x4 diesel'],
      ['particulier@demo.troca', 'Studio rénové avec vue mer'],
      ['loueur@demo.troca', 'MacBook Air M2 15 pouces'],
      ['marine@demo.troca', 'Bon plan week-end musique live'],
      ['marine@demo.troca', 'VTT tout suspendu taille L'],
    ];

    for (const [email, title] of favorites) {
      const user = usersByEmail.get(email);
      const annonceId = listingIdByTitle.get(title);
      if (!user || !annonceId) continue;
      await client.query(
        `INSERT INTO favoris (user_id, annonce_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [user.id, annonceId]
      );
    }

    const alerts = [
      {
        email: 'particulier@demo.troca',
        label: 'Voiture familiale',
        filters: { category: 'vehicules', commune_id: lookupBySlug(communes, 'noumea')?.id ?? null, price_max: 3500000 },
      },
      {
        email: 'loueur@demo.troca',
        label: 'Studio location',
        filters: { category: 'immobilier', commune_id: lookupBySlug(communes, 'noumea')?.id ?? null, price_max: 150000 },
      },
      {
        email: 'marine@demo.troca',
        label: 'Matériel multimédia',
        filters: { category: 'multimedia', price_max: 250000 },
      },
    ];

    for (const alert of alerts) {
      const user = usersByEmail.get(alert.email);
      if (!user) continue;
      await client.query(
        `INSERT INTO search_alerts (user_id, label, filters, active, created_at)
         VALUES ($1, $2, $3, TRUE, NOW() - INTERVAL '12 hours')`,
        [user.id, alert.label, JSON.stringify(alert.filters)]
      );
    }

    for (const review of [
      { author: 'particulier@demo.troca', target: 'pro@demo.troca', note: 5, commentaire: 'Réponse rapide et très propre.' },
      { author: 'marine@demo.troca', target: 'particulier@demo.troca', note: 4, commentaire: 'Bonne communication et photos fidèles.' },
      { author: 'loueur@demo.troca', target: 'pro@demo.troca', note: 5, commentaire: 'Expérience très pro, parfait pour tester le dashboard.' },
    ]) {
      const author = usersByEmail.get(review.author);
      const target = usersByEmail.get(review.target);
      if (!author || !target) continue;
      await client.query(
        `INSERT INTO avis (auteur_id, destinataire_id, note, commentaire)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (auteur_id, destinataire_id) DO UPDATE SET note = EXCLUDED.note, commentaire = EXCLUDED.commentaire`,
        [author.id, target.id, review.note, review.commentaire]
      );
    }

    for (const [email, extra] of [
      ['particulier@demo.troca', { type: 'ios', suffix: '001' }],
      ['pro@demo.troca', { type: 'android', suffix: '002' }],
      ['bonplan@demo.troca', { type: 'ios', suffix: '003' }],
    ]) {
      const user = usersByEmail.get(email);
      if (!user) continue;
      await client.query(
        `INSERT INTO push_tokens (user_id, token, platform, created_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '6 hours')
         ON CONFLICT (token) DO NOTHING`,
        [user.id, `${email.replace(/@.*/, '')}-push-${extra.suffix}`, extra.type]
      );
    }

    for (const paymentSeed of DEMO_PAYMENTS) {
      const user = usersByEmail.get(paymentSeed.email);
      if (!user) continue;
      await client.query(
        `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
         ON CONFLICT (provider_ref) DO UPDATE SET
          amount_xpf = EXCLUDED.amount_xpf,
          status = EXCLUDED.status,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()`,
        [user.id, paymentSeed.type, paymentSeed.provider, paymentSeed.provider_ref, paymentSeed.amount_xpf, paymentSeed.status, JSON.stringify(paymentSeed.metadata)]
      );

      if (paymentSeed.status === 'succeeded') {
        await client.query(
          `INSERT INTO billing_documents (
            user_id, provider, provider_ref, document_type, status,
            amount_xpf, currency, pdf_url, hosted_url, payload, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, 'issued',
            $5, 'XPF', $6, $7, $8, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
          )
          ON CONFLICT (provider, provider_ref, document_type) DO UPDATE SET
            status = EXCLUDED.status,
            amount_xpf = EXCLUDED.amount_xpf,
            payload = EXCLUDED.payload,
            updated_at = NOW()`,
          [
            user.id,
            paymentSeed.provider,
            paymentSeed.provider_ref,
            paymentSeed.document_type,
            paymentSeed.amount_xpf,
            `data:text/plain;base64,${Buffer.from(`Troca demo ${paymentSeed.provider_ref}`).toString('base64')}`,
            `https://demo.troca.local/${paymentSeed.provider}/${paymentSeed.provider_ref}`,
            JSON.stringify({ demo: true, ...paymentSeed.metadata }),
          ]
        );
      }
    }

    const conversationSeeds = [
      {
        listing_title: 'Toyota Hilux 2019 4x4 diesel',
        buyer: 'particulier@demo.troca',
        seller: 'pro@demo.troca',
        subject: 'Bonjour, le véhicule est-il toujours disponible ?',
        replies: [
          'Oui, il est toujours disponible et visible pour le QA local.',
          'Parfait, je souhaite venir le voir demain après 18h.',
          'C’est noté, je vous réserve le créneau.',
        ],
      },
      {
        listing_title: 'Studio rénové avec vue mer',
        buyer: 'loueur@demo.troca',
        seller: 'particulier@demo.troca',
        subject: 'Bonsoir, pouvez-vous m’envoyer la surface exacte ?',
        replies: [
          'Le studio fait 32 m², avec balcon et place de parking.',
          'Super, merci. Je suis très intéressé pour une visite.',
          'Je vous envoie les horaires demain matin.',
        ],
      },
    ];

    for (const convoSeed of conversationSeeds) {
      const buyer = usersByEmail.get(convoSeed.buyer);
      const seller = usersByEmail.get(convoSeed.seller);
      const listingId = listingIdByTitle.get(convoSeed.listing_title);
      if (!buyer || !seller || !listingId) continue;

      const convResult = await client.query(
        `INSERT INTO conversations (annonce_id, buyer_id, seller_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW() - INTERVAL '2 days', NOW())
         ON CONFLICT (annonce_id, buyer_id) DO UPDATE SET seller_id = EXCLUDED.seller_id, updated_at = NOW()
         RETURNING id`,
        [listingId, buyer.id, seller.id]
      );
      const conversationId = convResult.rows[0].id;

      const insertedMessages = [];
      insertedMessages.push(
        await client.query(
          `INSERT INTO messages (conv_id, sender_id, type, content, created_at)
           VALUES ($1, $2, 'text', $3, NOW() - INTERVAL '1 day 3 hours')
           RETURNING id`,
          [conversationId, buyer.id, convoSeed.subject]
        )
      );

      let minutes = 120;
      for (let i = 0; i < convoSeed.replies.length; i += 1) {
        const senderId = i % 2 === 0 ? seller.id : buyer.id;
        const text = convoSeed.replies[i];
        insertedMessages.push(
          await client.query(
            `INSERT INTO messages (conv_id, sender_id, type, content, created_at, read_at)
             VALUES ($1, $2, 'text', $3, NOW() - INTERVAL '${minutes} minutes', $4)
             RETURNING id`,
            [conversationId, senderId, text, senderId === seller.id ? null : new Date()]
          )
        );
        minutes -= 25;
      }

      await client.query(
        `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
        [conversationId]
      );
    }

    const rideSeeds = [
      {
        driver: 'pro@demo.troca',
        departure: 'Noumea',
        destination: 'Bourail',
        ride_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
        ride_time: '07:30',
        seats_total: 3,
        price_xpf: 1800,
        vehicle: 'SUV climatisé',
        comfort: 'Bagages acceptés, musique douce, arrêt photo possible',
        description: 'Trajet interurbain confortable, départ centre-ville avec retour en fin de journée.',
      },
      {
        driver: 'particulier@demo.troca',
        departure: 'Dumbea',
        destination: 'Noumea',
        ride_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString().slice(0, 10),
        ride_time: '08:10',
        seats_total: 4,
        price_xpf: 700,
        vehicle: 'Citadine propre',
        comfort: 'Non-fumeur, petit bagage, échange facile',
        description: 'Covoiturage quotidien pour les trajets domicile-travail avec profil de confiance.',
      },
      {
        driver: 'bonplan@demo.troca',
        departure: 'Païta',
        destination: 'Noumea',
        ride_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString().slice(0, 10),
        ride_time: '16:45',
        seats_total: 2,
        price_xpf: 900,
        vehicle: 'Berline',
        comfort: 'Animaux de petite taille acceptés',
        description: 'Trajet de retour avec conducteur vérifié, idéal pour tester la réservation rapide.',
      },
    ];

    const rideIdsByDriver = new Map();
    for (const rideSeed of rideSeeds) {
      const driver = usersByEmail.get(rideSeed.driver);
      if (!driver) continue;
      const inserted = await client.query(
        `INSERT INTO covoiturages (
          user_id, departure, destination, stops, ride_date, ride_time, seats_total, seats_reserved,
          price_xpf, vehicle, comfort, luggage_allowed, music_allowed, no_smoking, animals_allowed,
          description, status, departure_commune_id, destination_commune_id, trust_score,
          is_verified_driver, expires_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4::jsonb, $5, $6, $7, 1,
          $8, $9, $10, $11, TRUE, TRUE, FALSE,
          $12, 'published', NULL, NULL, $13,
          TRUE, $14, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
        )
        RETURNING id, departure, destination`,
        [
          driver.id,
          rideSeed.departure,
          rideSeed.destination,
          JSON.stringify([rideSeed.departure, rideSeed.destination]),
          rideSeed.ride_date,
          rideSeed.ride_time,
          rideSeed.seats_total,
          rideSeed.price_xpf,
          rideSeed.vehicle,
          rideSeed.comfort,
          'Petit bagage',
          rideSeed.description,
          driver.trust_score ?? 80,
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        ]
      );
      rideIdsByDriver.set(rideSeed.driver, inserted.rows[0].id);
    }

    const rideBookings = [
      { ride_driver: 'pro@demo.troca', passenger: 'particulier@demo.troca', seats: 1 },
      { ride_driver: 'particulier@demo.troca', passenger: 'loueur@demo.troca', seats: 2 },
    ];

    for (const bookingSeed of rideBookings) {
      const rideId = rideIdsByDriver.get(bookingSeed.ride_driver);
      const passenger = usersByEmail.get(bookingSeed.passenger);
      if (!rideId || !passenger) continue;
      await client.query(
        `INSERT INTO covoiturage_bookings (covoiturage_id, user_id, seats, status, created_at)
         VALUES ($1, $2, $3, 'confirmed', NOW() - INTERVAL '12 hours')`,
        [rideId, passenger.id, bookingSeed.seats]
      );
    }

    for (const user of usersByEmail.values()) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, href, is_read, created_at)
         VALUES
           ($1, 'review', 'Votre profil est prêt', 'Le mode démo local est actif et prêt pour le QA.', '/profil', FALSE, NOW() - INTERVAL '8 hours'),
           ($1, 'search_alert', '3 nouvelles annonces pour votre alerte', 'Une alerte locale a trouvé plusieurs résultats pertinents.', '/annonces', FALSE, NOW() - INTERVAL '6 hours')
         ON CONFLICT DO NOTHING`,
        [user.id]
      ).catch(() => {});
    }

    for (const [userKey, eventName, pagePath, deviceType] of [
      ['particulier@demo.troca', 'page_view', '/', 'web'],
      ['particulier@demo.troca', 'listing_view', '/annonces/1', 'web'],
      ['pro@demo.troca', 'checkout_start', '/pro', 'web'],
      ['pro@demo.troca', 'checkout_success', '/paiement/succes', 'web'],
      ['bonplan@demo.troca', 'page_view', '/annonces/nouvelle', 'mobile'],
      ['loueur@demo.troca', 'favorite_add', '/annonces', 'mobile'],
    ]) {
      const user = usersByEmail.get(userKey);
      if (!user) continue;
      await client.query(
        `INSERT INTO analytics_events (user_id, session_id, event_name, page_path, referrer, device_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '3 hours')`,
        [
          user.id,
          `demo-${user.id}-${eventName}`,
          eventName,
          pagePath,
          '/qa',
          deviceType,
          JSON.stringify({ demo: true, qa: true }),
        ]
      );
    }

    for (const user of usersByEmail.values()) {
      await client.query(
        `INSERT INTO rgpd_consentements (user_id, analytics, marketing, ip_address, created_at)
         VALUES ($1, TRUE, FALSE, '127.0.0.1', NOW() - INTERVAL '1 day')
         ON CONFLICT (user_id)
         DO UPDATE SET analytics = EXCLUDED.analytics, marketing = EXCLUDED.marketing, ip_address = EXCLUDED.ip_address, created_at = NOW()`,
        [user.id]
      );
      await client.query(
        `INSERT INTO rgpd_logs (user_id, action, ip_address, created_at)
         VALUES ($1, 'demo_seeded', '127.0.0.1', NOW() - INTERVAL '1 day')`,
        [user.id]
      ).catch(() => {});
    }

    return {
      passwords: {
        default: DEMO_PASSWORD,
      },
      users: DEMO_USERS.map((user) => ({
        email: user.email,
        role: user.email === 'admin@demo.troca'
          ? 'admin'
          : user.email === 'pro@demo.troca'
            ? 'pro'
            : user.email === 'bonplan@demo.troca'
              ? 'bon_plan'
              : 'particulier',
      })),
      counts: {
        users: DEMO_USERS.length,
        listings: DEMO_LISTINGS.length,
        covoiturages: rideSeeds.length,
      },
    };
  });
}

async function clearDemoDataset() {
  if (!isDemoRuntimeEnabled()) {
    throw new Error('Le seed démo est désactivé hors environnement local.');
  }

  return withTransaction(async (client) => {
    await ensureDemoTables(client);
    await clearExistingDemoData(client);
    return { cleared: true };
  });
}

async function getDemoStatus() {
  if (!isDemoRuntimeEnabled()) {
    return {
      enabled: false,
      domain: DEMO_DOMAIN,
      counts: { users: 0, listings: 0, messages: 0, notifications: 0 },
      credentials: [],
    };
  }

  const userCount = await withTransaction(async (client) => {
    const [{ rows: users }, { rows: listings }, { rows: messages }, { rows: notifications }] = await Promise.all([
      client.query(`SELECT COUNT(*)::int AS count FROM users WHERE email LIKE $1`, [`%${DEMO_DOMAIN}`]),
      client.query(`SELECT COUNT(*)::int AS count FROM annonces a JOIN users u ON u.id = a.user_id WHERE u.email LIKE $1`, [`%${DEMO_DOMAIN}`]),
      client.query(`SELECT COUNT(*)::int AS count FROM messages m JOIN users u ON u.id = m.sender_id WHERE u.email LIKE $1`, [`%${DEMO_DOMAIN}`]),
      client.query(`SELECT COUNT(*)::int AS count FROM notifications n JOIN users u ON u.id = n.user_id WHERE u.email LIKE $1`, [`%${DEMO_DOMAIN}`]),
    ]);

    return {
      users: users[0]?.count ?? 0,
      listings: listings[0]?.count ?? 0,
      messages: messages[0]?.count ?? 0,
      notifications: notifications[0]?.count ?? 0,
    };
  });

  return {
    enabled: true,
    domain: DEMO_DOMAIN,
    counts: userCount,
    credentials: DEMO_USERS.map((user) => ({ email: user.email, password: DEMO_PASSWORD })),
  };
}

module.exports = {
  DEMO_DOMAIN,
  DEMO_PASSWORD,
  clearDemoDataset,
  getDemoStatus,
  seedDemoDataset,
};
