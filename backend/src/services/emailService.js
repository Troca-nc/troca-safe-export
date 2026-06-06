'use strict';

// ============================================================
//  Troca â€” Service Email (nodemailer)
//  Centralise tous les envois transactionnels du backend
// ============================================================

const nodemailer = require('nodemailer');
const { isConfiguredValue } = require('../config/env');
const { ensureNotificationPreferences } = require('./notificationPreferencesService');

// â”€â”€ Transporter SMTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!isConfiguredValue(process.env.SMTP_HOST) || !isConfiguredValue(process.env.SMTP_USER) || !isConfiguredValue(process.env.SMTP_PASS)) {
    console.warn('[email] Variables SMTP manquantes â€” emails dÃ©sactivÃ©s');
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

// â”€â”€ Envoi gÃ©nÃ©rique â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function sendMail({ to, subject, html, text, replyTo, cc, bcc }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] (simulÃ©) â†’ ${to} | ${subject}`);
    return { simulated: true };
  }

  return transporter.sendMail({
    from:    `"Troca" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
    ...(replyTo ? { replyTo } : {}),
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
  });
}

// â”€â”€ Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BASE_URL = () => process.env.BASE_URL || 'https://troca.nc';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildNotificationFooter({ manageUrl, unsubscribeUrl, unsubscribeLabel = 'Se dÃ©sabonner' }) {
  const manageLink = manageUrl
    ? `<a href="${manageUrl}" style="color:#9ca3af;">GÃ©rer mes notifications</a>`
    : '';
  const unsubscribeLink = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:#9ca3af;">${escapeHtml(unsubscribeLabel)}</a>`
    : '';

  const separator = manageLink && unsubscribeLink ? ' Â· ' : '';
  return `
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;line-height:1.6;">
      ${manageLink}${separator}${unsubscribeLink}
    </p>
  `;
}

function buildListingBoostEstimate(daysLeft = 3) {
  const safeDaysLeft = Number.isFinite(Number(daysLeft)) ? Number(daysLeft) : 3;
  if (safeDaysLeft <= 1) {
    return 'Un boost peut aider Ã  relancer immÃ©diatement la visibilitÃ© de votre annonce.';
  }
  if (safeDaysLeft === 2 || safeDaysLeft === 3) {
    return 'Un boost peut offrir jusquâ€™Ã  +45 % de visibilitÃ© estimÃ©e sur les premiers jours.';
  }
  if (safeDaysLeft <= 5) {
    return 'Un boost peut offrir jusquâ€™Ã  +35 % de visibilitÃ© estimÃ©e sur la pÃ©riode restante.';
  }
  return 'Un boost peut aider Ã  garder votre annonce plus visible au moment clÃ©.';
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
  unsubscribeLabel = 'Se dÃ©sabonner',
  extraHtml = '',
}) {
  const ctaHtml = ctaLabel && ctaUrl
    ? `<a class="btn" href="${ctaUrl}">${escapeHtml(ctaLabel)}</a>`
    : '';

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
      ${ctaHtml}
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
    <div class="header"><h1>ðŸ” Troca</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      Troca â€” La plateforme de petites annonces de Nouvelle-CalÃ©donie<br>
      <a href="${BASE_URL()}/politique-de-confidentialite">ConfidentialitÃ©</a> Â·
      <a href="${BASE_URL()}/cgu">CGU</a>
    </div>
  </div>
</body>
</html>`;
}

// â”€â”€ Emails spÃ©cifiques â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Email de rÃ©initialisation de mot de passe
 */
async function sendResetEmail(to, token) {
  const link = `${BASE_URL()}/mot-de-passe-oublie/reset?token=${token}`;
  return sendMail({
    to,
    subject: 'RÃ©initialisation de votre mot de passe Troca',
    html: baseTemplate(`
      <p>Bonjour,</p>
      <p>Vous avez demandÃ© Ã  rÃ©initialiser votre mot de passe. Cliquez sur le bouton ci-dessous â€” ce lien est valable <strong>1 heure</strong>.</p>
      <a class="btn" href="${link}">RÃ©initialiser mon mot de passe</a>
      <p>Si vous n'Ãªtes pas Ã  l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangÃ©.</p>
      <p style="color:#6b7280;font-size:13px;">Lien : <a href="${link}">${link}</a></p>
    `),
  });
}

/**
 * Email de bienvenue aprÃ¨s inscription
 */
async function sendWelcomeEmail(to, prenom) {
  return sendMail({
    to,
    subject: `Bienvenue sur Troca, ${prenom} ! ðŸŽ‰`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p>Votre compte Troca est crÃ©Ã© ! Vous pouvez dÃ¨s maintenant publier des annonces, contacter des vendeurs et troquer sur toute la Nouvelle-CalÃ©donie.</p>
      <a class="btn" href="${BASE_URL()}/annonces/nouvelle">Publier ma premiÃ¨re annonce</a>
      <p>Des questions ? Consultez notre <a href="${BASE_URL()}/cgu">guide d'utilisation</a> ou rÃ©pondez simplement Ã  cet email.</p>
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
      <p style="margin:6px 0 0;color:#374151;">${a.prix_xpf ? `${a.prix_xpf.toLocaleString('fr-NC')} XPF` : 'Prix Ã  dÃ©battre'} Â· ${a.commune || ''}</p>
    </div>
  `).join('');

  return sendMail({
    to,
    subject: `${annonces.length} nouvelle${annonces.length > 1 ? 's' : ''} annonce${annonces.length > 1 ? 's' : ''} pour "${alert.label}"`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p>De nouvelles annonces correspondent Ã  votre alerte <strong>"${alert.label}"</strong> :</p>
      ${annonceCards}
      ${annonces.length > 5 ? `<p><a href="${BASE_URL()}/annonces?q=${encodeURIComponent(alert.label)}">Voir toutes les annonces â†’</a></p>` : ''}
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
    subject: `${escapeHtml(senderName)} vous a envoyÃ© un message sur Troca`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p><strong>${escapeHtml(senderName)}</strong> vous a envoyÃ© un message concernant l'annonce <strong>"${escapeHtml(annonceTitle)}"</strong>.</p>
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
    : 'Votre rapport dâ€™activitÃ© Troca';
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
    subject: isPro ? 'ðŸ“ˆ Votre rapport business Troca' : 'ðŸ“Š Votre rapport Troca',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${isPro
        ? 'Voici le suivi de vos annonces pour cette pÃ©riode. Vous pouvez adapter la rÃ©currence dans votre dashboard.'
        : 'Voici un aperÃ§u simple de la performance de vos annonces publiÃ©es sur Troca.'}
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
          <tbody>${sections || '<tr><td colspan="4" style="padding:16px 12px;color:#64748b;">Aucune annonce active sur cette pÃ©riode.</td></tr>'}</tbody>
        </table>
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:18px;">PÃ©riode de suivi : ${escapeHtml(report?.period_label || 'derniers jours')}</p>
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
    subject: '[Troca] Votre boost est activÃ©',
    headline: 'Boost activÃ©',
    intro: `Votre boost <strong>${escapeHtml(details.boostLabel || 'Boost')}</strong> est maintenant actif sur Troca.`,
    listingTitle: details.annonceTitle || 'Votre annonce',
    listingMeta: 'Votre annonce gagne en visibilitÃ© et commence Ã  remonter dans les classements.',
    ctaLabel: 'GÃ©rer mon annonce boostÃ©e',
    ctaUrl: details.annonceId ? `${BASE_URL()}/annonces/${details.annonceId}/edit` : `${BASE_URL()}/parametres/notifications`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les emails de boost',
    extraHtml: boostDays
      ? `<p style="margin:0;color:#374151;font-size:14px;">DurÃ©e active : <strong>${boostDays} jour${boostDays > 1 ? 's' : ''}</strong>.</p>`
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
    subject: `[Troca] Nouvelle offre reÃ§ue pour "${details.annonceTitle || 'votre annonce'}"`,
    headline: 'Offre de prix reÃ§ue',
    intro: `<strong>${escapeHtml(details.buyerName || 'Un acheteur')}</strong> vous a envoyÃ© une offre sur la messagerie Troca.`,
    listingTitle: details.annonceTitle || 'Annonce',
    listingMeta: amountXpf
      ? `Montant proposÃ© : <strong>${amountXpf.toLocaleString('fr-FR')} XPF</strong>`
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
  const listingEditUrl = details.annonceId
    ? `${BASE_URL()}/annonces/nouvelle?edit=${details.annonceId}`
    : `${BASE_URL()}/annonces/nouvelle`;
  const boostUrl = details.annonceId
    ? `${BASE_URL()}/annonces/${details.annonceId}`
    : `${BASE_URL()}/pro`;

  const payload = buildListingEmail({
    prenom,
    subject: `[Troca] Votre annonce expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
    headline: 'Annonce bientÃ´t expirÃ©e',
    intro: `Votre annonce <strong>${escapeHtml(details.annonceTitle || 'Troca')}</strong> arrive Ã  Ã©chÃ©ance dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`,
    listingTitle: details.annonceTitle || 'Annonce',
    listingMeta: `Il vous reste environ <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> avant l'expiration.`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les rappels dâ€™expiration',
    extraHtml: `
      <div style="margin:18px 0 22px;padding:16px 18px;border:1px solid #fde68a;border-radius:14px;background:#fffbeb;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#b45309;">Conseil visibilitÃ©</p>
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">${escapeHtml(buildListingBoostEstimate(daysLeft))}</p>
      </div>
      <div style="margin:0 0 18px;padding:14px 18px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0369a1;">Action conseillÃ©e</p>
        <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Renouvelez maintenant pour prolonger la publication, ou booster pour relancer la visibilitÃ© au moment oÃ¹ votre annonce commence Ã  ralentir.</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:14px 0 22px;">
        <a href="${listingEditUrl}" style="display:inline-block;background:#111827;color:#fff !important;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Renouveler</a>
        <a href="${boostUrl}" style="display:inline-block;background:#0a7ea4;color:#fff !important;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Booster</a>
      </div>
      <p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.6;">Renouvelez pour prolonger la durÃ©e de votre publication et gardez-la visible auprÃ¨s des acheteurs actifs.</p>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">Le boost peut vous aider Ã  gagner en visibilitÃ© au moment oÃ¹ votre annonce commence Ã  ralentir.</p>
    `,
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
    subject: '[Troca] Votre annonce est expirÃ©e',
    headline: 'Annonce expirÃ©e',
    intro: `Votre annonce <strong>${escapeHtml(details.annonceTitle || 'Troca')}</strong> vient dâ€™arriver Ã  expiration.`,
    listingTitle: details.annonceTitle || 'Annonce',
    listingMeta: 'Vous pouvez la republier ou la rÃ©activer depuis votre espace annonces.',
    ctaLabel: 'RÃ©activer mon annonce',
    ctaUrl: details.annonceId ? `${BASE_URL()}/annonces/${details.annonceId}/edit` : `${BASE_URL()}/parametres/notifications`,
    unsubscribeUrl,
    unsubscribeLabel: 'Ne plus recevoir les emails dâ€™expiration',
  });

  return sendMail({ to, subject: payload.subject, html: payload.html });
}

function buildNewsletterItemsHtml(items = []) {
  return items.slice(0, 6).map((item) => `
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;margin:0 0 12px;background:#f8fafc;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0a7ea4;">${escapeHtml(item.type || 'Annonce')}</p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(item.title || 'Publication locale')}</p>
      <p style="margin:0;color:#475569;font-size:14px;">${escapeHtml(item.description || item.summary || '')}</p>
      <p style="margin:6px 0 0;color:#64748b;font-size:13px;">${escapeHtml(item.meta || '')}</p>
    </div>
  `).join('');
}

async function sendNewsletterEmail(to, prenom, newsletter = {}, recipientUserId = null) {
  const prefs = recipientUserId ? await ensureNotificationPreferences(recipientUserId) : null;
  if (prefs && prefs.email_performance_report === false && prefs.performance_report_frequency === 'never') {
    return null;
  }

  const items = Array.isArray(newsletter.items) ? newsletter.items : [];
  const summary = newsletter.summary || {};
  const unsubscribeUrl = newsletter.unsubscribeUrl || (newsletter.unsubscribeToken
    ? `${BASE_URL()}/newsletter/unsubscribe?token=${newsletter.unsubscribeToken}`
    : `${BASE_URL()}/newsletter/unsubscribe`);

  return sendMail({
    to,
    subject: newsletter.subject || 'ðŸ“° La newsletter locale Troca',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${escapeHtml(newsletter.intro || 'Voici une sÃ©lection locale de nouveautÃ©s publiÃ©es sur Troca.')}</p>
      ${items.length ? buildNewsletterItemsHtml(items) : '<p>Aucun contenu Ã  afficher pour le moment.</p>'}
      ${summary.total ? `<p style="margin-top:18px;color:#475569;font-size:14px;">${escapeHtml(summary.total)} contenu${summary.total > 1 ? 's' : ''} sÃ©lectionnÃ©${summary.total > 1 ? 's' : ''} cette semaine.</p>` : ''}
      <a class="btn" href="${newsletter.ctaUrl || `${BASE_URL()}/`}">${escapeHtml(newsletter.ctaLabel || 'Voir sur Troca')}</a>
      ${buildNotificationFooter({
        manageUrl: `${BASE_URL()}/parametres/notifications`,
        unsubscribeUrl,
        unsubscribeLabel: 'Se dÃ©sabonner de la newsletter',
      })}
    `),
  });
}

async function sendReviewInviteEmail(to, prenom, details = {}) {
  const link = details.reviewUrl || `${BASE_URL()}/avis/${details.token}`;
  return sendMail({
    to,
    subject: details.subject || 'Votre avis vÃ©rifiÃ© sur Troca',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Merci pour votre Ã©change. Vous pouvez maintenant partager votre avis vÃ©rifiÃ© sur <strong>${escapeHtml(details.proName || 'ce professionnel')}</strong>.</p>
      <a class="btn" href="${link}">Laisser un avis</a>
      <p style="color:#6b7280;font-size:13px;">Ce lien est personnel et peut expirer aprÃ¨s un certain dÃ©lai.</p>
    `),
  });
}

function buildRideSummary(details = {}) {
  const departure = escapeHtml(details.departure || 'DÃ©part');
  const destination = escapeHtml(details.destination || 'Destination');
  const date = escapeHtml(details.rideDate || details.ride_date || 'Date libre');
  const time = escapeHtml(String(details.rideTime || details.ride_time || '').slice(0, 5) || 'Heure libre');
  const driver = escapeHtml(details.driverPrenom || details.driver_prenom || 'Conducteur local');
  const seats = Number(details.seats || 1);
  const priceXpf = Number(details.priceXpf || details.price_xpf || 0);

  return `
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Trajet</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${departure} â†’ ${destination}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${date} Â· ${time} Â· ${driver}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${seats} place${seats > 1 ? 's' : ''} Â· ${priceXpf.toLocaleString('fr-FR')} XPF / place</p>
    </div>
  `;
}

function buildBookingSummary(details = {}) {
  const proName = escapeHtml(details.proName || details.pro_company_name || 'Professionnel');
  const subject = escapeHtml(details.subject || 'Rendez-vous');
  const location = escapeHtml(details.locationText || details.location_text || 'Lieu à confirmer');
  const dateLabel = escapeHtml(details.slotLabel || details.when || 'Créneau à venir');
  const commune = escapeHtml(details.commune || details.proCommune || '');

  return `
    <div style="border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px;margin:18px 0;background:#f8fafc;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Rendez-vous</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${subject}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${dateLabel}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${proName}${commune ? ` · ${commune}` : ''}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:14px;">${location}</p>
    </div>
  `;
}

async function sendRideAutoBookingPassengerEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: `âœ… Place rÃ©servÃ©e â€” ${details.departure || 'Trajet'} â†’ ${details.destination || 'Destination'}`,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Votre place est confirmÃ©e !</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir mes rÃ©servations</a>
      <p>Retrouvez les dÃ©tails de ce trajet sur Troca.</p>
    `),
  });
}

async function sendRideAutoBookingDriverEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: `ðŸš— Nouvelle rÃ©servation â€” ${details.departure || 'Trajet'} â†’ ${details.destination || 'Destination'}`,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Une place vient dâ€™Ãªtre rÃ©servÃ©e automatiquement sur votre trajet.</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir mes rÃ©servations</a>
      <p>Le passager a reÃ§u sa confirmation immÃ©diatement.</p>
    `),
  });
}

async function sendRideManualRequestEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: 'ðŸ”” Nouvelle demande de rÃ©servation',
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
    subject: 'ðŸŽ‰ RÃ©servation acceptÃ©e !',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>${escapeHtml(details.driverPrenom || 'Le conducteur')} a acceptÃ© votre demande !</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir les dÃ©tails</a>
    `),
  });
}

async function sendRideBookingAcceptedDriverEmail(to, prenom, details = {}, recipientUserId) {
  const link = `${BASE_URL()}/covoiturage/reservations`;
  return sendMail({
    to,
    subject: 'âœ… RÃ©servation confirmÃ©e',
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Vous avez acceptÃ© la rÃ©servation de ${escapeHtml(details.passengerPrenom || 'ce passager')}.</p>
      ${buildRideSummary(details)}
      <a class="btn" href="${link}">Voir mes rÃ©servations</a>
    `),
  });
}

async function sendRideReviewReminderEmail(to, prenom, details = {}, recipientUserId) {
  const link = details.reviewUrl || `${BASE_URL()}/covoiturage/reservations${details.bookingId ? `?review_booking=${encodeURIComponent(String(details.bookingId))}` : ''}`;
  return sendMail({
    to,
    subject: `✍️ Notez votre conducteur — ${details.departure || 'Trajet'} → ${details.destination || 'Destination'}`,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Votre trajet est terminé. Partagez votre avis pour aider la communauté à voyager en confiance.</p>
      ${buildRideSummary(details)}
      <p>Il ne faut qu'une minute pour noter votre conducteur.</p>
      <a class="btn" href="${link}">Noter mon conducteur</a>
      <p style="color:#6b7280;font-size:13px;">Votre retour aide les autres passagers à réserver en toute confiance.</p>
    `),
  });
}

async function sendProBookingReminderEmail(to, prenom, details = {}, recipientUserId) {
  const reminderLabel = escapeHtml(details.reminderLabel || 'Rappel de rendez-vous');
  const bookingUrl = details.bookingUrl
    || (details.bookingId
      ? `${BASE_URL()}/mes-rdv/${encodeURIComponent(String(details.bookingId))}${details.bookingAccessToken ? `?token=${encodeURIComponent(String(details.bookingAccessToken))}` : ''}`
      : `${BASE_URL()}/mes-rdv`);
  return sendMail({
    to,
    subject: `${reminderLabel} — ${details.subject || 'Votre rendez-vous'}`,
    html: baseTemplate(`
      <p>Bonjour ${escapeHtml(prenom)},</p>
      <p>Votre rendez-vous approche. Voici un rappel pour vous organiser et, si besoin, ouvrir la conversation avant le jour J.</p>
      ${buildBookingSummary(details)}
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
        Pensez à vérifier vos disponibilités, vos documents et le lieu du rendez-vous pour arriver prêt le jour J.
      </p>
      <a class="btn" href="${bookingUrl}">Voir mes rendez-vous</a>
      <p style="color:#6b7280;font-size:13px;">Vous pouvez aussi suivre l&apos;échange dans la messagerie Troca si besoin.</p>
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
  sendNewsletterEmail,
  sendReviewInviteEmail,
  sendRideAutoBookingPassengerEmail,
  sendRideAutoBookingDriverEmail,
  sendRideManualRequestEmail,
  sendRideBookingAcceptedPassengerEmail,
  sendRideBookingAcceptedDriverEmail,
  sendRideReviewReminderEmail,
  sendProBookingReminderEmail,
  sendPerformanceReportEmail,
};

