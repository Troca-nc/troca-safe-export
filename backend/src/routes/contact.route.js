'use strict';

const { Router } = require('express');
const Joi = require('joi');

const { optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendMail } = require('../services/emailService');

const router = Router();

const SUPPORT_EMAIL = process.env.CONTACT_EMAIL || process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || 'contact@troca.nc';
const BASE_URL = process.env.BASE_URL || 'https://troca.nc';

const contactSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().trim().email().max(255).required(),
    category: Joi.string().trim().valid('support', 'annonce', 'pro', 'covoiturage', 'legal', 'security', 'other').default('support'),
    subject: Joi.string().trim().min(5).max(140).required(),
    message: Joi.string().trim().min(20).max(4000).required(),
    website: Joi.string().trim().max(200).allow('', null).optional(),
  }),
};

function categoryLabel(category) {
  return {
    support: 'Support general',
    annonce: 'Annonce / publication',
    pro: 'Compte Pro',
    covoiturage: 'Covoiturage',
    legal: 'Juridique / RGPD',
    security: 'Securite / signalement',
    other: 'Autre',
  }[category] || 'Autre';
}

router.post('/', optionalAuth, validate(contactSchema), async (req, res, next) => {
  try {
    const { name, email, category, subject, message, website } = req.body;

    if (website && String(website).trim()) {
      return res.status(200).json({ data: { ok: true } });
    }

    const displayName = req.user
      ? [req.user.prenom, req.user.nom].filter(Boolean).join(' ').trim() || name
      : name;

    await sendMail({
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Troca] ${subject}`,
      html: `
        <p>Bonjour,</p>
        <p>Un nouveau message a été envoyé depuis le formulaire de contact Troca.</p>
        <ul>
          <li><strong>Nom :</strong> ${displayName}</li>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>Catégorie :</strong> ${categoryLabel(category)}</li>
          <li><strong>Sujet :</strong> ${subject}</li>
          <li><strong>Utilisateur connecté :</strong> ${req.user ? `Oui (#${req.user.id})` : 'Non'}</li>
        </ul>
        <p><strong>Message :</strong></p>
        <div style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#f8fafc;">${String(message)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</div>
        <p style="margin-top:18px;color:#6b7280;font-size:13px;">
          Répondre directement à cet email permettra de contacter ${displayName}.
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:20px;">
          Support: ${SUPPORT_EMAIL} · Troca NC · ${BASE_URL}
        </p>
      `,
      text: [
        `Nom: ${displayName}`,
        `Email: ${email}`,
        `Categorie: ${categoryLabel(category)}`,
        `Sujet: ${subject}`,
        `Utilisateur connecté: ${req.user ? `Oui (#${req.user.id})` : 'Non'}`,
        '',
        'Message:',
        String(message),
        '',
        `Répondre directement à cet email permettra de contacter ${displayName}.`,
        `Base: ${BASE_URL}`,
      ].join('\n'),
    });

    if (email.toLowerCase() !== SUPPORT_EMAIL.toLowerCase()) {
      await sendMail({
        to: email,
        subject: '[Troca] Votre message a bien été envoyé',
        html: `
          <p>Bonjour ${name},</p>
          <p>Nous avons bien reçu votre message concernant <strong>${subject}</strong>.</p>
          <p>Notre équipe reviendra vers vous sous 24 à 48 heures ouvrées.</p>
          <p style="color:#6b7280;font-size:13px;">Catégorie: ${categoryLabel(category)}</p>
          <p style="color:#9ca3af;font-size:12px;">Troca NC · ${BASE_URL}</p>
        `,
      });
    }

    return res.status(201).json({
      data: {
        ok: true,
        message: 'Votre message a bien été envoyé.',
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
