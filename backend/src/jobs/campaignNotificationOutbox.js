'use strict';
const { scheduleTracked } = require('../services/jobRuntime');
const { BUSINESS_TIME_ZONE } = require('../config/timePolicy');
const { deliverNextCampaignNotification } = require('../services/campaignNotificationOutboxService');
const { deliverCampaignNotification } = require('../services/campaignsService');
const { logger } = require('../utils/logger');

function startCampaignNotificationOutboxJob() {
  let busy = false;
  return scheduleTracked('* * * * *', async () => {
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
  }, { timezone: BUSINESS_TIME_ZONE });
}
module.exports = { startCampaignNotificationOutboxJob };
