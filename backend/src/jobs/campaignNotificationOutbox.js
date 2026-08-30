'use strict';
const cron = require('node-cron');
const { deliverNextCampaignNotification } = require('../services/campaignNotificationOutboxService');
const { deliverCampaignNotification } = require('../services/campaignsService');
const { logger } = require('../utils/logger');

function startCampaignNotificationOutboxJob() {
  let busy = false;
  return cron.schedule('* * * * *', async () => {
    if (busy) return;
    busy = true;
    try {
      for (let i = 0; i < 5; i++) {
        const result = await deliverNextCampaignNotification(deliverCampaignNotification);
        if (!result) break;
        if (result.status === 'dead') logger.error('campaign_notification_outbox_dead', result);
        else logger.info('campaign_notification_outbox_result', result);
      }
    } catch {
      logger.error('campaign_notification_outbox_processing_failed');
    } finally { busy = false; }
  }, { timezone: 'Pacific/Noumea' });
}
module.exports = { startCampaignNotificationOutboxJob };
