'use strict';

const onlineUsers = new Map();

function toUserId(userId) {
  const parsed = Number(userId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function markUserOnline(userId) {
  const id = toUserId(userId);
  if (!id) return null;

  const snapshot = {
    user_id: id,
    is_online: true,
    last_seen_at: onlineUsers.get(id)?.last_seen_at ?? null,
    updated_at: new Date().toISOString(),
  };

  onlineUsers.set(id, snapshot);
  return snapshot;
}

function markUserOffline(userId) {
  const id = toUserId(userId);
  if (!id) return null;

  const previous = onlineUsers.get(id) || {};
  const snapshot = {
    user_id: id,
    is_online: false,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  onlineUsers.set(id, { ...previous, ...snapshot });
  return onlineUsers.get(id);
}

function getUserPresence(userId) {
  const id = toUserId(userId);
  if (!id) {
    return {
      user_id: null,
      is_online: false,
      last_seen_at: null,
    };
  }

  const snapshot = onlineUsers.get(id);
  if (!snapshot) {
    return {
      user_id: id,
      is_online: false,
      last_seen_at: null,
    };
  }

  return {
    user_id: id,
    is_online: Boolean(snapshot.is_online),
    last_seen_at: snapshot.last_seen_at || null,
  };
}

function getPresenceLabel(presence) {
  if (!presence) return null;
  if (presence.is_online) return 'En ligne';
  if (!presence.last_seen_at) return 'Hors ligne';

  const lastSeen = new Date(presence.last_seen_at);
  if (Number.isNaN(lastSeen.getTime())) return 'Hors ligne';

  const diffMs = Date.now() - lastSeen.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `Vu il y a ${minutes} min`;

  const hours = Math.max(1, Math.floor(minutes / 60));
  if (hours < 24) return `Vu il y a ${hours} h`;

  const days = Math.max(1, Math.floor(hours / 24));
  return `Vu il y a ${days} j`;
}

module.exports = {
  getPresenceLabel,
  getUserPresence,
  markUserOffline,
  markUserOnline,
};
