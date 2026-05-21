'use strict';

// ============================================================
//  Troca — Service Push Notifications (Expo Push API)
//  Envoie des notifications push aux tokens enregistrés
// ============================================================

const https = require('https');
const { query } = require('../config/database');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envoie une notification push à un utilisateur via son user_id
 * Récupère tous ses tokens enregistrés en DB
 */
async function sendPushToUser(userId, { title, body, data = {} }) {
  try {
    const result = await query(
      'SELECT token FROM push_tokens WHERE user_id = $1',
      [userId]
    );

    if (!result.rows.length) return;

    const messages = result.rows.map(({ token }) => ({
      to:    token,
      title,
      body,
      data,
      sound: 'default',
      badge: 1,
      channelId: data.type === 'new_message' ? 'messages' : 'default',
    }));

    await _sendBatch(messages);
  } catch (err) {
    console.error('[push] sendPushToUser error:', err.message);
  }
}

/**
 * Envoie une notification push à plusieurs utilisateurs
 */
async function sendPushToUsers(userIds, payload) {
  for (const userId of userIds) {
    await sendPushToUser(userId, payload).catch(() => {});
  }
}

/**
 * Envoie un batch de messages à l'API Expo Push
 * Expo accepte jusqu'à 100 messages par requête
 */
async function _sendBatch(messages) {
  // Découper en chunks de 100
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await new Promise((resolve, reject) => {
      const body = JSON.stringify(chunk);
      const options = {
        hostname: 'exp.host',
        path:     '/--/api/v2/push/send',
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Accept':         'application/json',
          'Accept-Encoding':'gzip, deflate',
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (d) => { raw += d; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            // Logger les erreurs de token invalide pour nettoyage
            if (parsed.data) {
              parsed.data.forEach((item, i) => {
                if (item.status === 'error' && item.details?.error === 'DeviceNotRegistered') {
                  const token = chunk[i]?.to;
                  if (token) {
                    query('DELETE FROM push_tokens WHERE token = $1', [token]).catch(() => {});
                    console.log(`[push] Token supprimé (DeviceNotRegistered): ${token.slice(0, 30)}…`);
                  }
                }
              });
            }
          } catch {}
          resolve(undefined);
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

module.exports = { sendPushToUser, sendPushToUsers };
