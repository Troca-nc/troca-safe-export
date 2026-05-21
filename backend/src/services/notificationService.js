'use strict';

// ============================================================
//  Troca — Service de création de notifications in-app
//  Appelé depuis messages.js, scheduler.js, etc.
// ============================================================

const { query } = require('../config/database');

/**
 * Crée une notification in-app pour un utilisateur
 * @param {number}  userId
 * @param {string}  type   - Voir CHECK constraint dans schema
 * @param {string}  title
 * @param {string}  body
 * @param {string}  href   - URL de destination au clic
 */
async function createNotification(userId, { type, title, body = '', href = '/' }) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, href)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, href]
    );
  } catch (err) {
    // Non bloquant : log et continue
    console.error('[notif] Erreur création notification:', err.message);
  }
}

/**
 * Crée une notification "nouveau message"
 */
async function notifyNewMessage(recipientId, senderName, annonceTitle, convId) {
  return createNotification(recipientId, {
    type:  'new_message',
    title: `💬 ${senderName} vous a écrit`,
    body:  `À propos de : ${annonceTitle}`,
    href:  `/messages/${convId}`,
  });
}

/**
 * Crée une notification "alerte de recherche"
 */
async function notifySearchAlert(userId, alertLabel, nbResults, searchParams) {
  return createNotification(userId, {
    type:  'search_alert',
    title: `🔔 ${nbResults} nouvelle${nbResults > 1 ? 's' : ''} annonce${nbResults > 1 ? 's' : ''} pour « ${alertLabel} »`,
    body:  'Cliquez pour voir les résultats',
    href:  `/annonces?${new URLSearchParams(searchParams).toString()}`,
  });
}

/**
 * Crée une notification "annonce expirant bientôt"
 */
async function notifyListingExpiring(userId, annonceId, annonceTitre, daysLeft) {
  return createNotification(userId, {
    type:  'listing_expiring',
    title: `⏰ Votre annonce expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
    body:  annonceTitre,
    href:  `/annonces/${annonceId}/edit`,
  });
}

/**
 * Crée une notification "offre reçue"
 */
async function notifyOfferReceived(sellerId, buyerName, amount, annonceId) {
  return createNotification(sellerId, {
    type:  'offer_received',
    title: `💰 ${buyerName} vous fait une offre`,
    body:  `${amount.toLocaleString('fr-FR')} XPF`,
    href:  `/annonces/${annonceId}`,
  });
}

module.exports = {
  createNotification,
  notifyNewMessage,
  notifySearchAlert,
  notifyListingExpiring,
  notifyOfferReceived,
};
