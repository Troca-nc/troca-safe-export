'use strict';

const LISTING_LIMITS = Object.freeze({ free: 5, pro: 100 });
const PHOTO_LIMITS = Object.freeze({ free: 6, pro: 12 });
const PRO_CATALOG_LIMIT = 100;

function quotaFor(user, limits) {
  return user?.is_pro ? limits.pro : limits.free;
}

function activeListingLimit(user) {
  return quotaFor(user, LISTING_LIMITS);
}

function listingPhotoLimit(user) {
  return quotaFor(user, PHOTO_LIMITS);
}

function quotaError(message, code) {
  const error = new Error(message);
  error.status = 403;
  error.code = code;
  return error;
}

async function lockOwner(client, userId) {
  const owner = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
  if (!owner.rows[0]) {
    const error = new Error('Compte introuvable.');
    error.status = 404;
    throw error;
  }
}

async function assertActiveListingCapacity(client, user, options = {}) {
  await lockOwner(client, user.id);
  const values = [user.id];
  let exclusion = '';
  if (options.excludeListingId != null) {
    values.push(options.excludeListingId);
    exclusion = ' AND id <> $2';
  }
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
       FROM annonces
     WHERE user_id = $1 AND status = 'active' AND deleted_at IS NULL${exclusion}`,
    values,
  );
  const limit = activeListingLimit(user);
  if (Number(result.rows[0]?.count || 0) >= limit) {
    throw quotaError(
      `Limite de ${limit} annonces actives atteinte. Archivez une annonce avant d'en publier une nouvelle.`,
      'ACTIVE_LISTING_LIMIT_REACHED',
    );
  }
  return limit;
}

async function assertActiveCatalogCapacity(client, user, options = {}) {
  await lockOwner(client, user.id);
  const values = [user.id];
  let exclusion = '';
  if (options.excludeProductId != null) {
    values.push(options.excludeProductId);
    exclusion = ' AND id <> $2';
  }
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
       FROM products
      WHERE owner_id = $1 AND is_active = TRUE${exclusion}`,
    values,
  );
  if (Number(result.rows[0]?.count || 0) >= PRO_CATALOG_LIMIT) {
    throw quotaError(
      `Limite de ${PRO_CATALOG_LIMIT} fiches catalogue actives atteinte. Archivez une fiche avant d'en créer une nouvelle.`,
      'ACTIVE_CATALOG_LIMIT_REACHED',
    );
  }
  return PRO_CATALOG_LIMIT;
}

module.exports = {
  LISTING_LIMITS,
  PHOTO_LIMITS,
  PRO_CATALOG_LIMIT,
  activeListingLimit,
  listingPhotoLimit,
  assertActiveListingCapacity,
  assertActiveCatalogCapacity,
};
