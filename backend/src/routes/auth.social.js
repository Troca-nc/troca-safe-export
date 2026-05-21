// backend/src/routes/auth.social.js
// ── Routes OAuth — Google & Apple ────────────────────────────────────────────
// npm i google-auth-library apple-signin-auth jsonwebtoken

const express       = require('express')
const { OAuth2Client } = require('google-auth-library')
const appleSignin   = require('apple-signin-auth')
const { query }     = require('../config/database')
const { isConfiguredValue } = require('../config/env')
const { signAccessToken, signRefreshToken } = require('../config/jwt')
const { socialAuthLimiter } = require('../middleware/rateLimit')
const { logger } = require('../utils/logger')

const router       = express.Router()
const googleClientId = isConfiguredValue(process.env.GOOGLE_CLIENT_ID) ? process.env.GOOGLE_CLIENT_ID.trim() : ''
const appleClientId = isConfiguredValue(process.env.APPLE_CLIENT_ID) ? process.env.APPLE_CLIENT_ID.trim() : ''
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null

// ── Utilitaire : upsert utilisateur social ────────────────────────────────────

async function upsertSocialUser({ email, prenom, nom, avatar_url, provider, provider_id }) {
  // 1. Chercher par provider_id (le plus fiable)
  const byProvider = await query(
    `SELECT id, email, prenom, nom, is_admin, is_pro, email_verified
     FROM users WHERE ${provider}_id = $1 AND deleted_at IS NULL`,
    [provider_id]
  )
  if (byProvider.rows[0]) return byProvider.rows[0]

  // 2. Chercher par email (compte déjà existant sans social)
  const byEmail = await query(
    `SELECT id, email, prenom, nom, is_admin, is_pro, email_verified
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  )

  if (byEmail.rows[0]) {
    // Lier le compte social à l'existant
    await query(
      `UPDATE users SET ${provider}_id = $1, avatar_url = COALESCE(avatar_url, $2),
       updated_at = NOW() WHERE id = $3`,
      [provider_id, avatar_url, byEmail.rows[0].id]
    )
    return byEmail.rows[0]
  }

  // 3. Créer un nouveau compte
  const result = await query(
    `INSERT INTO users (email, prenom, nom, avatar_url, ${provider}_id,
       phone_verified, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, false, true, NOW(), NOW())
     RETURNING id, email, prenom, nom, is_admin, is_pro, email_verified`,
    [email, prenom, nom, avatar_url, provider_id]
  )
  return result.rows[0]
}

// ── Réponse auth commune ──────────────────────────────────────────────────────

function buildAuthResponse(user) {
  const access_token  = signAccessToken({ sub: user.id, email: user.email })
  const refresh_token = signRefreshToken({ sub: user.id })

  return {
    access_token,
    refresh_token,
    user: {
      id:         user.id,
      email:      user.email,
      first_name: user.prenom,
      last_name:  user.nom,
      is_admin:   user.is_admin,
      is_pro:     user.is_pro,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url ?? null,
    },
  }
}

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Body : { id_token: string }  (token renvoyé par Google Sign-In SDK)

router.post('/google', socialAuthLimiter, async (req, res) => {
  const { id_token } = req.body
  if (!id_token) return res.status(400).json({ error: 'id_token requis' })
  if (!googleClient) return res.status(503).json({ error: 'Connexion Google non configurée' })

  try {
    // Vérifier le token Google
    const ticket  = await googleClient.verifyIdToken({
      idToken:  id_token,
      audience: googleClientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.email_verified) {
      return res.status(401).json({ error: 'Email Google non vérifié' })
    }

    const user = await upsertSocialUser({
      email:       payload.email,
      prenom:      payload.given_name  || payload.name?.split(' ')[0] || 'Utilisateur',
      nom:         payload.family_name || payload.name?.split(' ')[1] || '',
      avatar_url:  payload.picture ?? null,
      provider:    'google',
      provider_id: payload.sub,
    })

    res.json({ data: buildAuthResponse(user) })
  } catch (err) {
    logger.error('auth_google_error', { error: err })
    res.status(401).json({ error: 'Token Google invalide ou expiré' })
  }
})

// ── POST /api/auth/apple ──────────────────────────────────────────────────────
// Body : { id_token, user?: { firstName, lastName } }
// Apple ne renvoie le nom qu'à la première connexion — on le stocke côté client

router.post('/apple', socialAuthLimiter, async (req, res) => {
  const { id_token, user: appleUser } = req.body
  if (!id_token) return res.status(400).json({ error: 'id_token requis' })
  if (!appleClientId) return res.status(503).json({ error: 'Connexion Apple non configurée' })

  try {
    const payload = await appleSignin.verifyIdToken(id_token, {
      audience:        appleClientId,
      ignoreExpiration: false,
    })

    if (!payload.email) {
      return res.status(401).json({ error: 'Email Apple manquant' })
    }

    const user = await upsertSocialUser({
      email:       payload.email,
      prenom:      appleUser?.firstName || 'Utilisateur',
      nom:         appleUser?.lastName  || '',
      avatar_url:  null,   // Apple ne fournit pas de photo
      provider:    'apple',
      provider_id: payload.sub,
    })

    res.json({ data: buildAuthResponse(user) })
  } catch (err) {
    logger.error('auth_apple_error', { error: err })
    res.status(401).json({ error: 'Token Apple invalide ou expiré' })
  }
})

module.exports = router

// ── Colonnes à ajouter en DB ──────────────────────────────────────────────────
// ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
// ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id  VARCHAR(255) UNIQUE;
// CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;
// CREATE INDEX IF NOT EXISTS idx_users_apple_id  ON users (apple_id)  WHERE apple_id  IS NOT NULL;
