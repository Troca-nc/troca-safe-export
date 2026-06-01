'use strict';

const { query } = require('../config/database');
const { createNotification } = require('./notificationService');
const { sendPushToUser } = require('./pushService');
const { sendMail } = require('./emailService');

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function dayOfWeekNc(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

async function triggerCovoiturageAlerts(newRide) {
  if (!newRide) return;

  const rideDay = newRide.ride_date ? dayOfWeekNc(newRide.ride_date) : null;
  const rideTime = newRide.ride_time ? String(newRide.ride_time).slice(0, 5) : null;
  const departure = normalizeText(newRide.departure);
  const destination = normalizeText(newRide.destination);

  const result = await query(
    `SELECT
       ca.id,
       ca.user_id,
       ca.from_commune,
       ca.to_commune,
       ca.jour_semaine,
       ca.heure_min,
       ca.heure_max,
       ca.via_push,
       ca.via_email,
       u.email,
       u.prenom,
       u.expo_push_token
     FROM covoit_alerts ca
     JOIN users u ON u.id = ca.user_id
     WHERE ca.active = true
       AND ca.user_id != $1
       AND (ca.from_commune IS NULL
            OR LOWER($2) LIKE '%' || LOWER(ca.from_commune) || '%'
            OR LOWER(ca.from_commune) LIKE '%' || LOWER($2) || '%')
       AND (ca.to_commune IS NULL
            OR LOWER($3) LIKE '%' || LOWER(ca.to_commune) || '%'
            OR LOWER(ca.to_commune) LIKE '%' || LOWER($3) || '%')
       AND (ca.jour_semaine IS NULL OR ca.jour_semaine = $4)
       AND (ca.heure_min IS NULL OR $5 IS NULL OR $5::time >= ca.heure_min)
       AND (ca.heure_max IS NULL OR $5 IS NULL OR $5::time <= ca.heure_max)
       AND (ca.last_notified_at IS NULL OR ca.last_notified_at < NOW() - INTERVAL '1 hour')`,
    [newRide.user_id, departure, destination, rideDay, rideTime]
  );

  for (const alert of result.rows) {
    const href = `/covoiturage/${newRide.id}`;
    const title = '🚗 Trajet disponible !';
    const body = `${newRide.departure} → ${newRide.destination}`;

    if (alert.via_push) {
      await sendPushToUser(alert.user_id, {
        title,
        body,
        data: { type: 'covoit_alert', listing_id: newRide.id },
      }).catch(() => {});
    }

    if (alert.via_email && alert.email) {
      await sendMail({
        to: alert.email,
        subject: `🚗 Trajet trouvé : ${newRide.departure} → ${newRide.destination}`,
        html: `
          <h1>Nouveau trajet correspondant</h1>
          <p>Un trajet correspond à votre alerte.</p>
          <p><strong>${newRide.departure}</strong> → <strong>${newRide.destination}</strong></p>
          <p><a href="${href}">Voir le trajet</a></p>
          <p style="color:#6b7280;font-size:12px;">Vous recevez cet email car vous suivez cette alerte trajet.</p>
        `,
        text: `Un trajet correspond à votre alerte : ${newRide.departure} → ${newRide.destination}\n${href}`,
      }).catch(() => {});
    }

    await createNotification(alert.user_id, {
      type: 'ride_alert',
      title: '🚗 Trajet disponible !',
      body: `${newRide.departure} → ${newRide.destination}`,
      href,
    });

    await query(
      `UPDATE covoit_alerts SET last_notified_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [alert.id]
    ).catch(() => {});
  }
}

module.exports = {
  dayOfWeekNc,
  normalizeText,
  triggerCovoiturageAlerts,
};
