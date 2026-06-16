'use strict';

const cron = require('node-cron');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const { recordJob } = require('../services/observability');

async function expireEventTicketReservations() {
  const { rows } = await query(
    `SELECT id, event_id
       FROM ticket_orders
      WHERE status = 'reserved'
        AND expires_at < NOW()
      ORDER BY expires_at ASC
      LIMIT 100`
  );

  for (const order of rows) {
    const ticketsRows = await query(
      `SELECT ticket_type_id, COUNT(*)::int AS count
         FROM tickets
        WHERE order_id = $1
        GROUP BY ticket_type_id`,
      [order.id]
    );

    for (const row of ticketsRows.rows) {
      await query(
        `UPDATE ticket_types
            SET quantity_reserved = GREATEST(quantity_reserved - $2, 0),
                updated_at = NOW()
          WHERE id = $1`,
        [row.ticket_type_id, Number(row.count || 0)]
      );
    }

    await query(`UPDATE tickets SET status = 'cancelled' WHERE order_id = $1`, [order.id]);
    await query(
      `UPDATE ticket_orders
          SET status = 'expired',
              cancelled_at = NOW(),
              cancellation_reason = 'reservation_expired',
              updated_at = NOW()
        WHERE id = $1`,
      [order.id]
    );
  }

  return { expired: rows.length };
}

function startTicketExpiryJob() {
  cron.schedule('*/2 * * * *', async () => {
    recordJob('started', { job: 'event-ticket-expiry' });
    try {
      const result = await expireEventTicketReservations();
      logger.info('cron_event_ticket_expired', result);
    } catch (err) {
      recordJob('error', { job: 'event-ticket-expiry', message: err.message });
      logger.error('cron_event_ticket_expiry_error', { error: err });
    }
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'event-ticket-expiry' });
}

module.exports = {
  expireEventTicketReservations,
  startTicketExpiryJob,
};
