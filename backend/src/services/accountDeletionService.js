'use strict';

const { withTransaction } = require('../config/database');

async function anonymizeAccount(userId, transaction = withTransaction) {
  return transaction(async (client) => {
    const current = await client.query(
      `SELECT id, email, prenom
       FROM users
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [userId],
    );
    const user = current.rows[0];
    if (!user) return null;

    await client.query(
      `UPDATE annonces
       SET deleted_at = COALESCE(deleted_at, NOW()), updated_at = NOW()
       WHERE user_id = $1`,
      [userId],
    );
    await client.query(
      `UPDATE messages
       SET sender_id = NULL,
           content = '[Message supprimé]',
           photo_url = NULL,
           attachment_url = NULL,
           attachment_name = NULL,
           attachment_mime_type = NULL,
           attachment_size_bytes = NULL
       WHERE sender_id = $1`,
      [userId],
    );

    for (const table of [
      'refresh_tokens',
      'password_reset_tokens',
      'email_verification_tokens',
      'push_tokens',
      'search_alerts',
      'notification_preferences',
      'notifications',
      'favoris',
    ]) {
      await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    }

    await client.query(
      `UPDATE users
       SET email = 'deleted+' || id || '@invalid.kalico.nc',
           password_hash = NULL,
           prenom = 'Compte',
           nom = 'supprimé',
           telephone = NULL,
           telephone_verifie = FALSE,
           telephone_verifie_at = NULL,
           phone_verified = FALSE,
           email_verified = FALSE,
           avatar_url = NULL,
           commune_id = NULL,
           bio = NULL,
           google_id = NULL,
           apple_id = NULL,
           is_admin = FALSE,
           is_pro = FALSE,
           pro_plan = NULL,
           pro_expires_at = NULL,
           pro_verified = FALSE,
           pro_verified_at = NULL,
           pro_company_name = NULL,
           pro_category = NULL,
           pro_description = NULL,
           pro_logo_url = NULL,
           pro_banner_url = NULL,
           pro_website = NULL,
           pro_phone = NULL,
           pro_hours = NULL,
           pro_commune = NULL,
           pro_siret = NULL,
           pro_referral_code = NULL,
           pro_quote_template = '{}'::jsonb,
           pro_portfolio_photos = '[]'::jsonb,
           stripe_customer_id = NULL,
           payplug_customer_id = NULL,
           banned_until = NULL,
           deleted_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );

    return user;
  });
}

module.exports = { anonymizeAccount };
