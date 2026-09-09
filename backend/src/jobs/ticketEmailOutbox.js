'use strict';

const { scheduleTracked } = require('../services/jobRuntime');
const { BUSINESS_TIME_ZONE } = require('../config/timePolicy');
const { deliverNextTicketEmail } = require('../services/ticketEmailOutboxService');
const { logger } = require('../utils/logger');

function startTicketEmailOutboxJob() {
  let busy = false;
  return scheduleTracked('* * * * *', async () => {
    if (busy) return;
    busy = true;
    try {
      for (let i = 0; i < 5; i++) {
        const result = await deliverNextTicketEmail();
        if (!result) break;
        if (result.status === 'dead') logger.error('ticket_email_outbox_dead', result);
        else logger.info('ticket_email_outbox_result', result);
      }
    } catch {
      logger.error('ticket_email_outbox_processing_failed');
    } finally {
      busy = false;
    }
  }, { timezone: BUSINESS_TIME_ZONE });
}
module.exports = { startTicketEmailOutboxJob };
