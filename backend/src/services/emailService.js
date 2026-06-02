'use strict';

// ============================================================
//  Troca — Service Email (nodemailer)
//  Centralise tous les envois transactionnels du backend
// ============================================================

const nodemailer = require('nodemailer');
const { isConfiguredValue } = require('../config/env');
const { ensureNotificationPreferences } = require('./notificationPreferencesService');

// ── Transporter SMTP ─────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!isConfiguredValue(process.env.SMTP_HOST) || !isConfiguredValue(process.env.SMTP_USER) || !isConfiguredValue(process.env.SMTP_PASS)) {
    console.warn('[email] Variables SMTP manquantes — emails désactivés');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST.trim(),
    port:   Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
  });

  return _transporter;
}

// ── Envoi générique ──────────────────────────────────────────

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] (simulé) → ${to} | ${subject}`);
    return { simulated: true };
  }

  return transporter.sendMail({
    from:    `"Troca" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });
}

// ── Templates ────────────────────────────────────────────────

const BASE_URL = () => process.env.BASE_URL || 'https://troca.nc';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildNotificationFooter({ manageUrl, unsubscribeUrl, unsubscribeLabel = 'Se désabonner' }) {
  const manageLink = manageUrl
    ? `<a href="${manageUrl}" style="color:#9ca3af;">Gérer mes notifications</a>`
    : '';
  const unsubscribeLink = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:#9ca3af;">${escapeHtml(unsubscribeLabel)}</a>`
    : '';

  const separator = manageLink && unsubscribeLink ? ' · ' : '';
  return `
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;line-height:1.6;">
      ${manageLink}${separator}${unsubscribeLink}
    </p>
  `;
}

function buildListingEmail({
  prenom,
  subject,
  headline,
  intro,
  listingTitle,
  listingMeta = '',
  ctaLabel,
  ctaUrl,
  footerManageUrl = `${BASE_URL()}/parametres/notifications`,
  unsubscribeUrl = null,
  unsubscribeLabel = 'Se désabonner',
  extraHtml = '',
}) {
  return {
    subject,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${intro}</p>
      <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(headline)}</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(listingTitle)}</p>
        ${listingMeta ? `<p style="margin:6px 0 0;color:#475569;font-size:14px;">${listingMeta}</p>` : ''}
      </div>
      ${extraHtml}
      <a class="btn" href="${ctaUrl}">${escapeHtml(ctaLabel)}</a>
      ${buildNotificationFooter({
        manageUrl: footerManageUrl,
        unsubscribeUrl,
        unsubscribeLabel,
      })}
    `),
  };
}

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Troca</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #2563eb; padding: 28px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 32px; color: #1f2937; line-height: 1.6; }
    .body p { margin: 0 0 16px; }
    .btn { display: inline-block; background: #2563eb; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .footer { padding: 20px 32px; background: #f9fafb; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .footer a { color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>🔁 Troca</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      Troca — La plateforme de petites annonces de Nouvelle-Calédonie<br>
      <a href="${BASE_URL()}/politique-de-confidentialite">Confidentialité</a> ·
      <a href="${BASE_URL()}/cgu">CGU</a>
    </div>
  </div>
</body>
</html>`;
}

// ── Emails spécifiques ───────────────────────────────────────

/**
 * Email de réinitialisation de mot de passe
 */
async function sendResetEmail(to, token) {
  const link = `${BASE_URL()}/mot-de-passe-oublie/reset?token=${token}`;
  return sendMail({
    to,
    subject: 'Réinitialisation de votre mot de passe Troca',
    html: baseTemplate(`
      <p>Bonjour,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous — ce lien est valable <strong>1 heure</strong>.</p>
      <a class="btn" href="${link}">Réinitialiser mon mot de passe</a>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.</p>
      <p style="color:#6b7280;font-size:13px;">Lien : <a href="${link}">${link}</a></p>
    `),
  });
}

/**
 * Email de bienvenue après inscription
 */
async function sendWelcomeEmail(to, prenom) {
  return sendMail({
    to,
    subject: `Bienvenue sur Troca, ${prenom} ! 🎉`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p>Votre compte Troca est créé ! Vous pouvez dès maintenant publier des annonces, contacter des vendeurs et troquer sur toute la Nouvelle-Calédonie.</p>
      <a class="btn" href="${BASE_URL()}/annonces/nouvelle">Publier ma première annonce</a>
      <p>Des questions ? Consultez notre <a href="${BASE_URL()}/cgu">guide d'utilisation</a> ou répondez simplement à cet email.</p>
    `),
  });
}

/**
 * Email de confirmation d'email
 */
async function sendVerificationEmail(to, prenom, token) {
  const link = `${BASE_URL()}/verification-email?token=${token}`;
  return sendMail({
    to,
    subject: 'Confirmez votre email Troca',
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p>Merci pour votre inscription sur Troca. Pour activer votre compte et valider votre email, cliquez sur le bouton ci-dessous.</p>
      <a class="btn" href="${link}">Confirmer mon email</a>
      <p>Ce lien est valable pendant <strong>24 heures</strong>.</p>
      <p style="color:#6b7280;font-size:13px;">Lien : <a href="${link}">${link}</a></p>
    `),
  });
}

/**
 * Email de notification d'alerte de recherche
 */
async function sendAlertEmail(to, prenom, alert, annonces) {
  if (!annonces.length) return null;
  const prefs = alert?.user_id ? await ensureNotificationPreferences(alert.user_id) : null;
  if (prefs && prefs.email_search_alert === false) return null;

  const unsubLink = `${BASE_URL()}/api/alerts/unsubscribe/${alert.unsubscribe_token}`;
  const annonceCards = annonces.slice(0, 5).map((a) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:12px;">
      <a href="${BASE_URL()}/annonces/${a.id}" style="font-weight:600;color:#2563eb;text-decoration:none;font-size:15px;">${a.titre}</a>
      <p style="margin:6px 0 0;color:#374151;">${a.prix_xpf ? `${a.prix_xpf.toLocaleString('fr-NC')} XPF` : 'Prix à débattre'} · ${a.commune || ''}</p>
    </div>
  `).join('');

  return sendMail({
    to,
    subject: `${annonces.length} nouvelle${annonces.length > 1 ? 's' : ''} annonce${annonces.length > 1 ? 's' : ''} pour "${alert.label}"`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p>De nouvelles annonces correspondent à votre alerte <strong>"${alert.label}"</strong> :</p>
      ${annonceCards}
      ${annonces.length > 5 ? `<p><a href="${BASE_URL()}/annonces?q=${encodeURIComponent(alert.label)}">Voir toutes les annonces →</a></p>` : ''}
      ${buildNotificationFooter({
        manageUrl: `${BASE_URL()}/parametres/notifications`,
        unsubscribeUrl: unsubLink,
      })}
    `),
  });
}

/**
 * Email notification nouveau message
 */
async function sendNewMessageEmail(to, prenom, senderName, annonceTitle, convId, recipientUserId = null) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && prefs.email_new_message === false) return null;

  const link = `${BASE_URL()}/messages/${convId}`;
  const unsubLink = prefs?.new_message_unsubscribe_token
    ? `${BASE_URL()}/api/users/notifications/unsubscribe/${prefs.new_message_unsubscribe_token}`
    : null;
  return sendMail({
    to,
    subject: `${escapeHtml(senderName)} vous a envoyé un message sur Troca`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p><strong>${escapeHtml(senderName)}</strong> vous a envoyé un message concernant l'annonce <strong>"${escapeHtml(annonceTitle)}"</strong>.</p>
      <a class="btn" href="${link}">Lire le message</a>
      <p style="color:#6b7280;font-size:13px;">Vous recevez cet email car vous avez une conversation active sur Troca.</p>
      ${buildNotificationFooter({
        manageUrl: `${BASE_URL()}/parametres/notifications`,
        unsubscribeUrl: unsubLink,
        unsubscribeLabel: 'Ne plus recevoir les messages par email',
      })}
    `),
  });
}

async function sendPerformanceReportEmail({ to, prenom, report, recipientUserId }) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && (prefs.email_performance_report === false || prefs.performance_report_frequency === 'never')) {
    return null;
  }

  const isPro = Boolean(report?.is_pro);
  const title = isPro
    ? 'Votre rapport business Troca'
    : 'Votre rapport d’activité Troca';
  const sections = (report?.listings || []).slice(0, isPro ? 5 : 3).map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.title || 'Annonce')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(item.views || 0).toLocaleString('fr-FR')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(item.clicks || 0).toLocaleString('fr-FR')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(item.favorites || 0).toLocaleString('fr-FR')}</td>
    </tr>
  `).join('');

  const unsubLink = prefs?.performance_report_unsubscribe_token
    ? `${BASE_URL()}/api/users/notifications/unsubscribe/${prefs.performance_report_unsubscribe_token}`
    : null;

  const summaryCards = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin:22px 0;">
      <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Vues</div>
        <div style="font-size:26px;font-weight:700;color:#0f172a;margin-top:6px;">${Number(report?.totals?.views || 0).toLocaleString('fr-FR')}</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Clics</div>
        <div style="font-size:26px;font-weight:700;color:#0f172a;margin-top:6px;">${Number(report?.totals?.clicks || 0).toLocaleString('fr-FR')}</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Favoris</div>
        <div style="font-size:26px;font-weight:700;color:#0f172a;margin-top:6px;">${Number(report?.totals?.favorites || 0).toLocaleString('fr-FR')}</div>
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: isPro ? '📈 Votre rapport business Troca' : '📊 Votre rapport Troca',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${isPro
        ? 'Voici le suivi de vos annonces pour cette période. Vous pouvez adapter la récurrence dans votre dashboard.'
        : 'Voici un aperçu simple de la performance de vos annonces publiées sur Troca.'}
      </p>
      ${summaryCards}
      <div style="margin-top:22px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Annonce</th>
              <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Vues</th>
              <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Clics</th>
              <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Favoris</th>
            </tr>
          </thead>
          <tbody>${sections || '<tr><td colspan="4" style="padding:16px 12px;color:#64748b;">Aucune annonce active sur cette période.</td></tr>'}</tbody>
        </table>
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:18px;">Période de suivi : ${escapeHtml(report?.period_label || 'derniers jours')}</p>
      ${buildNotificationFooter({
        manageUrl: `${BASE_URL()}/parametres/notifications`,
        unsubscribeUrl: unsubLink,
        unsubscribeLabel: 'Ne plus recevoir ce rapport par email',
      })}
    `),
  });
}

async function sendBoostActivatedEmail(to, prenom, details = {}, recipientUserId) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && prefs.email_boost_activated === false) return null;

  const boostDays = Number(details.boostDays || 0);
  const unsubscribeUrl = prefs?.boost_activated_unsubscribe_token
    ? `${BASE_URL()}/api/users/notifications/unsubscribe/${prefs.boost_activated_unsubscribe_token}`
    : null;

  const payload = buildListingEmail({
    prenom,
    subject: '[Troca] Votre boost est activé',
    headline: 'Boost activé',
    intro: `Votre boost <strong>${escapeHtml(details.boostLabel || 'Boost')}</strong> est maintenant actif sur Troca.`,
    listingTitle: details.annonceTitle || 'Votre annonce',
    listingMeta: 'Votre annonce gagne en visibilité et commence à remonter dans les classements.',
    ctaLabel: 'Gérer mon annonce boostée',
    ctaUrl: details.annonceId ? `${BASE_URL()}/annonces/${details.annonceId}/edit` : `${BASE_URL()}/parametres/notifications`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les emails de boost',
    extraHtml: boostDays
      ? `<p style="margin:0;color:#374151;font-size:14px;">Durée active : <strong>${boostDays} jour${boostDays > 1 ? 's' : ''}</strong>.</p>`
      : '',
  });

  return sendMail({ to, subject: payload.subject, html: payload.html });
}

async function sendOfferReceivedEmail(to, prenom, details = {}, recipientUserId) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && prefs.email_offer_received === false) return null;

  const amountXpf = Number(details.amountXpf || 0);
  const unsubscribeUrl = prefs?.offer_received_unsubscribe_token
    ? `${BASE_URL()}/api/users/notifications/unsubscribe/${prefs.offer_received_unsubscribe_token}`
    : null;

  const payload = buildListingEmail({
    prenom,
    subject: `[Troca] Nouvelle offre reçue pour "${details.annonceTitle || 'votre annonce'}"`,
    headline: 'Offre de prix reçue',
    intro: `<strong>${escapeHtml(details.buyerName || 'Un acheteur')}</strong> vous a envoyé une offre sur la messagerie Troca.`,
    listingTitle: details.annonceTitle || 'Annonce',
    listingMeta: amountXpf
      ? `Montant proposé : <strong>${amountXpf.toLocaleString('fr-FR')} XPF</strong>`
      : 'Nouvelle offre disponible dans la conversation.',
    ctaLabel: 'Voir la conversation',
    ctaUrl: `${BASE_URL()}/messages/${details.convId}`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les offres par email',
  });

  return sendMail({ to, subject: payload.subject, html: payload.html });
}

async function sendListingExpiringEmail(to, prenom, details = {}, recipientUserId) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && prefs.email_listing_expiring === false) return null;

  const daysLeft = Number(details.daysLeft || 3);
  const unsubscribeUrl = prefs?.listing_expiring_unsubscribe_token
    ? `${BASE_URL()}/api/users/notifications/unsubscribe/${prefs.listing_expiring_unsubscribe_token}`
    : null;

  const payload = buildListingEmail({
    prenom,
    subject: `[Troca] Votre annonce expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
    headline: 'Annonce bientôt expirée',
    intro: `Votre annonce <strong>${escapeHtml(details.annonceTitle || 'Troca')}</strong> arrive à échéance prochainement.`,
    listingTitle: details.annonceTitle || 'Annonce',
    listingMeta: `Il vous reste environ <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> avant l'expiration.`,
    ctaLabel: 'Republier ou prolonger',
    ctaUrl: details.annonceId ? `${BASE_URL()}/annonces/${details.annonceId}/edit` : `${BASE_URL()}/parametres/notifications`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les rappels d’expiration',
  });

  return sendMail({ to, subject: payload.subject, html: payload.html });
}

async function sendListingExpiredEmail(to, prenom, details = {}, recipientUserId) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && prefs.email_listing_expired === false) return null;

  const unsubscribeUrl = prefs?.listing_expired_unsubscribe_token
    ? `${BASE_URL()}/api/users/notifications/unsubscribe/${prefs.listing_expired_unsubscribe_token}`
    : null;

  const payload = buildListingEmail({
    prenom,
    subject: '[Troca] Votre annonce est expirée',
    headline: 'Annonce expirée',
    intro: `Votre annonce <strong>${escapeHtml(details.annonceTitle || 'Troca')}</strong> vient d’arriver à expiration.`,
    listingTitle: details.annonceTitle || 'Annonce',
    listingMeta: 'Vous pouvez la republier ou la réactiver depuis votre espace annonces.',
    ctaLabel: 'Réactiver mon annonce',
    ctaUrl: details.annonceId ? `${BASE_URL()}/annonces/${details.annonceId}/edit` : `${BASE_URL()}/parametres/notifications`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les emails d’expiration',
  });

  return sendMail({ to, subject: payload.subject, html: payload.html });
}

function buildRideSummary(details = {}) {
  const departure = escapeHtml(details.departure || 'Départ');
  const destination = escapeHtml(details.destination || 'Destination');
  const date = escapeHtml(details.rideDate || details.ride_date || 'Date libre');
  const time = escapeHtml(String(details.rideTime || details.ride_time || '').slice(0, 5) || 'Heure libre');
  const driver = escapeHtml(details.driverPrenom || details.driver_prenom || 'Conducteur local');
  const seats = Number(details.seats || 1);
  const priceXpf = Number(details.priceXpf || details.price_xpf || 0);

  return `
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Trajet</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${departure} → ${destination}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${date} · ${time} · ${driver}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${seats} place${seats > 1 ? 's' : ''} · ${priceXpf.toLocaleString('fr-FR')} XPF / place</p>
    </div>
  `;
}

async function sendRideAutoBookingPassengerEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: `✅ Place réservée — ${details.departure || 'Trajet'} → ${details.destination || 'Destination'}`,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Votre place est confirmée !</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir mes réservations</a>
      <p>Retrouvez les détails de ce trajet sur Troca.</p>
    `),
  });
}

async function sendRideAutoBookingDriverEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: `🚗 Nouvelle réservation — ${details.departure || 'Trajet'} → ${details.destination || 'Destination'}`,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Une place vient d’être réservée automatiquement sur votre trajet.</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir mes réservations</a>
      <p>Le passager a reçu sa confirmation immédiatement.</p>
    `),
  });
}

async function sendRideManualRequestEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: '🔔 Nouvelle demande de réservation',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${escapeHtml(details.passengerPrenom || 'Un passager')} souhaite rejoindre votre trajet.</p>
      ${buildRideSummary(details)}
      <p>Vous avez 24h pour accepter ou refuser.</p>
      <a class="btn" href="${link}">Voir la demande</a>
    `),
  });
}

async function sendRideBookingAcceptedPassengerEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: '🎉 Réservation acceptée !',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${escapeHtml(details.driverPrenom || 'Le conducteur')} a accepté votre demande !</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir les détails</a>
    `),
  });
}

async function sendRideBookingAcceptedDriverEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: '✅ Réservation confirmée',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Vous avez accepté la réservation de ${escapeHtml(details.passengerPrenom || 'ce passager')}.</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir mes réservations</a>
    `),
  });
}

module.exports = {
  sendMail,
  sendResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendAlertEmail,
  sendNewMessageEmail,
  sendBoostActivatedEmail,
  sendOfferReceivedEmail,
  sendListingExpiringEmail,
  sendListingExpiredEmail,
  sendRideAutoBookingPassengerEmail,
  sendRideAutoBookingDriverEmail,
  sendRideManualRequestEmail,
  sendRideBookingAcceptedPassengerEmail,
  sendRideBookingAcceptedDriverEmail,
  sendPerformanceReportEmail,
};
