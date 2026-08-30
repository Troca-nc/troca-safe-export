'use strict';
const { withTransaction } = require('../config/database');

async function enqueueCampaignNotifications(client, paymentId, campaignId, userId, status) {
  if (!client || typeof client.query !== 'function'
      || ![paymentId, campaignId, userId].every(id => Number.isSafeInteger(Number(id)) && Number(id) > 0)
      || !['active', 'queued'].includes(status)) throw new Error('Invalid campaign outbox input');
  await client.query(
    `INSERT INTO campaign_notification_outbox (payment_id, campaign_id, user_id, channel, target_id, expected_status)
     SELECT $1, $2, $3, channel, 0, $4 FROM unnest(ARRAY['in_app', 'email', 'sms']) AS channel
     ON CONFLICT (payment_id, channel, target_id) DO NOTHING`, [paymentId, campaignId, userId, status]
  );
  // One item per device: a failed device never retries an already accepted one.
  // Only IDs are stored, never push tokens or recipient addresses.
  await client.query(
    `INSERT INTO campaign_notification_outbox (payment_id, campaign_id, user_id, channel, target_id, expected_status)
     SELECT $1, $2, $3, 'push', id, $4 FROM push_tokens WHERE user_id = $3
     ON CONFLICT (payment_id, channel, target_id) DO NOTHING`, [paymentId, campaignId, userId, status]
  );
}

async function deliverNextCampaignNotification(deliver) {
  if (typeof deliver !== 'function') throw new Error('Campaign delivery adapter required');
  // Separate from payment. Lock held through external call; crash after provider
  // acceptance before COMMIT can still cause redelivery, not exactly-once delivery.
  return withTransaction(async client => {
    const { rows } = await client.query(
      `SELECT * FROM campaign_notification_outbox WHERE status = 'pending' AND available_at <= NOW()
       ORDER BY available_at, id LIMIT 1 FOR UPDATE SKIP LOCKED`
    );
    const item = rows[0];
    if (!item) return null;
    const { rows: targets } = await client.query(
      `SELECT c.*, u.email, u.telephone, u.prenom, u.nom, p.status AS payment_status,
        p.provider, p.provider_ref, p.user_id AS payment_user_id,
        (c.ends_at IS NULL OR c.ends_at > NOW()) AS not_expired
       FROM campaigns c JOIN users u ON u.id = c.user_id
       JOIN payments p ON p.id = $2 WHERE c.id = $1`, [item.campaign_id, item.payment_id]
    );
    const campaign = targets[0];
    if (!campaign || campaign.payment_status !== 'succeeded' || campaign.status !== item.expected_status
        || !campaign.not_expired || Number(campaign.user_id) !== Number(item.user_id)
        || Number(campaign.payment_user_id) !== Number(item.user_id)
        || campaign.metadata?.payment_ref !== campaign.provider_ref
        || campaign.metadata?.payment_provider !== campaign.provider) {
      await client.query("UPDATE campaign_notification_outbox SET status = 'cancelled', last_error_code = 'STATE_CHANGED' WHERE id = $1", [item.id]);
      return { id: item.id, status: 'cancelled' };
    }
    let result;
    if (item.channel === 'in_app') {
      // SQL errors must escape; never try to commit a failed transaction.
      result = await deliver(item, campaign, client);
    } else {
      try { result = await deliver(item, campaign, client); }
      catch { result = { status: 'retry' }; }
    }
    const attempts = Number(item.attempts) + 1;
    if (result?.status === 'sent' || result?.status === 'skipped') {
      await client.query(
        `UPDATE campaign_notification_outbox SET status = $2, attempts = $3,
         sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE NULL END,
         last_error_code = CASE WHEN $2 = 'skipped' THEN 'CHANNEL_UNAVAILABLE' ELSE NULL END WHERE id = $1`,
        [item.id, result.status, attempts]
      );
      return { id: item.id, status: result.status };
    }
    const status = attempts >= 5 ? 'dead' : 'pending';
    await client.query(
      `UPDATE campaign_notification_outbox SET status = $2, attempts = $3,
       available_at = NOW() + $4 * INTERVAL '1 second', last_error_code = 'CHANNEL_NOT_ACCEPTED' WHERE id = $1`,
      [item.id, status, attempts, Math.min(3600, 60 * (2 ** (attempts - 1)))]
    );
    return { id: item.id, status };
  });
}
module.exports = { enqueueCampaignNotifications, deliverNextCampaignNotification };
