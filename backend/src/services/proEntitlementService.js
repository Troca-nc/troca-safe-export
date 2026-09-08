'use strict';

function hasCurrentProEntitlement(user, now = new Date()) {
  if (!user?.is_pro || !user.pro_expires_at) return false;

  const expiresAt = new Date(user.pro_expires_at).getTime();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  return Number.isFinite(expiresAt) && Number.isFinite(nowMs) && expiresAt > nowMs;
}

function applyCurrentProEntitlement(user, now = new Date()) {
  if (!user) return user;
  const isPro = hasCurrentProEntitlement(user, now);
  return {
    ...user,
    is_pro: isPro,
    pro_plan: isPro ? user.pro_plan : null,
  };
}

module.exports = { applyCurrentProEntitlement, hasCurrentProEntitlement };
