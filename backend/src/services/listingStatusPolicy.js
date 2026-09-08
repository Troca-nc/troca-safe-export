'use strict';

const OWNER_TRANSITIONS = Object.freeze({
  active: new Set(['active', 'reserved', 'sold']),
  reserved: new Set(['active', 'reserved', 'sold']),
  sold: new Set(['active', 'sold']),
});

function canChangeListingStatus(currentStatus, nextStatus, { isAdmin = false } = {}) {
  if (isAdmin) return true;
  return OWNER_TRANSITIONS[currentStatus]?.has(nextStatus) === true;
}

module.exports = { canChangeListingStatus };
