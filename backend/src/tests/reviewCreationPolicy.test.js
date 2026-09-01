'use strict';

const assert = require('assert');
const { evaluateReviewCreation } = require('../services/reviewCreationPolicy');

function run() {
  let count = 0;
  function check(label, input, expected) {
    const result = evaluateReviewCreation(input);
    for (const [key, value] of Object.entries(expected)) assert.strictEqual(result[key], value, `${label}: ${key}`);
    count++;
    console.log(`  OK ${label}`);
  }

  check('anonymous review is rejected', { reviewerId: null, proId: 8, hasInvite: true }, { allowed: false, status: 401 });
  check('invalid reviewer is rejected', { reviewerId: 'x', proId: 8, hasConversation: true }, { allowed: false, status: 401 });
  check('invalid professional is rejected', { reviewerId: 7, proId: 0, hasConversation: true }, { allowed: false, status: 400 });
  check('self review with invite is rejected', { reviewerId: 7, proId: 7, hasInvite: true }, { allowed: false, status: 403 });
  check('self review with conversation is rejected', { reviewerId: 7, proId: 7, hasConversation: true }, { allowed: false, status: 403 });
  check('unproven interaction is rejected', { reviewerId: 7, proId: 8 }, { allowed: false, status: 403 });
  check('valid invite permits verified publication', { reviewerId: 7, proId: 8, hasInvite: true }, { allowed: true, verified: true, publicationStatus: 'published' });
  check('conversation permits verified publication', { reviewerId: 7, proId: 8, hasConversation: true }, { allowed: true, verified: true, publicationStatus: 'published' });

  console.log(`Review creation policy: ${count} checks passed.`);
}

run();
