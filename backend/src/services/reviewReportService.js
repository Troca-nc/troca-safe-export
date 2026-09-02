'use strict';

const REPORT_THRESHOLD = 3;

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

async function reportVerifiedReview({ client, reviewId, reporterId, reason = null }) {
  if (!client || typeof client.query !== 'function') throw new TypeError('transaction client required');
  const review = positiveInteger(reviewId);
  const reporter = positiveInteger(reporterId);
  if (!review || !reporter) return { outcome: 'invalid' };

  const locked = await client.query(
    'SELECT id, reviewer_id, status FROM verified_reviews WHERE id = $1 FOR UPDATE',
    [review]
  );
  const row = locked.rows[0];
  if (!row) return { outcome: 'not_found' };
  if (Number(row.reviewer_id) === reporter) return { outcome: 'self_report' };

  const inserted = await client.query(
    `INSERT INTO verified_review_reports (review_id, reporter_id, reason)
     VALUES ($1, $2, $3)
     ON CONFLICT (review_id, reporter_id) DO NOTHING
     RETURNING id`,
    [review, reporter, reason]
  );
  const countResult = await client.query(
    'SELECT COUNT(*)::int AS total FROM verified_review_reports WHERE review_id = $1',
    [review]
  );
  const count = Number(countResult.rows[0]?.total ?? 0);
  const shouldReport = count >= REPORT_THRESHOLD;
  const updated = await client.query(
    `UPDATE verified_reviews
     SET report_count = $2,
         report_reason = CASE WHEN $3 THEN COALESCE(report_reason, $4) ELSE report_reason END,
         status = CASE WHEN $3 AND status = 'published' THEN 'reported' ELSE status END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [review, count, shouldReport, reason]
  );

  return {
    outcome: inserted.rows[0] ? 'recorded' : 'duplicate',
    count,
    threshold: REPORT_THRESHOLD,
    review: updated.rows[0],
  };
}

module.exports = { REPORT_THRESHOLD, reportVerifiedReview };
