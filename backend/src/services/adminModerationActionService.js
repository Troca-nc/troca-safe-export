'use strict';

const { withTransaction } = require('../config/database');

const MODERATION_ACTIONS = new Set(['dismiss', 'remove_content', 'suspend_user']);

function actionError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizePositiveId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw actionError(400, `${label} invalide.`);
  }
  return id;
}

function normalizeModerationAction(value) {
  const action = String(value || '').trim().toLowerCase();
  if (!MODERATION_ACTIONS.has(action)) {
    throw actionError(400, 'Action de modération invalide.');
  }
  return action;
}

async function resolveReport(reportIdInput, actionInput, adminIdInput, transactionFn = withTransaction) {
  const reportId = normalizePositiveId(reportIdInput, 'Signalement');
  const adminId = normalizePositiveId(adminIdInput, 'Administrateur');
  const action = normalizeModerationAction(actionInput);

  return transactionFn(async (client) => {
    const reportResult = await client.query(
      `SELECT s.id, s.annonce_id, a.user_id AS content_owner_id
       FROM signalements s
       LEFT JOIN annonces a ON a.id = s.annonce_id
       WHERE s.id = $1
         AND s.resolved_at IS NULL
       FOR UPDATE OF s`,
      [reportId]
    );
    const report = reportResult.rows[0];
    if (!report) {
      throw actionError(404, 'Signalement introuvable ou déjà résolu.');
    }

    if (action === 'remove_content') {
      const removed = await client.query(
        `UPDATE annonces
         SET status = 'deleted',
             is_boosted = FALSE,
             boost_expires_at = NULL,
             updated_at = NOW()
         WHERE id = $1
           AND status <> 'deleted'
         RETURNING id`,
        [report.annonce_id]
      );
      if (!removed.rows[0]) {
        throw actionError(409, 'Le contenu est introuvable ou déjà supprimé.');
      }
    }

    if (action === 'suspend_user') {
      if (!report.content_owner_id) {
        throw actionError(409, 'Le propriétaire du contenu est introuvable.');
      }
      const suspended = await client.query(
        `UPDATE users
         SET banned_until = GREATEST(COALESCE(banned_until, NOW()), NOW() + INTERVAL '30 days'),
             updated_at = NOW()
         WHERE id = $1
           AND deleted_at IS NULL
           AND is_admin IS NOT TRUE
         RETURNING id, banned_until`,
        [report.content_owner_id]
      );
      if (!suspended.rows[0]) {
        throw actionError(409, 'Cet utilisateur ne peut pas être suspendu.');
      }
    }

    const resolution = await client.query(
      `UPDATE signalements
       SET resolved_at = NOW(),
           status = $2,
           action_taken = $3,
           resolved_by = $4
       WHERE id = $1
       RETURNING id, annonce_id, resolved_at, status, action_taken, resolved_by`,
      [reportId, action === 'dismiss' ? 'dismissed' : 'resolved', action, adminId]
    );

    await client.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, 'signalement', $3, $4)`,
      [adminId, `moderation_${action}`, String(reportId), JSON.stringify({
        action,
        annonce_id: report.annonce_id,
        content_owner_id: report.content_owner_id,
      })]
    );

    return {
      ...resolution.rows[0],
      content_owner_id: report.content_owner_id,
    };
  });
}

module.exports = {
  normalizeModerationAction,
  resolveReport,
};
