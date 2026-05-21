// backend/src/routes/rgpd.route.js
// ── Routes RGPD — Droits des utilisateurs ────────────────────────────────────
// Art. 17 : droit à l'effacement (suppression compte)
// Art. 20 : droit à la portabilité (export données)
// Art. 15 : droit d'accès (log des accès aux données)

const express   = require('express')
const { query, withTransaction } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const archiver  = require('archiver')   // npm i archiver

const router = express.Router()
router.use(authenticate)

// ── POST /api/rgpd/supprimer-compte ──────────────────────────────────────────
// Art. 17 — Droit à l'effacement
// Soft delete + anonymisation des données personnelles sous 30 jours

router.post('/supprimer-compte', async (req, res) => {
  const { confirmation, password } = req.body
  const userId = req.user.id

  if (confirmation !== 'SUPPRIMER MON COMPTE') {
    return res.status(400).json({
      error: 'Confirmation incorrecte. Tapez exactement : SUPPRIMER MON COMPTE'
    })
  }

  try {
    await withTransaction(async (client) => {

      // 1. Vérifier le mot de passe si compte email (pas social)
      if (password) {
        const userRes = await client.query(
          `SELECT password_hash FROM users WHERE id = $1`, [userId]
        )
const bcrypt = require('bcryptjs')
        const valid = await bcrypt.compare(password, userRes.rows[0]?.password_hash ?? '')
        if (!valid) throw new Error('Mot de passe incorrect')
      }

      // 2. Anonymiser toutes les données personnelles (RGPD : pseudonymisation)
      await client.query(`
        UPDATE users SET
          email          = 'deleted_' || id || '@troca.supprime',
          password_hash  = NULL,
          prenom         = 'Utilisateur',
          nom            = 'Supprimé',
          telephone      = NULL,
          phone_verified = FALSE,
          avatar_url     = NULL,
          bio            = NULL,
          google_id      = NULL,
          apple_id       = NULL,
          stripe_customer_id = NULL,
          commune_id     = NULL,
          deleted_at     = NOW(),
          updated_at     = NOW()
        WHERE id = $1`, [userId]
      )

      // 3. Dépublier toutes les annonces actives
      await client.query(`
        UPDATE annonces SET status = 'deleted', updated_at = NOW()
        WHERE user_id = $1 AND status NOT IN ('deleted', 'sold')`, [userId]
      )

      // 4. Supprimer les tokens push (ne plus notifier)
      await client.query(`DELETE FROM push_tokens WHERE user_id = $1`, [userId])

      // 5. Supprimer les alertes de recherche
      await client.query(`DELETE FROM search_alerts WHERE user_id = $1`, [userId])

      // 5bis. Supprimer les événements analytics first-party associés
      await client.query(`DELETE FROM analytics_events WHERE user_id = $1`, [userId])

      // 6. Archiver les messages (garder pour l'autre partie, anonymiser l'expéditeur)
      await client.query(`
        UPDATE messages SET content = '[Message supprimé]', photo_url = NULL
        WHERE sender_id = $1 AND created_at > NOW() - INTERVAL '30 days'`, [userId]
      )

      // 7. Logger la suppression pour la traçabilité
      await client.query(`
        INSERT INTO rgpd_logs (user_id, action, ip_address, created_at)
        VALUES ($1, 'account_deleted', $2, NOW())`,
        [userId, req.ip]
      )
    })

    res.json({
      success: true,
      message: 'Votre compte a été supprimé. Vos données personnelles seront effacées définitivement sous 30 jours.'
    })

  } catch (err) {
    if (err.message === 'Mot de passe incorrect')
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    console.error('[rgpd] Erreur suppression:', err)
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' })
  }
})

// ── GET /api/rgpd/exporter-donnees ───────────────────────────────────────────
// Art. 20 — Droit à la portabilité
// Génère un ZIP contenant toutes les données de l'utilisateur

router.get('/exporter-donnees', async (req, res) => {
  const userId = req.user.id

  try {
    // Collecter toutes les données
    const [userRes, annoncesRes, messagesRes, favorisRes, paymentsRes, alertsRes] =
      await Promise.all([
        query(`SELECT id, email, prenom, nom, telephone, bio, commune_id,
                      is_pro, created_at, updated_at
               FROM users WHERE id = $1`, [userId]),
        query(`SELECT id, titre, description, prix, status, created_at, published_at
               FROM annonces WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
        query(`SELECT m.content, m.type, m.created_at,
                      CASE WHEN m.sender_id = $1 THEN 'envoyé' ELSE 'reçu' END as direction
               FROM messages m
               JOIN conversations c ON c.id = m.conv_id
               WHERE c.buyer_id = $1 OR c.seller_id = $1
               ORDER BY m.created_at DESC LIMIT 1000`, [userId]),
        query(`SELECT a.titre, a.prix, f.created_at as saved_at
               FROM favoris f JOIN annonces a ON a.id = f.annonce_id
               WHERE f.user_id = $1`, [userId]),
        query(`SELECT type, provider, amount_xpf, status, created_at
               FROM payments WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
        query(`SELECT label, filters, created_at
               FROM search_alerts WHERE user_id = $1`, [userId]),
      ])

    const exportData = {
      export_date:  new Date().toISOString(),
      export_for:   `Troca — Export RGPD Art. 20`,
      profil:       userRes.rows[0],
      annonces:     annoncesRes.rows,
      messages:     messagesRes.rows,
      favoris:      favorisRes.rows,
      paiements:    paymentsRes.rows,
      alertes:      alertsRes.rows,
    }

    // Logger l'export
    await query(
      `INSERT INTO rgpd_logs (user_id, action, ip_address, created_at)
       VALUES ($1, 'data_exported', $2, NOW())`,
      [userId, req.ip]
    )

    // Envoyer en ZIP avec un JSON lisible
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="troca-donnees-${userId}-${Date.now()}.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    // Fichier JSON principal
    archive.append(JSON.stringify(exportData, null, 2), { name: 'mes-donnees.json' })

    // README lisible
    archive.append(`# Export de vos données Troca

Date d'export : ${new Date().toLocaleDateString('fr-FR')}

## Contenu de cet export

- **mes-donnees.json** : toutes vos données au format JSON
  - profil : vos informations personnelles
  - annonces : vos ${exportData.annonces.length} annonce(s)
  - messages : vos ${exportData.messages.length} message(s)
  - favoris : vos ${exportData.favoris.length} favori(s) sauvegardés
  - paiements : votre historique de paiements
  - alertes : vos alertes de recherche

## Vos droits

Conformément au RGPD, vous pouvez :
- Demander la correction de vos données : privacy@troca.nc
- Demander la suppression de votre compte : depuis Paramètres > Mon compte
- Contacter notre DPO : dpo@troca.nc

## Contact

Troca — privacy@troca.nc
`, { name: 'README.txt' })

    archive.finalize()

  } catch (err) {
    console.error('[rgpd] Erreur export:', err)
    res.status(500).json({ error: 'Erreur lors de la génération de l\'export' })
  }
})

// ── GET /api/rgpd/mes-logs ────────────────────────────────────────────────────
// Art. 15 — Droit d'accès : historique des traitements de données

router.get('/mes-logs', async (req, res) => {
  const { rows } = await query(
    `SELECT action, ip_address, created_at
     FROM rgpd_logs WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  )
  res.json({ data: rows })
})

// ── POST /api/rgpd/consentement ───────────────────────────────────────────────
// Enregistrement du consentement cookies

router.post('/consentement', async (req, res) => {
  const { analytics, marketing } = req.body
  await query(
    `INSERT INTO rgpd_consentements (user_id, analytics, marketing, ip_address, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET analytics = $2, marketing = $3, ip_address = $4, created_at = NOW()`,
    [req.user?.id ?? null, !!analytics, !!marketing, req.ip]
  ).catch(() => {})
  res.json({ success: true })
})

module.exports = router
