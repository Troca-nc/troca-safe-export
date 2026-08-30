'use strict';

const cron = require('node-cron');
const { deliverNextTicketEmail } = require('../services/ticketEmailOutboxService');
const { logger } = require('../utils/logger');

function startTicketEmailOutboxJob() {
  let busy = false;
  return cron.schedule('* * * * *', async () => {
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
  }, { timezone: 'Pacific/Noumea' });
}
module.exports = { startTicketEmailOutboxJob };
