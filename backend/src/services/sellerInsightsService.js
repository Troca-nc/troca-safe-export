'use strict';

function formatAverageResponseTime(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return null;

  const rounded = Math.max(1, Math.round(value));
  if (rounded < 60) {
    return `${rounded} min`;
  }

  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  if (!remaining) {
    return `${hours} h`;
  }
  return `${hours} h ${remaining.toString().padStart(2, '0')}`;
}

async function getSellerResponseTime(query, sellerId) {
  const userId = Number(sellerId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return {
      avg_response_time_minutes: null,
      avg_response_time_label: null,
    };
  }

  const result = await query(
    `
      WITH seller_conversations AS (
        SELECT c.id, c.buyer_id, c.seller_id
        FROM conversations c
        WHERE c.seller_id = $1
      ),
      first_replies AS (
        SELECT
          sc.id,
          first_msg.buyer_first_at,
          reply.seller_reply_at
        FROM seller_conversations sc
        JOIN LATERAL (
          SELECT MIN(m.created_at) AS buyer_first_at
          FROM messages m
          WHERE m.conv_id = sc.id
            AND m.sender_id = sc.buyer_id
        ) first_msg ON TRUE
        LEFT JOIN LATERAL (
          SELECT MIN(m.created_at) AS seller_reply_at
          FROM messages m
          WHERE m.conv_id = sc.id
            AND m.sender_id = sc.seller_id
            AND m.created_at > first_msg.buyer_first_at
        ) reply ON TRUE
      )
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (seller_reply_at - buyer_first_at)) / 60.0), 0)::int AS avg_response_time_minutes
      FROM first_replies
      WHERE buyer_first_at IS NOT NULL
        AND seller_reply_at IS NOT NULL
    `,
    [userId]
  );

  const avgMinutes = result.rows[0]?.avg_response_time_minutes ?? null;
  return {
    avg_response_time_minutes: avgMinutes != null ? Number(avgMinutes) : null,
    avg_response_time_label: formatAverageResponseTime(avgMinutes),
  };
}

module.exports = {
  formatAverageResponseTime,
  getSellerResponseTime,
};
