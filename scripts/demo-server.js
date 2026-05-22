'use strict';

const http = require('node:http');
const { URL } = require('node:url');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.DEMO_API_PORT || process.env.PORT || 3001);
const DEMO_PASSWORD = 'Demo1234!';

function nowIso() {
  return new Date().toISOString();
}

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function makeJwtLikeToken(payload) {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.demo`;
}

function svgDataUri(title, subtitle, hue = 196) {
  const safeTitle = String(title).replace(/[<>&]/g, '');
  const safeSubtitle = String(subtitle).replace(/[<>&]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 85% 58%)"/>
          <stop offset="100%" stop-color="hsl(${(hue + 42) % 360} 70% 28%)"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="64" fill="url(#g)"/>
      <circle cx="980" cy="180" r="210" fill="rgba(255,255,255,0.12)"/>
      <circle cx="250" cy="720" r="260" fill="rgba(255,255,255,0.08)"/>
      <text x="72" y="126" fill="rgba(255,255,255,0.9)" font-size="54" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
      <text x="72" y="190" fill="rgba(255,255,255,0.8)" font-size="28" font-family="Arial, sans-serif">${safeSubtitle}</text>
      <rect x="72" y="250" width="520" height="420" rx="40" fill="rgba(255,255,255,0.12)"/>
      <rect x="636" y="250" width="492" height="180" rx="40" fill="rgba(255,255,255,0.12)"/>
      <rect x="636" y="450" width="492" height="220" rx="40" fill="rgba(255,255,255,0.12)"/>
      <text x="110" y="470" fill="white" font-size="120" font-family="Arial, sans-serif" font-weight="700">Troca</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function json(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function text(res, statusCode, body, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    ...extraHeaders,
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CATEGORY_CATALOG = [
  { id: 1, name: 'Emploi', slug: 'emploi', icon: '✦', subcategories: [
    { id: 11, name: "Offres d'emploi", slug: 'offres-emploi' },
    { id: 12, name: 'Formations professionnelles', slug: 'formations-professionnelles' },
  ]},
  { id: 2, name: 'Véhicules', slug: 'vehicules', icon: '◢', subcategories: [
    { id: 21, name: 'Voitures', slug: 'voitures' },
    { id: 22, name: 'Motos', slug: 'motos' },
    { id: 23, name: 'Utilitaires', slug: 'utilitaires' },
    { id: 24, name: 'Nautisme', slug: 'nautisme' },
  ]},
  { id: 3, name: 'Immobilier', slug: 'immobilier', icon: '⌂', subcategories: [
    { id: 31, name: 'Ventes immobilières', slug: 'ventes-immobilieres' },
    { id: 32, name: 'Locations', slug: 'locations' },
    { id: 33, name: 'Colocations', slug: 'colocations' },
  ]},
  { id: 4, name: 'Électronique', slug: 'electronique', icon: '◼', subcategories: [
    { id: 41, name: 'Ordinateurs', slug: 'ordinateurs' },
    { id: 42, name: 'Téléphones & Objets connectés', slug: 'telephones-objets-connectes' },
    { id: 43, name: 'Consoles', slug: 'consoles' },
    { id: 44, name: 'Jeux vidéo', slug: 'jeux-video' },
  ]},
  { id: 5, name: 'Maison & Jardin', slug: 'maison-jardin', icon: '◫', subcategories: [
    { id: 51, name: 'Ameublement', slug: 'ameublement' },
    { id: 52, name: 'Électroménager', slug: 'electromenager' },
    { id: 53, name: 'Décoration', slug: 'decoration' },
  ]},
  { id: 6, name: 'Mode', slug: 'mode', icon: '◍', subcategories: [
    { id: 61, name: 'Vêtements', slug: 'vetements' },
    { id: 62, name: 'Chaussures', slug: 'chaussures' },
  ]},
  { id: 7, name: 'Loisirs', slug: 'loisirs', icon: '◌', subcategories: [
    { id: 71, name: 'Livres', slug: 'livres' },
    { id: 72, name: 'Sport & Plein air', slug: 'sport-plein-air' },
    { id: 73, name: 'Vélos', slug: 'velos' },
  ]},
  { id: 8, name: 'Services', slug: 'services', icon: '◐', subcategories: [
    { id: 81, name: 'Baby-Sitting', slug: 'baby-sitting' },
    { id: 82, name: 'Cours particuliers', slug: 'cours-particuliers' },
    { id: 83, name: 'Services à la personne', slug: 'services-a-la-personne' },
  ]},
  { id: 9, name: 'Troc', slug: 'troc', icon: '⇄', subcategories: [
    { id: 91, name: 'Échange', slug: 'echange' },
    { id: 92, name: 'Don', slug: 'don' },
    { id: 93, name: 'Contre-service', slug: 'contre-service' },
  ]},
  { id: 10, name: 'Divers', slug: 'divers', icon: '⋯', subcategories: [
    { id: 101, name: 'Autres', slug: 'autres' },
  ]},
];

const PROVINCES = [
  {
    id: 1,
    name: 'Province Sud',
    code: 'S',
    communes: [
      { id: 101, name: 'Nouméa', latitude: -22.2758, longitude: 166.458 },
      { id: 102, name: 'Dumbéa', latitude: -22.15, longitude: 166.45 },
      { id: 103, name: 'Païta', latitude: -22.133, longitude: 166.37 },
      { id: 104, name: 'Mont-Dore', latitude: -22.214, longitude: 166.545 },
      { id: 105, name: 'Bourail', latitude: -21.5706, longitude: 165.493 },
    ],
  },
  {
    id: 2,
    name: 'Province Nord',
    code: 'N',
    communes: [
      { id: 201, name: 'Koné', latitude: -21.0667, longitude: 164.8667 },
      { id: 202, name: 'Koumac', latitude: -20.567, longitude: 164.283 },
      { id: 203, name: 'Voh', latitude: -20.942, longitude: 164.685 },
      { id: 204, name: 'Houailou', latitude: -21.283, longitude: 165.617 },
      { id: 205, name: 'Poum', latitude: -20.233, longitude: 164.017 },
    ],
  },
  {
    id: 3,
    name: 'Province Îles',
    code: 'I',
    communes: [
      { id: 301, name: 'Lifou', latitude: -20.919, longitude: 167.263 },
      { id: 302, name: 'Maré', latitude: -21.498, longitude: 167.988 },
      { id: 303, name: 'Ouvéa', latitude: -20.64, longitude: 166.562 },
    ],
  },
];

function flattenCategories() {
  const list = [];
  for (const cat of CATEGORY_CATALOG) {
    list.push(cat);
    for (const sub of cat.subcategories || []) list.push(sub);
  }
  return list;
}

function findCategoryBySlug(slug) {
  const normalized = String(slug || '').toLowerCase();
  for (const cat of CATEGORY_CATALOG) {
    if (cat.slug === normalized) return cat;
    const sub = (cat.subcategories || []).find((s) => s.slug === normalized);
    if (sub) return sub;
  }
  return null;
}

function categoryLabel(slug) {
  const found = findCategoryBySlug(slug);
  return found ? found.name : slug;
}

function communeLabel(id) {
  for (const province of PROVINCES) {
    const commune = province.communes.find((c) => String(c.id) === String(id));
    if (commune) return commune.name;
  }
  return 'Nouméa';
}

function provinceForCommuneId(id) {
  return PROVINCES.find((p) => p.communes.some((c) => String(c.id) === String(id))) || null;
}

const DEMO_PASSWORD_HASH = 'demo';

function createUsers() {
  const base = [
    { id: 1, email: 'admin@demo.troca', first_name: 'Ada', last_name: 'Admin', is_admin: true, is_pro: true, is_verified: true, rating: 5, commune_name: 'Nouméa', province_name: 'Province Sud', demo_role: 'admin', trust_score: 98, note_moyenne: 5, nb_avis: 18, nb_annonces: 5, telephone_verifie: true, bio: 'Administratrice locale de démonstration.' },
    { id: 2, email: 'particulier@demo.troca', first_name: 'Emma', last_name: 'Martin', is_admin: false, is_pro: false, is_verified: true, rating: 4.8, commune_name: 'Nouméa', province_name: 'Province Sud', demo_role: 'particulier', trust_score: 91, note_moyenne: 4.8, nb_avis: 6, nb_annonces: 3, telephone_verifie: true, bio: 'Particulier actif, aime les bonnes affaires.' },
    { id: 3, email: 'pro@demo.troca', first_name: 'Atelier', last_name: 'Kalo', is_admin: false, is_pro: true, is_verified: true, rating: 4.9, commune_name: 'Dumbéa', province_name: 'Province Sud', demo_role: 'pro', trust_score: 96, note_moyenne: 4.9, nb_avis: 14, nb_annonces: 9, telephone_verifie: true, bio: 'Comptes pro et service client réactif.' },
    { id: 4, email: 'bonplan@demo.troca', first_name: 'Troca', last_name: 'Bon Plan', is_admin: false, is_pro: true, is_verified: true, rating: 5, commune_name: 'Nouméa', province_name: 'Province Sud', demo_role: 'bon_plan', trust_score: 99, note_moyenne: 5, nb_avis: 31, nb_annonces: 12, telephone_verifie: true, bio: 'Vendeur vedette avec historique solide.' },
    { id: 5, email: 'loueur@demo.troca', first_name: 'Lucas', last_name: 'Bernier', is_admin: false, is_pro: false, is_verified: true, rating: 4.6, commune_name: 'Koné', province_name: 'Province Nord', demo_role: 'visitor', trust_score: 84, note_moyenne: 4.6, nb_avis: 4, nb_annonces: 2, telephone_verifie: false, bio: 'Location et troc entre particuliers.' },
    { id: 6, email: 'marine@demo.troca', first_name: 'Marine', last_name: 'Dupont', is_admin: false, is_pro: false, is_verified: true, rating: 4.7, commune_name: 'Lifou', province_name: 'Province Îles', demo_role: 'visitor', trust_score: 88, note_moyenne: 4.7, nb_avis: 7, nb_annonces: 4, telephone_verifie: true, bio: 'Parcours mobile simple et fluide.' },
  ];

  return base.map((user) => ({
    ...user,
    password: DEMO_PASSWORD_HASH,
    avatar_url: null,
    created_at: new Date(Date.now() - (user.id * 17 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: nowIso(),
    phone: user.id === 1 ? '+687000001' : `+6870000${user.id}`,
  }));
}

function createListings(users) {
  const demoImgs = [
    svgDataUri('Troca', 'Annonce locale', 195),
    svgDataUri('Pro', 'Offre premium', 14),
    svgDataUri('Maison', 'Objet du quotidien', 25),
    svgDataUri('Mobilité', 'Véhicule / service', 120),
  ];

  const seed = [
    [101, 2, 'iPhone 13 128 Go', 65000, 'electronique', 42, 'Nouméa', 'new', 'Très bon état, batterie 89%.', true, true, false],
    [102, 3, 'Service de maintenance PC', 8000, 'services', 83, 'Dumbéa', 'good', 'Intervention à domicile ou en atelier.', false, false, true],
    [103, 4, 'Vélo électrique reconditionné', 125000, 'loisirs', 73, 'Nouméa', 'like_new', 'Autonomie 65 km, révision complète.', true, false, true],
    [104, 5, 'Canapé 3 places beige', 18000, 'maison-jardin', 51, 'Koné', 'good', 'A récupérer ce week-end.', false, false, false],
    [105, 6, 'Pack bébé complet', 12000, 'famille', 999, 'Lifou', 'good', 'Lit, chaise haute, vêtements, lot complet.', false, false, false],
    [106, 2, 'Cours de guitare débutant', 3500, 'services', 82, 'Nouméa', 'new', 'Cours en visio ou en présentiel.', false, true, false],
    [107, 3, 'Skoda Octavia 2018', 1850000, 'vehicules', 21, 'Dumbéa', 'good', 'Entretien à jour, visible sur rendez-vous.', true, false, false],
    [108, 4, 'Location villa week-end', 28000, 'location-vacances', 32, 'Bourail', 'new', 'Piscine et vue mer, 2 nuits minimum.', true, false, true],
    [109, 5, 'Don: étagère métal', 0, 'troc', 92, 'Koné', 'fair', 'À donner contre enlèvement rapide.', false, false, false],
    [110, 6, 'Baby-sitting soirée', 5000, 'services', 81, 'Lifou', 'new', 'Disponible vendredi et samedi.', false, false, false],
    [111, 2, 'Console Switch OLED', 45000, 'electronique', 43, 'Mont-Dore', 'like_new', 'Boîte et accessoires inclus.', true, false, false],
    [112, 4, 'Appartement F2 centre-ville', 85000, 'immobilier', 32, 'Nouméa', 'good', 'Disponible à partir du 15.', true, true, false],
  ];

  return seed.map(([id, userId, title, price, categorySlug, categoryId, commune, condition, description, featured, urgent, free]) => {
    const user = users.find((u) => Number(u.id) === Number(userId)) || users[0];
    const province = PROVINCES.find((p) => p.name.includes('Sud')) || PROVINCES[0];
    const communeId = province.communes.find((c) => c.name === commune)?.id ?? province.communes[0].id;
    const cat = findCategoryBySlug(categorySlug) || CATEGORY_CATALOG[0];
    const cover = demoImgs[id % demoImgs.length];
    return {
      id,
      title,
      price: free ? 0 : price,
      prix: free ? 0 : price,
      price_negotiable: !free && id % 2 === 0,
      is_free: free,
      description,
      condition,
      status: 'published',
      is_featured: featured,
      is_urgent: urgent,
      nb_vues: 120 + id * 11,
      nb_favoris: 7 + (id % 5),
      commune_id: communeId,
      commune_name: commune,
      commune_slug: slugify(commune),
      category_id: categoryId,
      category_name: cat.name,
      category_slug: cat.slug,
      category_icon: cat.icon || '◼',
      published_at: new Date(Date.now() - id * 36 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - id * 40 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - id * 30 * 60 * 60 * 1000).toISOString(),
      contre_quoi: id % 3 === 0 ? 'À discuter' : null,
      images: [
        { id: id * 10 + 1, url: cover, thumbnail_url: cover },
        { id: id * 10 + 2, url: svgDataUri(title, commune, 280), thumbnail_url: svgDataUri(title, commune, 280) },
      ],
      cover_image: cover,
      user: {
        id: user.id,
        prenom: user.first_name,
        nom: user.last_name,
        avatar_url: user.avatar_url,
        is_pro: user.is_pro,
        note_moyenne: user.note_moyenne,
        nb_avis: user.nb_avis,
        nb_annonces: user.nb_annonces,
        created_at: user.created_at,
        seller_commune_name: user.commune_name,
        seller_province_name: user.province_name,
        email_verified: user.is_verified,
        telephone_verifie: user.telephone_verifie,
        trust_score: user.trust_score,
        trust_level: user.trust_score > 95 ? 'excellent' : 'bon',
      },
      seller_email_verified: user.is_verified,
      seller_phone_verified: user.telephone_verifie,
      seller_trust_score: user.trust_score,
      category_label: cat.name,
    };
  });
}

function createReviews(users) {
  return [
    { id: 1, user_id: 2, note: 5, commentaire: 'Très pro et réactif.', created_at: nowIso(), auteur_prenom: 'Emma', auteur_avatar: null },
    { id: 2, user_id: 2, note: 4, commentaire: 'Bonne transaction.', created_at: nowIso(), auteur_prenom: 'Lucas', auteur_avatar: null },
    { id: 3, user_id: 3, note: 5, commentaire: 'Service impeccable.', created_at: nowIso(), auteur_prenom: 'Marine', auteur_avatar: null },
  ];
}

function createNotifications(listings, users) {
  return [
    { id: 1, user_id: 2, title: 'Nouvelle réponse', body: 'Atelier Kalo a répondu à votre message.', href: '/messages?conv=1', is_read: false, created_at: nowIso() },
    { id: 2, user_id: 2, title: 'Favori enregistré', body: 'Votre annonce favorite a baissé de prix.', href: `/annonces/${listings[0].id}`, is_read: true, created_at: nowIso() },
    { id: 3, user_id: 3, title: 'Paiement validé', body: 'Votre abonnement de démonstration est actif.', href: '/parametres#factures', is_read: false, created_at: nowIso() },
  ];
}

function createPayments(users, listings) {
  return [
    {
      id: 1,
      user_id: 3,
      provider: 'stripe',
      type: 'subscription',
      status: 'active',
      plan: 'pro',
      amount: 9900,
      currency: 'XPF',
      provider_ref: 'stripe_demo_sub_001',
      period_start: nowIso(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: nowIso(),
    },
    {
      id: 2,
      user_id: 2,
      provider: 'payplug',
      type: 'boost',
      status: 'paid',
      plan: null,
      amount: 2500,
      currency: 'XPF',
      provider_ref: 'payplug_demo_boost_001',
      listing_id: listings[0].id,
      created_at: nowIso(),
    },
  ];
}

function createBillingDocs(payments) {
  return payments.map((payment, index) => ({
    id: index + 1,
    user_id: payment.user_id,
    payment_id: payment.id,
    number: `FAC-2026-${String(index + 1).padStart(4, '0')}`,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    created_at: payment.created_at,
    url: `https://demo.local/factures/${index + 1}.pdf`,
  }));
}

function createConversations(users, listings) {
  const messages1 = [
    { id: 1, conv_id: 1, sender_id: 2, type: 'text', content: 'Bonjour, l’annonce est-elle toujours disponible ?', read_at: nowIso(), created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 2, conv_id: 1, sender_id: 3, type: 'text', content: 'Oui, elle est disponible et peut être retirée ce soir.', read_at: nowIso(), created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
    { id: 3, conv_id: 1, sender_id: 2, type: 'offer', content: null, offer: { id: 1, amount_xpf: 62000, status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }, created_at: nowIso() },
  ];
  const messages2 = [
    { id: 4, conv_id: 2, sender_id: 4, type: 'text', content: 'Le lot bébé est encore en vente ?', read_at: nowIso(), created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 5, conv_id: 2, sender_id: 6, type: 'photo', content: null, photo_url: svgDataUri('Photo', 'Objet à vendre', 18), created_at: nowIso() },
  ];

  return [
    {
      id: 1,
      annonce_id: listings[0].id,
      buyer_id: 2,
      seller_id: 3,
      status: 'active',
      unread_count: 1,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: nowIso(),
      annonce: { id: listings[0].id, titre: listings[0].title, prix: listings[0].price, image: listings[0].cover_image, statut: listings[0].status },
      other_user: { id: 3, prenom: 'Atelier', nom: 'Kalo', avatar_url: null, telephone_verifie: true, is_pro: true, last_seen: nowIso() },
      messages: messages1,
    },
    {
      id: 2,
      annonce_id: listings[4].id,
      buyer_id: 4,
      seller_id: 6,
      status: 'active',
      unread_count: 0,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: nowIso(),
      annonce: { id: listings[4].id, titre: listings[4].title, prix: listings[4].price, image: listings[4].cover_image, statut: listings[4].status },
      other_user: { id: 6, prenom: 'Marine', nom: 'Dupont', avatar_url: null, telephone_verifie: true, is_pro: false, last_seen: nowIso() },
      messages: messages2,
    },
  ];
}

function createDemoState() {
  const users = createUsers();
  const listings = createListings(users);
  const reviews = createReviews(users);
  const notifications = createNotifications(listings, users);
  const payments = createPayments(users, listings);
  const billingDocs = createBillingDocs(payments);
  const conversations = createConversations(users, listings);
  const favorites = {
    2: new Set([String(listings[0].id), String(listings[2].id), String(listings[10].id)]),
    3: new Set([String(listings[1].id)]),
    4: new Set([String(listings[3].id)]),
    6: new Set([String(listings[4].id)]),
  };

  const analytics = [];
  const consent = [];
  const refreshByUserId = new Map();
  const accessByToken = new Map();
  const offers = new Map();

  for (const conv of conversations) {
    for (const msg of conv.messages) {
      if (msg.type === 'offer' && msg.offer) offers.set(msg.offer.id, { conv_id: conv.id, ...msg.offer });
    }
  }

  return {
    enabled: true,
    users,
    listings,
    reviews,
    notifications,
    payments,
    billingDocs,
    conversations,
    favorites,
    analytics,
    consent,
    refreshByUserId,
    accessByToken,
    offers,
    counters: {
      access: 0,
      refresh: 0,
      messages: Math.max(...conversations.flatMap((c) => c.messages.map((m) => m.id)), 0),
      notifications: notifications.length,
      payments: payments.length,
      reviews: reviews.length,
    },
  };
}

let state = createDemoState();

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url ?? null,
    is_verified: !!user.is_verified,
    is_pro: !!user.is_pro,
    is_admin: !!user.is_admin,
    rating: user.rating ?? 4.8,
    commune_name: user.commune_name ?? null,
    province_name: user.province_name ?? null,
    demo_role: user.demo_role ?? null,
    pro_plan: user.is_pro ? 'pro' : null,
    note_moyenne: user.note_moyenne ?? user.rating ?? 4.8,
    nb_avis: user.nb_avis ?? 0,
    nb_annonces: user.nb_annonces ?? 0,
    trust_score: user.trust_score ?? 90,
    telephone_verifie: !!user.telephone_verifie,
    bio: user.bio ?? '',
    created_at: user.created_at,
  };
}

function buildAuthResponse(user) {
  state.counters.access += 1;
  state.counters.refresh += 1;
  const access_token = makeJwtLikeToken({
    sub: user.id,
    email: user.email,
    role: user.is_admin ? 'admin' : user.is_pro ? 'pro' : 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  const refresh_token = `refresh_${user.id}_${randomUUID()}`;
  state.accessByToken.set(access_token, user.id);
  state.refreshByUserId.set(refresh_token, user.id);
  return { user: publicUser(user), access_token, refresh_token };
}

function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = state.accessByToken.get(token);
  if (!userId) return null;
  return state.users.find((u) => String(u.id) === String(userId)) || null;
}

function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    json(res, 401, { error: 'Non authentifié.' });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!user.is_admin) {
    json(res, 403, { error: 'Accès administrateur requis.' });
    return null;
  }
  return user;
}

function getListingById(id) {
  return state.listings.find((item) => String(item.id) === String(id)) || null;
}

function getConversationById(id) {
  return state.conversations.find((item) => String(item.id) === String(id)) || null;
}

function favoriteItemsForUser(userId) {
  const ids = state.favorites[String(userId)] || new Set();
  return state.listings
    .filter((listing) => ids.has(String(listing.id)))
    .map((listing) => ({
      id: String(listing.id),
      titre: listing.title,
      prix: listing.price,
      cover_image: listing.cover_image,
      commune: listing.commune_name,
      category: listing.category_name,
      savedAt: nowIso(),
    }));
}

function filteredListings(query) {
  let result = [...state.listings];
  const q = String(query.q || '').trim().toLowerCase();
  if (q) {
    result = result.filter((item) =>
      [item.title, item.description, item.commune_name, item.category_name, item.user?.prenom, item.user?.nom]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }
  if (query.category_id) {
    result = result.filter((item) => String(item.category_id) === String(query.category_id));
  }
  if (query.commune_id) {
    result = result.filter((item) => String(item.commune_id) === String(query.commune_id));
  }
  if (query.province_id) {
    const province = PROVINCES.find((p) => String(p.id) === String(query.province_id));
    const communeIds = new Set((province?.communes || []).map((c) => String(c.id)));
    result = result.filter((item) => communeIds.has(String(item.commune_id)));
  }
  if (query.price_min) {
    result = result.filter((item) => Number(item.price || 0) >= Number(query.price_min));
  }
  if (query.price_max) {
    result = result.filter((item) => Number(item.price || 0) <= Number(query.price_max));
  }
  if (query.condition) {
    result = result.filter((item) => String(item.condition) === String(query.condition));
  }
  if (query.troc === 'true') {
    result = result.filter((item) => item.category_slug === 'troc' || item.price === 0);
  }
  const sort = String(query.sort || 'date');
  if (sort === 'price_asc') result.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sort === 'price_desc') result.sort((a, b) => (b.price || 0) - (a.price || 0));
  else result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return result;
}

function paginate(list, page = 1, limit = 24) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * limit;
  return {
    items: list.slice(start, start + limit),
    pagination: { total, page: safePage, pages, limit },
  };
}

function getHomeStats() {
  const totalListings = state.listings.length;
  const activeUsers = state.users.filter((u) => !u.is_admin).length;
  const proUsers = state.users.filter((u) => u.is_pro).length;
  const totalViews = state.listings.reduce((sum, item) => sum + (item.nb_vues || 0), 0);
  const totalFavs = state.listings.reduce((sum, item) => sum + (item.nb_favoris || 0), 0);
  return {
    data: {
      annonces_actives: totalListings,
      utilisateurs_total: activeUsers,
      comptes_pro: proUsers,
      vues_total: totalViews,
      favoris_total: totalFavs,
      categories: CATEGORY_CATALOG.length,
    },
  };
}

function ensureList(v) {
  return Array.isArray(v) ? v : [];
}

async function handleRoute(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname, searchParams } = url;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  if (pathname === '/health' || pathname === '/api/health') {
    return json(res, 200, { ok: true, service: 'troca-demo-api', now: nowIso(), demo: true });
  }

  if (pathname === '/api/demo/status') {
    return json(res, 200, {
      data: {
        enabled: true,
        counts: {
          users: state.users.length,
          listings: state.listings.length,
          conversations: state.conversations.length,
          messages: state.conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
          notifications: state.notifications.length,
          payments: state.payments.length,
        },
      },
    });
  }

  if (pathname === '/api/demo/seed' && req.method === 'POST') {
    state = createDemoState();
    return json(res, 200, {
      message: 'Jeu de données démo généré.',
      data: {
        counts: {
          users: state.users.length,
          listings: state.listings.length,
          conversations: state.conversations.length,
        },
      },
    });
  }

  if (pathname === '/api/demo/seed' && req.method === 'DELETE') {
    state = createDemoState();
    state.listings = [];
    state.conversations = [];
    state.notifications = [];
    state.payments = [];
    state.billingDocs = [];
    state.reviews = [];
    state.favorites = {};
    return json(res, 200, {
      message: 'Jeu de données démo supprimé.',
      data: { cleared: true },
    });
  }

  if (pathname === '/api/communes' && req.method === 'GET') {
    return json(res, 200, { data: PROVINCES });
  }

  if (pathname === '/api/categories' && req.method === 'GET') {
    return json(res, 200, { data: CATEGORY_CATALOG });
  }

  if (pathname === '/api/stats/home' && req.method === 'GET') {
    return json(res, 200, getHomeStats());
  }

  if (pathname === '/api/stats/seller' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const listings = state.listings.filter((item) => String(item.user.id) === String(user.id));
    const views = listings.reduce((sum, item) => sum + (item.nb_vues || 0), 0);
    return json(res, 200, {
      data: {
        annonces_actives: listings.length,
        vues_total: views,
        favoris_total: listings.reduce((sum, item) => sum + (item.nb_favoris || 0), 0),
        messages_total: state.conversations.filter((c) => String(c.seller_id) === String(user.id) || String(c.buyer_id) === String(user.id)).reduce((sum, c) => sum + c.messages.length, 0),
      },
    });
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await readJson(req);
    const nextId = state.users.length ? Math.max(...state.users.map((u) => Number(u.id))) + 1 : 1;
    const user = {
      id: nextId,
      email: body.email,
      password: DEMO_PASSWORD_HASH,
      first_name: body.first_name || 'Utilisateur',
      last_name: body.last_name || 'Démo',
      avatar_url: null,
      is_verified: true,
      is_pro: !!body.is_pro,
      is_admin: false,
      rating: 4.8,
      commune_name: body.commune || 'Nouméa',
      province_name: 'Province Sud',
      demo_role: null,
      trust_score: 90,
      note_moyenne: 4.8,
      nb_avis: 0,
      nb_annonces: 0,
      telephone_verifie: false,
      bio: '',
      created_at: nowIso(),
      updated_at: nowIso(),
      phone: body.phone || null,
    };
    state.users.push(user);
    return json(res, 201, { data: buildAuthResponse(user) });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJson(req);
    const user = state.users.find((u) => u.email.toLowerCase() === String(body.email || '').toLowerCase());
    if (!user) return json(res, 401, { error: 'Identifiants invalides.' });
    if (String(body.password || '') !== DEMO_PASSWORD) return json(res, 401, { error: 'Identifiants invalides.' });
    return json(res, 200, { data: buildAuthResponse(user) });
  }

  if (pathname === '/api/auth/refresh' && req.method === 'POST') {
    const body = await readJson(req);
    const userId = state.refreshByUserId.get(body.refresh_token);
    if (!userId) return json(res, 401, { error: 'Refresh token invalide.' });
    const user = state.users.find((u) => String(u.id) === String(userId));
    if (!user) return json(res, 401, { error: 'Utilisateur introuvable.' });
    const auth = buildAuthResponse(user);
    return json(res, 200, { data: auth });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const body = await readJson(req);
    if (body.refresh_token) state.refreshByUserId.delete(body.refresh_token);
    return json(res, 200, { data: { ok: true } });
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    return json(res, 200, { data: publicUser(user) });
  }

  if (pathname === '/api/auth/verify-email' && req.method === 'POST') {
    return json(res, 200, { data: { verified: true } });
  }

  if (pathname === '/api/auth/resend-verification' && req.method === 'POST') {
    return json(res, 200, { data: { sent: true } });
  }

  if (pathname === '/api/auth/mot-de-passe-oublie' && req.method === 'POST') {
    return json(res, 200, { data: { sent: true } });
  }

  if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
    return json(res, 200, { data: { reset: true } });
  }

  if (pathname === '/api/auth/google' && req.method === 'POST') {
    const user = state.users.find((u) => u.email === 'particulier@demo.troca') || state.users[1];
    return json(res, 200, { data: buildAuthResponse(user) });
  }

  if (pathname === '/api/auth/apple' && req.method === 'POST') {
    const user = state.users.find((u) => u.email === 'pro@demo.troca') || state.users[2];
    return json(res, 200, { data: buildAuthResponse(user) });
  }

  if (pathname === '/api/listings' && req.method === 'GET') {
    const list = filteredListings(Object.fromEntries(searchParams.entries()));
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '24');
    const paginated = paginate(list, page, limit);
    return json(res, 200, {
      data: paginated.items,
      pagination: paginated.pagination,
    });
  }

  if (pathname === '/api/listings/sitemap' && req.method === 'GET') {
    return json(res, 200, { data: state.listings.map((item) => ({ id: item.id, slug: item.category_slug, updated_at: item.updated_at })) });
  }

  if (pathname === '/api/listings' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const nextId = state.listings.length ? Math.max(...state.listings.map((i) => Number(i.id))) + 1 : 1;
    const cat = findCategoryBySlug(body.category_slug || body.category || 'divers') || CATEGORY_CATALOG[CATEGORY_CATALOG.length - 1];
    const communeName = communeLabel(body.commune_id || 101);
    const listing = {
      id: nextId,
      title: body.title || body.titre || 'Nouvelle annonce démo',
      price: body.price ? Number(body.price) : 0,
      prix: body.price ? Number(body.price) : 0,
      price_negotiable: !!body.price_negotiable,
      is_free: Number(body.price || 0) === 0,
      description: body.description || '',
      condition: body.condition || 'good',
      status: 'published',
      is_featured: false,
      is_urgent: false,
      nb_vues: 0,
      nb_favoris: 0,
      commune_id: Number(body.commune_id || 101),
      commune_name: communeName,
      commune_slug: slugify(communeName),
      category_id: cat.id,
      category_name: cat.name,
      category_slug: cat.slug,
      category_icon: cat.icon || '◼',
      published_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
      images: [],
      cover_image: null,
      user: publicUser(user),
      seller_email_verified: true,
      seller_phone_verified: true,
      seller_trust_score: 90,
    };
    state.listings.unshift(listing);
    return json(res, 201, { data: listing });
  }

  const listingMatch = pathname.match(/^\/api\/listings\/([^/]+)$/);
  if (listingMatch && req.method === 'GET') {
    const listing = getListingById(listingMatch[1]);
    if (!listing) return json(res, 404, { error: 'Annonce introuvable.' });
    return json(res, 200, { data: listing });
  }

  if (listingMatch && req.method === 'PUT') {
    const user = requireAuth(req, res);
    if (!user) return;
    const listing = getListingById(listingMatch[1]);
    if (!listing) return json(res, 404, { error: 'Annonce introuvable.' });
    const body = await readJson(req);
    Object.assign(listing, {
      title: body.title ?? listing.title,
      description: body.description ?? listing.description,
      price: body.price != null ? Number(body.price) : listing.price,
      prix: body.price != null ? Number(body.price) : listing.prix,
      condition: body.condition ?? listing.condition,
      updated_at: nowIso(),
    });
    return json(res, 200, { data: listing });
  }

  if (listingMatch && req.method === 'DELETE') {
    const user = requireAuth(req, res);
    if (!user) return;
    state.listings = state.listings.filter((item) => String(item.id) !== String(listingMatch[1]));
    return json(res, 200, { data: { deleted: true } });
  }

  const userListingsMatch = pathname.match(/^\/api\/listings\/user\/([^/]+)$/);
  if (userListingsMatch && req.method === 'GET') {
    const userId = userListingsMatch[1];
    const items = state.listings.filter((item) => String(item.user.id) === String(userId));
    return json(res, 200, { data: items });
  }

  const uploadListingMatch = pathname.match(/^\/api\/upload\/listing\/([^/]+)$/);
  if (uploadListingMatch && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const listing = getListingById(uploadListingMatch[1]);
    if (!listing) return json(res, 404, { error: 'Annonce introuvable.' });
    const image = {
      id: randomUUID(),
      url: svgDataUri(listing.title, 'Upload local', 210),
      thumbnail_url: svgDataUri(listing.title, 'Thumbnail', 210),
    };
    listing.images = ensureList(listing.images);
    listing.images.push(image);
    listing.cover_image = listing.cover_image || image.url;
    return json(res, 200, { data: { images: [image], listing } });
  }

  if (pathname === '/api/upload/chat' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    return json(res, 200, { data: { url: svgDataUri('Chat', 'Photo envoyée', 33) } });
  }

  const deleteImageMatch = pathname.match(/^\/api\/upload\/image\/([^/]+)$/);
  if (deleteImageMatch && req.method === 'DELETE') {
    return json(res, 200, { data: { deleted: true } });
  }

  const coverImageMatch = pathname.match(/^\/api\/upload\/image\/([^/]+)\/cover$/);
  if (coverImageMatch && req.method === 'PUT') {
    return json(res, 200, { data: { updated: true } });
  }

  if (pathname === '/api/favoris' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    return json(res, 200, { data: favoriteItemsForUser(user.id) });
  }

  if (pathname === '/api/favoris' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const listing = getListingById(body.annonce_id);
    if (!listing) return json(res, 404, { error: 'Annonce introuvable.' });
    const key = String(user.id);
    if (!state.favorites[key]) state.favorites[key] = new Set();
    state.favorites[key].add(String(listing.id));
    return json(res, 200, { data: { ok: true } });
  }

  const favMatch = pathname.match(/^\/api\/favoris\/([^/]+)$/);
  if (favMatch && req.method === 'DELETE') {
    const user = requireAuth(req, res);
    if (!user) return;
    const key = String(user.id);
    if (!state.favorites[key]) state.favorites[key] = new Set();
    state.favorites[key].delete(String(favMatch[1]));
    return json(res, 200, { data: { ok: true } });
  }

  if (pathname === '/api/users/notifications' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const limit = Number(searchParams.get('limit') || '20');
    const data = state.notifications.filter((n) => String(n.user_id) === String(user.id)).slice(0, limit);
    return json(res, 200, { data });
  }

  if (pathname === '/api/users/notifications/read-all' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    state.notifications.forEach((n) => { if (String(n.user_id) === String(user.id)) n.is_read = true; });
    return json(res, 200, { data: { ok: true } });
  }

  const notifReadMatch = pathname.match(/^\/api\/users\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const notif = state.notifications.find((n) => String(n.id) === String(notifReadMatch[1]) && String(n.user_id) === String(user.id));
    if (notif) notif.is_read = true;
    return json(res, 200, { data: { ok: true } });
  }

  const userProfileMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userProfileMatch && req.method === 'GET') {
    const user = state.users.find((u) => String(u.id) === String(userProfileMatch[1]));
    if (!user) return json(res, 404, { error: 'Utilisateur introuvable.' });
    const reviews = state.reviews.filter((r) => String(r.user_id) === String(user.id));
    const items = state.listings.filter((item) => String(item.user.id) === String(user.id));
    return json(res, 200, {
      data: {
        ...publicUser(user),
        note_moyenne: user.note_moyenne ?? user.rating,
        nb_avis: reviews.length,
        nb_annonces: items.length,
        created_at: user.created_at,
        commune_name: user.commune_name,
        province_name: user.province_name,
      },
    });
  }

  if (pathname === '/api/users/me' && req.method === 'PUT') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    Object.assign(user, {
      first_name: body.first_name ?? user.first_name,
      last_name: body.last_name ?? user.last_name,
      commune_name: body.commune_name ?? user.commune_name,
      province_name: body.province_name ?? user.province_name,
      bio: body.bio ?? user.bio,
      updated_at: nowIso(),
    });
    return json(res, 200, { data: publicUser(user) });
  }

  if (pathname === '/api/users/me' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    return json(res, 200, { data: publicUser(user) });
  }

  const reviewsMatch = pathname.match(/^\/api\/users\/([^/]+)\/reviews$/);
  if (reviewsMatch && req.method === 'GET') {
    const userId = reviewsMatch[1];
    const reviews = state.reviews.filter((r) => String(r.user_id) === String(userId));
    return json(res, 200, { data: reviews });
  }
  if (reviewsMatch && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const review = {
      id: state.reviews.length ? Math.max(...state.reviews.map((r) => r.id)) + 1 : 1,
      user_id: Number(reviewsMatch[1]),
      note: Number(body.note || 5),
      commentaire: body.commentaire || '',
      created_at: nowIso(),
      auteur_prenom: user.first_name,
      auteur_avatar: user.avatar_url,
    };
    state.reviews.unshift(review);
    return json(res, 201, { data: review });
  }

  if (pathname === '/api/messages/conversations' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const convs = state.conversations.filter((conv) => String(conv.buyer_id) === String(user.id) || String(conv.seller_id) === String(user.id)).map((conv) => ({
      id: conv.id,
      annonce_id: conv.annonce_id,
      buyer_id: conv.buyer_id,
      seller_id: conv.seller_id,
      status: conv.status,
      last_message: conv.messages[conv.messages.length - 1] || null,
      unread_count: conv.unread_count,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      annonce: conv.annonce,
      other_user: conv.other_user,
    }));
    return json(res, 200, { data: convs });
  }

  if (pathname === '/api/messages/conversations' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const otherUser = state.users.find((u) => String(u.id) === String(body.other_user_id)) || state.users[2];
    const listing = getListingById(body.annonce_id) || state.listings[0];
    const conv = {
      id: state.conversations.length ? Math.max(...state.conversations.map((c) => Number(c.id))) + 1 : 1,
      annonce_id: listing.id,
      buyer_id: user.is_pro ? otherUser.id : user.id,
      seller_id: user.is_pro ? user.id : otherUser.id,
      status: 'active',
      unread_count: 0,
      created_at: nowIso(),
      updated_at: nowIso(),
      annonce: { id: listing.id, titre: listing.title, prix: listing.price, image: listing.cover_image, statut: listing.status },
      other_user: {
        id: otherUser.id,
        prenom: otherUser.first_name,
        nom: otherUser.last_name,
        avatar_url: otherUser.avatar_url,
        telephone_verifie: !!otherUser.telephone_verifie,
        is_pro: !!otherUser.is_pro,
        last_seen: nowIso(),
      },
      messages: [],
    };
    state.conversations.unshift(conv);
    return json(res, 201, { data: conv });
  }

  const convMatch = pathname.match(/^\/api\/messages\/conversations\/([^/]+)$/);
  if (convMatch && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const conv = getConversationById(convMatch[1]);
    if (!conv) return json(res, 404, { error: 'Conversation introuvable.' });
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '30');
    const list = [...conv.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = Math.max(0, total - page * limit);
    const end = total - (page - 1) * limit;
    const chunk = list.slice(Math.max(0, start), Math.max(0, end));
    return json(res, 200, { data: { messages: chunk, pagination: { total, page, pages, limit } } });
  }

  if (convMatch && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const conv = getConversationById(convMatch[1]);
    if (!conv) return json(res, 404, { error: 'Conversation introuvable.' });
    const body = await readJson(req);
    const id = ++state.counters.messages;
    const message = {
      id,
      conv_id: conv.id,
      sender_id: user.id,
      type: body.type || 'text',
      content: body.content ?? (body.type === 'photo' ? null : ''),
      photo_url: body.photo_url || null,
      created_at: nowIso(),
      read_at: user.id === conv.seller_id ? null : nowIso(),
    };
    if (message.type === 'offer') {
      const offer = { id: id, amount_xpf: Number(body.amount_xpf || 0), status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
      message.offer = offer;
      state.offers.set(offer.id, { conv_id: conv.id, ...offer });
    }
    conv.messages.push(message);
    conv.updated_at = nowIso();
    conv.last_message = message;
    return json(res, 201, { data: { message, offer: message.offer ?? null } });
  }

  if (pathname === '/api/messages/offers' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const conv = getConversationById(body.conv_id);
    if (!conv) return json(res, 404, { error: 'Conversation introuvable.' });
    const id = ++state.counters.messages;
    const offer = {
      id,
      amount_xpf: Number(body.amount_xpf || 0),
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    state.offers.set(id, { conv_id: conv.id, ...offer });
    const message = {
      id,
      conv_id: conv.id,
      sender_id: user.id,
      type: 'offer',
      content: null,
      offer,
      created_at: nowIso(),
    };
    conv.messages.push(message);
    conv.last_message = message;
    return json(res, 201, { data: { message, offer } });
  }

  const respondOfferMatch = pathname.match(/^\/api\/messages\/offers\/([^/]+)\/respond$/);
  if (respondOfferMatch && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const offer = state.offers.get(Number(respondOfferMatch[1]));
    if (!offer) return json(res, 404, { error: 'Offre introuvable.' });
    const body = await readJson(req);
    offer.status = body.response || 'accepted';
    offer.responded_at = nowIso();
    if (body.counter_amount) offer.counter_amount = Number(body.counter_amount);
    return json(res, 200, { data: { success: true, offer } });
  }

  if (pathname === '/api/payment/boost' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const listing = getListingById(body.annonce_id) || state.listings[0];
    const session_id = `sess_boost_${randomUUID()}`;
    const provider = body.provider || 'stripe';
    const result = {
      checkout_url: `/paiement/succes?session_id=${session_id}&type=boost&provider=${provider}`,
    };
    state.payments.unshift({
      id: ++state.counters.payments,
      user_id: user.id,
      provider,
      type: 'boost',
      status: 'pending',
      plan: null,
      amount: 2500,
      currency: 'XPF',
      provider_ref: session_id,
      listing_id: listing.id,
      created_at: nowIso(),
    });
    return json(res, 200, result);
  }

  if (pathname === '/api/payment/subscribe' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const session_id = `sess_sub_${randomUUID()}`;
    const provider = body.provider || 'stripe';
    user.is_pro = true;
    const result = {
      checkout_url: `/paiement/succes?session_id=${session_id}&type=subscription&provider=${provider}`,
    };
    state.payments.unshift({
      id: ++state.counters.payments,
      user_id: user.id,
      provider,
      type: 'subscription',
      status: 'pending',
      plan: body.plan_id || 'pro',
      amount: 9900,
      currency: 'XPF',
      provider_ref: session_id,
      created_at: nowIso(),
    });
    return json(res, 200, result);
  }

  if (pathname === '/api/payment/cancel' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    user.is_pro = false;
    return json(res, 200, { data: { cancelled: true } });
  }

  if (pathname === '/api/payment/my-subscription' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const active = state.payments.find((p) => String(p.user_id) === String(user.id) && p.type === 'subscription');
    return json(res, 200, {
      data: active ? {
        status: 'active',
        plan: active.plan || 'pro',
        provider: active.provider,
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end: null,
      } : null,
    });
  }

  if (pathname === '/api/payment/billing-documents' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    return json(res, 200, { data: state.billingDocs.filter((doc) => String(doc.user_id) === String(user.id)) });
  }

  if (pathname === '/api/payment/verify-session' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const sessionId = searchParams.get('session_id');
    const payment = state.payments.find((p) => p.provider_ref === sessionId);
    if (!payment) return json(res, 200, { status: 'invalid' });
    const status = payment.type === 'subscription' ? 'ok_subscription' : 'ok_boost';
    return json(res, 200, {
      status,
      plan: payment.plan || 'pro',
      boost_type: payment.type === 'boost' ? 'mise_en_avant' : undefined,
      boost_days: payment.type === 'boost' ? 7 : undefined,
      annonce_titre: payment.listing_id ? getListingById(payment.listing_id)?.title : undefined,
      annonce_id: payment.listing_id || null,
      period_end: payment.type === 'subscription' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      trial_end: null,
    });
  }

  if (pathname === '/api/payment/verify-payplug' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const id = searchParams.get('id');
    const payment = state.payments.find((p) => p.provider_ref === id);
    if (!payment) return json(res, 200, { status: 'invalid' });
    const status = payment.type === 'subscription' ? 'ok_subscription' : 'ok_boost';
    return json(res, 200, {
      status,
      plan: payment.plan || 'pro',
      boost_type: payment.type === 'boost' ? 'mise_en_avant' : undefined,
      boost_days: payment.type === 'boost' ? 7 : undefined,
      annonce_titre: payment.listing_id ? getListingById(payment.listing_id)?.title : undefined,
      annonce_id: payment.listing_id || null,
    });
  }

  if (pathname === '/api/rgpd/consentement' && req.method === 'POST') {
    const user = requireAuth(req, res);
    const body = await readJson(req);
    const entry = {
      id: state.consent.length + 1,
      user_id: user?.id || null,
      analytics: !!body.analytics,
      marketing: !!body.marketing,
      ip_address: req.socket.remoteAddress || '127.0.0.1',
      created_at: nowIso(),
    };
    state.consent.push(entry);
    return json(res, 201, { data: entry });
  }

  if (pathname === '/api/rgpd/exporter-donnees' && req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    return json(res, 200, {
      data: {
        user: publicUser(user),
        listings: state.listings.filter((item) => String(item.user.id) === String(user.id)),
        favorites: favoriteItemsForUser(user.id),
        notifications: state.notifications.filter((n) => String(n.user_id) === String(user.id)),
        messages: state.conversations.flatMap((conv) => conv.messages.filter((msg) => msg.sender_id === user.id)),
        payments: state.payments.filter((p) => String(p.user_id) === String(user.id)),
      },
    });
  }

  if (pathname === '/api/rgpd/supprimer-compte' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    user.email = `deleted-${user.id}@demo.troca`;
    user.first_name = 'Compte';
    user.last_name = 'Supprimé';
    user.is_verified = false;
    user.is_pro = false;
    user.updated_at = nowIso();
    return json(res, 200, { data: { deleted: true } });
  }

  if (pathname === '/api/bon-plans' && req.method === 'GET') {
    const items = state.listings.filter((item) => item.is_urgent || item.is_featured || item.category_slug === 'troc').slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      category_name: item.category_name,
      cover_image: item.cover_image,
      commune_name: item.commune_name,
      created_at: item.created_at,
      status: item.status,
    }));
    return json(res, 200, { data: items });
  }

  if (pathname === '/api/bon-plans' && req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readJson(req);
    const listing = {
      id: state.listings.length + 1000,
      title: body.title || body.description || 'Bon plan démo',
      description: body.description || '',
      price: body.price ? Number(body.price) : 0,
      prix: body.price ? Number(body.price) : 0,
      price_negotiable: true,
      is_free: Number(body.price || 0) === 0,
      condition: 'good',
      status: 'published',
      is_featured: true,
      is_urgent: true,
      nb_vues: 0,
      nb_favoris: 0,
      commune_id: Number(body.commune_id || 101),
      commune_name: communeLabel(body.commune_id || 101),
      commune_slug: slugify(communeLabel(body.commune_id || 101)),
      category_id: 9,
      category_name: 'Troc',
      category_slug: 'troc',
      category_icon: '⇄',
      published_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
      images: [],
      cover_image: null,
      user: publicUser(user),
    };
    state.listings.unshift(listing);
    return json(res, 201, { data: listing });
  }

  if (pathname === '/api/annonces/sitemap' && req.method === 'GET') {
    return json(res, 200, { data: state.listings.map((item) => ({ id: item.id, updated_at: item.updated_at })) });
  }

  if (pathname.startsWith('/api/admin/')) {
    const user = requireAdmin(req, res);
    if (!user) return;
    return json(res, 200, { data: { ok: true, path: pathname, admin: true } });
  }

  if (pathname === '/api/phone/send' || pathname === '/api/phone/verify' || pathname === '/api/auth/otp/resend') {
    return json(res, 200, { data: { ok: true, demo: true } });
  }

  if (pathname.startsWith('/api/')) {
    return json(res, 404, { error: `Route démo non implémentée: ${pathname}` });
  }

  return text(res, 200, 'Troca demo server');
}

const server = http.createServer((req, res) => {
  handleRoute(req, res).catch((err) => {
    console.error('[demo-server]', err);
    json(res, 500, { error: 'Erreur serveur démo.' });
  });
});

server.listen(PORT, () => {
  console.log(`[demo-server] Troca demo API listening on http://localhost:${PORT}`);
});
