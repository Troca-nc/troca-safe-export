'use strict';

const { withTransaction } = require('../config/database');
const { sendTicketEmail } = require('./emailService');
const MAX_ATTEMPTS = 5;

async function enqueueTicketEmail(client, orderId) {
  if (!client || typeof client.query !== 'function' || !Number.isSafeInteger(Number(orderId)) || Number(orderId) <= 0) {
    throw new TypeError('A transaction client and positive order id are required');
  }
  await client.query(
    `INSERT INTO ticket_email_outbox (order_id) VALUES ($1)
     ON CONFLICT (order_id) DO NOTHING`, [orderId]
  );
}

async function deliverNextTicketEmail() {
  // This transaction locks ONLY the outbox row, after payment has committed.
  // Holding the lock through SMTP avoids concurrent sends without an expiring
  // lease. A crash after SMTP acceptance but before COMMIT can still duplicate
  // an email: this is retryable delivery, not exactly-once SMTP delivery.
  return withTransaction(async client => {
    const { rows } = await client.query(
      `SELECT id, order_id, attempts FROM ticket_email_outbox
       WHERE status = 'pending' AND available_at <= NOW()
       ORDER BY available_at, id LIMIT 1 FOR UPDATE SKIP LOCKED`
    );
    const item = rows[0];
    if (!item) return null;
    const { rows: orders } = await client.query(
      `SELECT o.*, e.title AS event_title FROM ticket_orders o
       JOIN events e ON e.id = o.event_id WHERE o.id = $1`, [item.order_id]
    );
    const order = orders[0];
    const { rows: tickets } = await client.query(
      `SELECT t.*, tt.name AS ticket_type_name FROM tickets t
       JOIN ticket_types tt ON tt.id = t.ticket_type_id
       WHERE t.order_id = $1 AND t.status IN ('active', 'used') ORDER BY t.id`, [item.order_id]
    );
    if (!order || order.status !== 'paid' || !tickets.length) {
      await client.query(
        `UPDATE ticket_email_outbox SET status = 'cancelled', last_error_code = 'ORDER_NOT_DELIVERABLE' WHERE id = $1`, [item.id]
      );
      return { id: item.id, status: 'cancelled' };
    }

    let errorCode = null;
    try {
      if (!order.buyer_email) errorCode = 'RECIPIENT_MISSING';
      else {
        const result = await sendTicketEmail(order, tickets);
        if (result?.simulated || !Array.isArray(result?.accepted) || result.accepted.length === 0) {
          errorCode = 'SMTP_NOT_ACCEPTED';
        }
      }
    } catch {
      // Never persist SMTP response text, email addresses or ticket tokens.
      errorCode = 'SMTP_SEND_FAILED';
    }
    const attempts = Number(item.attempts) + 1;
    if (errorCode) {
      const status = attempts >= MAX_ATTEMPTS ? 'dead' : 'pending';
      const delaySeconds = Math.min(3600, 60 * (2 ** (attempts - 1)));
      await client.query(
        `UPDATE ticket_email_outbox SET status = $2, attempts = $3,
         available_at = NOW() + $4 * INTERVAL '1 second', last_error_code = $5 WHERE id = $1`,
        [item.id, status, attempts, delaySeconds, errorCode]
      );
      return { id: item.id, status, errorCode };
    }
    await client.query(
      `UPDATE ticket_email_outbox SET status = 'sent', attempts = $2,
       sent_at = NOW(), last_error_code = NULL WHERE id = $1`, [item.id, attempts]
    );
    return { id: item.id, status: 'sent' };
  });
}

module.exports = { enqueueTicketEmail, deliverNextTicketEmail };
