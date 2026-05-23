// backend/src/services/trustService.js
// ── Service anti-arnaque — Score de confiance + Détection prix suspects ───────

const { query } = require('../config/database')

// ════════════════════════════════════════════════════════════════════════════
// SCORE DE CONFIANCE VENDEUR
// ════════════════════════════════════════════════════════════════════════════
// Score de 0 à 100 calculé à partir de critères vérifiables.
// Affiché sur le profil et la fiche annonce.

const SCORE_WEIGHTS = {
  phone_verified:    25,  // téléphone vérifié via Twilio
  email_verified:    10,  // email confirmé
  account_age_30:    10,  // compte > 30 jours
  account_age_90:     5,  // bonus > 90 jours
  has_avatar:         5,  // photo de profil
  nb_annonces_5:      5,  // 5+ annonces publiées
  nb_annonces_20:     5,  // 20+ annonces publiées
  nb_avis_3:          5,  // 3+ avis reçus
  note_4:            10,  // note moyenne >= 4/5
  note_45:            5,  // note moyenne >= 4.5/5
  no_reports:        10,  // aucun signalement non résolu
  is_pro:             5,  // compte pro vérifié
}

/**
 * Calcule le score de confiance d'un vendeur (0-100)
 * @param {number} userId
 * @returns {{ score: number, level: string, details: object }}
 */
async function computeTrustScore(userId) {
  const { rows } = await query(`
    SELECT
      u.phone_verified,
      u.email_verified,
      u.avatar_url IS NOT NULL                              AS has_avatar,
      CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
      u.note_moyenne,
      u.nb_avis,
      u.nb_annonces,
      EXTRACT(DAY FROM NOW() - u.created_at)               AS account_age_days,
      -- Signalements non résolus contre ce vendeur
      (SELECT COUNT(*) FROM signalements s
       JOIN annonces a ON a.id = s.annonce_id
       WHERE a.user_id = u.id AND s.status = 'pending')    AS pending_reports
    FROM users u
    WHERE u.id = $1 AND u.deleted_at IS NULL
  `, [userId])

  if (!rows[0]) return { score: 0, level: 'inconnu', details: {} }
  const u = rows[0]

  const details = {
    phone_verified:   !!u.phone_verified,
    email_verified:   !!u.email_verified,
    account_age_30:   u.account_age_days >= 30,
    account_age_90:   u.account_age_days >= 90,
    has_avatar:       !!u.has_avatar,
    nb_annonces_5:    u.nb_annonces >= 5,
    nb_annonces_20:   u.nb_annonces >= 20,
    nb_avis_3:        u.nb_avis >= 3,
    note_4:           u.note_moyenne >= 4.0,
    note_45:          u.note_moyenne >= 4.5,
    no_reports:       u.pending_reports === 0 || u.pending_reports === '0',
    is_pro:           !!u.is_pro,
  }

  let score = 0
  for (const [key, val] of Object.entries(details)) {
    if (val) score += SCORE_WEIGHTS[key] ?? 0
  }

  const level =
    score >= 80 ? 'excellent' :
    score >= 60 ? 'bon'       :
    score >= 40 ? 'moyen'     : 'faible'

  return { score, level, details }
}

/**
 * Met à jour le score en cache dans la table users
 */
async function refreshTrustScore(userId) {
  const { score, level } = await computeTrustScore(userId)
  await query(
    `UPDATE users SET trust_score = $1, trust_level = $2, updated_at = NOW() WHERE id = $3`,
    [score, level, userId]
  ).catch(err => console.error('[trust] Erreur refresh score:', err.message))
  return { score, level }
}

// ════════════════════════════════════════════════════════════════════════════
// DÉTECTION PRIX ABERRANTS
// ════════════════════════════════════════════════════════════════════════════

// Prix plancher minimum par catégorie (en XPF)
// Trop bas = arnaque potentielle (appât)
const PRICE_FLOORS = {
  vehicules:    50_000,   // voiture à moins de 50k XPF = suspect
  immobilier:   500_000,  // logement à moins de 500k XPF = suspect
  'location-vacances': 20_000,
  electronique:  5_000,   // téléphone/ordi à moins de 5k XPF = suspect
  emploi:           0,    // pas de plancher (salaires variables)
  'maison-jardin':  500,
  famille:          0,
  mode:             100,
  loisirs:          500,
  'materiel-professionnel': 10_000,
  services:         0,
  troc:             0,
  divers:           0,
}

// Mots-clés d'arnaque fréquents dans les descriptions
const SCAM_KEYWORDS = [
  /western.?union/i, /moneygram/i, /paypal.?ami/i, /virement.?rapide/i,
  /livraison.?contre.?remboursement/i,
  /bit.?coin/i, /crypto/i,
  /je suis.{0,20}(à l'étranger|en déplacement|en voyage)/i,
  /contactez.?moi.?(sur|par|via).?(whatsapp|telegram|signal)/i,
  /0[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}/,  // téléphone FR dans description
  /www\./i, /http/i,  // liens dans la description
]

/**
 * Analyse une annonce pour détecter des signaux d'arnaque
 * @param {{ prix, category_slug, titre, description }} annonce
 * @returns {{ suspicious: boolean, flags: string[], score: number }}
 */
function detectPrixSuspect({ prix, category_slug, titre, description }) {
  const flags = []
  let suspicion = 0

  // 1. Prix trop bas par rapport au plancher catégorie
  const floor = PRICE_FLOORS[category_slug] ?? 0
  if (prix !== null && prix > 0 && floor > 0 && prix < floor) {
    flags.push(`prix_trop_bas:${prix}xpf<${floor}xpf`)
    suspicion += 40
  }

  // 2. Prix ronds suspects sur articles high-value (1000 XPF pile pour un iPhone)
  if (prix !== null && prix > 0 && prix <= 1000 && floor > 10_000) {
    flags.push('prix_appat')
    suspicion += 30
  }

  // 3. Mots-clés d'arnaque dans titre + description
  const text = `${titre} ${description}`.toLowerCase()
  for (const pattern of SCAM_KEYWORDS) {
    if (pattern.test(text)) {
      flags.push(`keyword:${pattern.source.slice(0, 30)}`)
      suspicion += 20
    }
  }

  // 4. Description trop courte pour un article cher
  if (description.length < 50 && prix > 100_000) {
    flags.push('description_courte_prix_eleve')
    suspicion += 15
  }

  // 5. Titre en majuscules (spam)
  const upperRatio = (titre.match(/[A-ZÀ-Ü]/g) || []).length / titre.length
  if (upperRatio > 0.6 && titre.length > 10) {
    flags.push('titre_majuscules')
    suspicion += 10
  }

  return {
    suspicious: suspicion >= 40,
    flags,
    score: Math.min(suspicion, 100),
  }
}

/**
 * Vérifie et flag une annonce après création/modification
 * Si suspecte → passe en status 'pending' + log admin
 */
async function checkAndFlagAnnonce(annonceId) {
  const { rows } = await query(`
    SELECT a.id, a.titre, a.description, a.prix, a.user_id,
           c.slug AS category_slug
    FROM annonces a
    JOIN categories c ON c.id = a.category_id
    WHERE a.id = $1
  `, [annonceId])

  if (!rows[0]) return

  const annonce = rows[0]
  const { suspicious, flags, score } = detectPrixSuspect(annonce)

  if (suspicious) {
    await query(`
      UPDATE annonces
      SET status = 'pending',
          moderation_flag = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [flags.join(','), annonceId])

    // Créer un signalement automatique pour l'admin
    await query(`
      INSERT INTO signalements (annonce_id, user_id, raison, description, status)
      VALUES ($1, NULL, 'arnaque', $2, 'pending')
    `, [
      annonceId,
      `[Auto] Score suspicion: ${score}/100 — Flags: ${flags.join(', ')}`
    ]).catch(() => {})

    console.warn(`[trust] Annonce ${annonceId} flaggée — score: ${score} — flags: ${flags.join(', ')}`)
  }

  return { suspicious, flags, score }
}

// ════════════════════════════════════════════════════════════════════════════
// RATE LIMIT CRÉATION D'ANNONCES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si l'utilisateur peut créer une nouvelle annonce
 * Limite : 5 annonces par jour pour les nouveaux comptes (<30j), 20 pour les autres
 */
async function checkAnnonceRateLimit(userId) {
  const { rows: [user] } = await query(`
    SELECT
      EXTRACT(DAY FROM NOW() - created_at) AS account_age_days,
      phone_verified, is_pro
    FROM users WHERE id = $1
  `, [userId])

  const limit = user.is_pro ? 50 :
                user.account_age_days < 7 ? 3 :
                user.account_age_days < 30 ? 5 : 20

  const { rows: [count] } = await query(`
    SELECT COUNT(*) AS nb
    FROM annonces
    WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
  `, [userId])

  const current = parseInt(count.nb, 10)
  const allowed = current < limit

  return {
    allowed,
    current,
    limit,
    message: allowed ? null :
      `Limite atteinte : ${limit} annonce(s) par jour. Revenez demain ou vérifiez votre téléphone pour augmenter la limite.`
  }
}

module.exports = {
  computeTrustScore,
  refreshTrustScore,
  detectPrixSuspect,
  checkAndFlagAnnonce,
  checkAnnonceRateLimit,
}
