'use strict';

const { query } = require('../config/database');

function createActionError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeUserId(value) {
  const userId = Number(value);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createActionError(400, 'Utilisateur invalide.');
  }
  return userId;
}

function normalizeDurationDays(value) {
  const durationDays = Number(value ?? 30);
  if (!Number.isSafeInteger(durationDays) || durationDays < 1 || durationDays > 365) {
    throw createActionError(400, 'Durée de suspension invalide.');
  }
  return durationDays;
}

function normalizePlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  if (!['free', 'pro'].includes(plan)) {
    throw createActionError(400, 'Plan invalide.');
  }
  return plan;
}

async function suspendUser(userIdInput, durationInput, queryFn = query) {
  const userId = normalizeUserId(userIdInput);
  const durationDays = normalizeDurationDays(durationInput);
  const result = await queryFn(
    `UPDATE users
     SET banned_until = NOW() + ($2::int * INTERVAL '1 day'),
         updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
     RETURNING id, banned_until`,
    [userId, durationDays]
  );
  return result.rows[0] || null;
}

async function unsuspendUser(userIdInput, queryFn = query) {
  const userId = normalizeUserId(userIdInput);
  const result = await queryFn(
    `UPDATE users
     SET banned_until = NULL,
         deleted_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, banned_until, deleted_at`,
    [userId]
  );
  return result.rows[0] || null;
}

async function setUserPlan(userIdInput, planInput, queryFn = query) {
  const userId = normalizeUserId(userIdInput);
  const plan = normalizePlan(planInput);
  const result = await queryFn(
    `UPDATE users
     SET is_pro = $2,
         pro_plan = CASE WHEN $2 THEN 'pro' ELSE NULL END,
         pro_expires_at = CASE WHEN $2 THEN COALESCE(pro_expires_at, NOW() + INTERVAL '30 days') ELSE NULL END,
         updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
     RETURNING id, is_pro, pro_plan, pro_expires_at`,
    [userId, plan === 'pro']
  );
  return { plan, user: result.rows[0] || null };
}

async function forceDeleteUser(userIdInput, queryFn = query) {
  const userId = normalizeUserId(userIdInput);
  const result = await queryFn(
    `UPDATE users
     SET deleted_at = NOW(),
         banned_until = NULL,
         updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
     RETURNING id, deleted_at`,
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  forceDeleteUser,
  normalizeDurationDays,
  normalizePlan,
  normalizeUserId,
  setUserPlan,
  suspendUser,
  unsuspendUser,
};
