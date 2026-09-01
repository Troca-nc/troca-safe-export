'use strict';

const assert = require('assert');
const { REPORT_THRESHOLD, reportVerifiedReview } = require('../services/reviewReportService');

function clientFixture({ review = { id: 9, reviewer_id: 4, status: 'published' }, inserted = true, count = 1 } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      if (/SELECT id, reviewer_id, status/.test(sql)) return { rows: review ? [review] : [] };
      if (/INSERT INTO verified_review_reports/.test(sql)) return { rows: inserted ? [{ id: 1 }] : [] };
      if (/COUNT\(\*\).*verified_review_reports/.test(sql)) return { rows: [{ total: count }] };
      if (/UPDATE verified_reviews/.test(sql)) {
        return { rows: [{ ...review, report_count: params[1], status: params[2] ? 'reported' : review.status }] };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
}

async function run() {
  let count = 0;
  async function check(label, fn) { await fn(); count++; console.log(`  OK ${label}`); }
  await check('invalid identity fails before SQL', async () => {
    const client = clientFixture();
    assert.strictEqual((await reportVerifiedReview({ client, reviewId: 9, reporterId: null })).outcome, 'invalid');
    assert.strictEqual(client.calls.length, 0);
  });
  await check('missing review is not disclosed as success', async () => {
    assert.strictEqual((await reportVerifiedReview({ client: clientFixture({ review: null }), reviewId: 9, reporterId: 7 })).outcome, 'not_found');
  });
  await check('author cannot report own review', async () => {
    assert.strictEqual((await reportVerifiedReview({ client: clientFixture(), reviewId: 9, reporterId: 4 })).outcome, 'self_report');
  });
  await check('first distinct report keeps publication', async () => {
    const result = await reportVerifiedReview({ client: clientFixture({ count: 1 }), reviewId: 9, reporterId: 7, reason: 'spam' });
    assert.strictEqual(result.outcome, 'recorded'); assert.strictEqual(result.review.status, 'published');
  });
  await check('duplicate report is idempotent', async () => {
    const result = await reportVerifiedReview({ client: clientFixture({ inserted: false, count: 1 }), reviewId: 9, reporterId: 7 });
    assert.strictEqual(result.outcome, 'duplicate'); assert.strictEqual(result.count, 1);
  });
  await check('second distinct report keeps publication', async () => {
    assert.strictEqual((await reportVerifiedReview({ client: clientFixture({ count: 2 }), reviewId: 9, reporterId: 7 })).review.status, 'published');
  });
  await check('threshold marks review reported', async () => {
    const result = await reportVerifiedReview({ client: clientFixture({ count: REPORT_THRESHOLD }), reviewId: 9, reporterId: 7 });
    assert.strictEqual(result.review.status, 'reported'); assert.strictEqual(result.threshold, 3);
  });
  console.log(`Review report service: ${count} checks passed.`);
}

const completion = run();
if (require.main === module) completion.catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = completion;
