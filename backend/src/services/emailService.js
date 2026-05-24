'use strict';

// ============================================================
//  Troca — Service Email (nodemailer)
//  Centralise tous les envois transactionnels du backend
// ============================================================

const nodemailer = require('nodemailer');
const { isConfiguredValue } = require('../config/env');

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
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
        <a href="${unsubLink}" style="color:#9ca3af;">Se désabonner de cette alerte</a>
      </p>
    `),
  });
}

/**
 * Email notification nouveau message
 */
async function sendNewMessageEmail(to, prenom, senderName, annonceTitle, convId) {
  const link = `${BASE_URL()}/messages/${convId}`;
  return sendMail({
    to,
    subject: `${senderName} vous a envoyé un message sur Troca`,
    html: baseTemplate(`
      <p>Bonjour ${prenom},</p>
      <p><strong>${senderName}</strong> vous a envoyé un message concernant l'annonce <strong>"${annonceTitle}"</strong>.</p>
      <a class="btn" href="${link}">Lire le message</a>
      <p style="color:#6b7280;font-size:13px;">Vous recevez cet email car vous avez une conversation active sur Troca.</p>
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
};
