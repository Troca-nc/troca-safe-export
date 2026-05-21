// backend/src/middleware/antiScam.js
// ── Middleware anti-arnaque — à brancher sur POST /api/annonces ───────────────
// Vérifie : rate limit création, prix suspect, mots-clés arnaque
// Usage : router.post('/annonces', authenticate, antiScam, createAnnonce)

const { checkAnnonceRateLimit, checkAndFlagAnnonce } = require('../services/trustService')

/**
 * Middleware 1 : Rate limit création d'annonces (avant insertion en DB)
 */
async function rateLimitAnnonces(req, res, next) {
  try {
    const { allowed, limit, current, message } = await checkAnnonceRateLimit(req.user.id)

    // Headers informatifs
    res.setHeader('X-RateLimit-Annonces-Limit',     limit)
    res.setHeader('X-RateLimit-Annonces-Remaining', Math.max(0, limit - current))

    if (!allowed) {
      return res.status(429).json({ error: message })
    }
    next()
  } catch (err) {
    // Non bloquant si le service est indisponible
    console.error('[antiScam] Erreur rate limit:', err.message)
    next()
  }
}

/**
 * Middleware 2 : Analyse post-création (après insertion en DB)
 * À appeler après avoir récupéré l'ID de l'annonce insérée
 * Usage : await flagIfSuspicious(annonceId)
 */
async function flagIfSuspicious(annonceId) {
  try {
    const result = await checkAndFlagAnnonce(annonceId)
    if (result?.suspicious) {
      console.warn(`[antiScam] Annonce ${annonceId} mise en révision — score: ${result.score}`)
    }
    return result
  } catch (err) {
    console.error('[antiScam] Erreur vérification:', err.message)
    return null
  }
}

/**
 * Middleware 3 : Vérification du score de confiance avant contact
 * Bloque si le vendeur a trop de signalements non résolus
 */
async function checkSellerTrust(req, res, next) {
  const { query } = require('../config/database')
  const sellerId = req.body.seller_id || req.params.seller_id

  if (!sellerId) return next()

  try {
    const { rows: [seller] } = await query(`
      SELECT trust_score, trust_level,
             (SELECT COUNT(*) FROM signalements s
              JOIN annonces a ON a.id = s.annonce_id
              WHERE a.user_id = $1 AND s.status = 'pending') AS pending_reports
      FROM users WHERE id = $1 AND deleted_at IS NULL
    `, [sellerId])

    if (!seller) return res.status(404).json({ error: 'Vendeur introuvable' })

    // Bloquer si trop de signalements actifs (> 3 non résolus)
    if (parseInt(seller.pending_reports) > 3) {
      return res.status(403).json({
        error: 'Ce vendeur est temporairement suspendu suite à des signalements en cours.',
      })
    }

    // Attacher les infos de trust à la requête pour usage downstream
    req.sellerTrust = { score: seller.trust_score, level: seller.trust_level }
    next()
  } catch (err) {
    console.error('[antiScam] Erreur check trust:', err.message)
    next()
  }
}

module.exports = { rateLimitAnnonces, flagIfSuspicious, checkSellerTrust }
