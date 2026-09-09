'use strict';

const TRANSITIONS = Object.freeze({
  confirmed: { from: ['pending'], timestamp: 'confirmed_at' },
  declined: { from: ['pending'], timestamp: 'declined_at' },
  cancelled: { from: ['pending', 'confirmed'], timestamp: 'cancelled_at' },
  completed: { from: ['confirmed'], timestamp: 'completed_at' },
});

async function transitionProBooking(client, bookingId, nextStatus) {
  const transition = TRANSITIONS[nextStatus];
  if (!transition) throw new TypeError(`Transition de réservation inconnue: ${nextStatus}`);

  const result = await client.query(
    `UPDATE pro_bookings
     SET status = $2,
         ${transition.timestamp} = NOW(),
         updated_at = NOW()
     WHERE id = $1
       AND status = ANY($3::text[])
     RETURNING *`,
    [bookingId, nextStatus, transition.from]
  );

  if (!result.rows[0]) {
    throw Object.assign(new Error('Cette réservation a déjà changé d’état.'), { statusCode: 409 });
  }
  return result.rows[0];
}

module.exports = { TRANSITIONS, transitionProBooking };
