'use strict';

const express = require('express');
const Joi = require('joi');

const { query, withTransaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');

const router = express.Router();

const STEPS = [
  { step_key: 'profile_complete', title: 'Complétez vos infos', points: 1 },
  { step_key: 'logo_added', title: 'Ajoutez votre logo', points: 1 },
  { step_key: 'storefront_complete', title: 'Soignez votre vitrine', points: 1 },
  { step_key: 'first_listing', title: 'Publiez votre première annonce', points: 1 },
  { step_key: 'booking_quote_ready', title: 'Préparez vos rendez-vous et devis', points: 1 },
  { step_key: 'stats_followup', title: 'Suivez vos statistiques', points: 1 },
];

const STEP_KEY_SET = new Set(STEPS.map((step) => step.step_key));

const scheduleCallSchema = Joi.object({
  call_scheduled_at: Joi.date().iso().required(),
  call_phone: Joi.string().trim().max(30).allow('', null).optional(),
  call_notes: Joi.string().trim().max(1000).allow('', null).optional(),
});

const completeStepSchema = Joi.object({
  step_key: Joi.string().trim().valid(...STEPS.map((step) => step.step_key)).required(),
});

function normalizeMaybeText(value) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCompanyName(row) {
  return row.pro_company_name || [row.prenom, row.nom].filter(Boolean).join(' ').trim() || 'Professionnel Kalico';
}

function getBaseUrl() {
  return (process.env.BASE_URL || 'https://kalico.nc').replace(/\/+$/, '');
}

function formatDateTime(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));
}

async function requirePro(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'Connexion requise.' });
    return false;
  }
  if (!req.user.is_pro) {
    res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    return false;
  }
  return true;
}

async function ensureLaunchPack(client, proId) {
  const packRes = await client.query(
    `INSERT INTO pro_launch_packs (pro_id)
     VALUES ($1)
     ON CONFLICT (pro_id)
     DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [proId]
  );

  const pack = packRes.rows[0];

  for (const step of STEPS) {
    await client.query(
      `INSERT INTO pro_onboarding_steps (pack_id, pro_id, step_key, title, points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pro_id, step_key)
       DO UPDATE SET
         pack_id = EXCLUDED.pack_id,
         title = EXCLUDED.title,
         points = EXCLUDED.points,
         updated_at = NOW()`,
      [pack.id, proId, step.step_key, step.title, step.points]
    );
  }

  return pack;
}

async function loadLaunchPackSnapshot(client, proId) {
  const profileRes = await client.query(
    `SELECT
       u.id,
       u.prenom,
       u.nom,
       u.email,
       u.pro_company_name,
       u.pro_category,
       u.pro_description,
       u.pro_commune,
       u.pro_website,
       u.pro_phone,
       u.pro_hours,
       u.pro_siret,
       u.pro_logo_url,
       u.pro_banner_url,
       u.pro_quote_template,
       COALESCE((
         SELECT COUNT(*)::int
         FROM annonces a
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
       ), 0) AS listing_count,
       COALESCE((
         SELECT COUNT(*)::int
         FROM products p
         WHERE p.owner_id = u.id
           AND p.is_active = TRUE
           AND p.archived_at IS NULL
       ), 0) AS product_count,
       EXISTS(
         SELECT 1
         FROM pro_booking_settings bs
         WHERE bs.pro_id = u.id
           AND bs.is_enabled = TRUE
       ) AS booking_enabled,
       COALESCE((
         SELECT COUNT(*)::int
         FROM pro_booking_slots ps
         WHERE ps.pro_id = u.id
       ), 0) AS booking_slots_count,
       COALESCE((
         SELECT SUM(COALESCE(pls.total_views, 0))::int
         FROM annonces a
         LEFT JOIN pro_listing_stats pls ON pls.listing_id = a.id
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
       ), 0) AS views_total,
       COALESCE((
         SELECT SUM(COALESCE(pls.total_contacts, 0))::int
         FROM annonces a
         LEFT JOIN pro_listing_stats pls ON pls.listing_id = a.id
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
       ), 0) AS contacts_total,
       COALESCE((
         SELECT COUNT(*)::int
         FROM annonces a
         JOIN pro_listing_stats pls ON pls.listing_id = a.id
         WHERE a.user_id = u.id
           AND a.status = 'active'
           AND a.deleted_at IS NULL
           AND pls.is_boosted = TRUE
           AND pls.expires_at > NOW()
       ), 0) AS boosted_active_count
     FROM users u
     WHERE u.id = $1
       AND u.is_pro = TRUE
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [proId]
  );

  const profile = profileRes.rows[0];
  if (!profile) {
    return null;
  }

  const packRes = await client.query(
    `SELECT
       id,
       pro_id,
       status,
       call_scheduled_at,
       call_phone,
       call_notes,
       completed_at,
       expires_at,
       created_at,
       updated_at
     FROM pro_launch_packs
     WHERE pro_id = $1
     LIMIT 1`,
    [proId]
  );

  const stepsRes = await client.query(
    `SELECT
       id,
       pack_id,
       pro_id,
       step_key,
       title,
       points,
       completed_at,
       created_at,
       updated_at
     FROM pro_onboarding_steps
     WHERE pro_id = $1
     ORDER BY id ASC`,
    [proId]
  );

  return {
    profile,
    pack: packRes.rows[0] || null,
    steps: stepsRes.rows,
  };
}

function shouldAutoCompleteStep(stepKey, snapshot) {
  const profile = snapshot.profile;
  const launchTemplate = profile.pro_quote_template && typeof profile.pro_quote_template === 'object'
    ? profile.pro_quote_template
    : {};
  const templateCustom = Object.keys(launchTemplate).length > 0;

  switch (stepKey) {
    case 'profile_complete':
      return Boolean(
        profile.pro_company_name
        && profile.pro_category
        && profile.pro_description
        && profile.pro_commune
        && profile.pro_phone
        && profile.pro_hours
      );
    case 'logo_added':
      return Boolean(profile.pro_logo_url && profile.pro_banner_url);
    case 'storefront_complete':
      return Boolean(profile.pro_description && profile.pro_website && profile.pro_hours);
    case 'first_listing':
      return Number(profile.listing_count ?? 0) > 0;
    case 'booking_quote_ready':
      return Boolean(
        Number(profile.booking_slots_count ?? 0) > 0
        && Boolean(profile.booking_enabled)
        && templateCustom
      );
    case 'stats_followup':
      return Boolean(
        Number(profile.listing_count ?? 0) > 0
        && (
          Number(profile.views_total ?? 0) > 0
          || Number(profile.contacts_total ?? 0) > 0
          || Number(profile.boosted_active_count ?? 0) > 0
        )
      );
    default:
      return false;
  }
}

function enrichStep(stepRow) {
  const definition = STEPS.find((item) => item.step_key === stepRow.step_key);
  return {
    step_key: stepRow.step_key,
    title: stepRow.title || definition?.title || stepRow.step_key,
    points: Number(stepRow.points ?? definition?.points ?? 1),
    completed_at: stepRow.completed_at ?? null,
    completed: Boolean(stepRow.completed_at),
    href: definition?.step_key === 'profile_complete'
      ? '/pro/dashboard/parametres'
      : definition?.step_key === 'logo_added'
        ? '/pro/dashboard/parametres'
        : definition?.step_key === 'storefront_complete'
          ? '/pro/dashboard/parametres'
          : definition?.step_key === 'first_listing'
            ? '/pro/dashboard/annonces'
            : definition?.step_key === 'booking_quote_ready'
              ? '/pro/dashboard/rdv'
              : '/pro/dashboard#stats',
    cta: definition?.step_key === 'profile_complete'
      ? 'Renseigner le profil'
      : definition?.step_key === 'logo_added'
        ? 'Importer un logo'
        : definition?.step_key === 'storefront_complete'
          ? 'Personnaliser'
          : definition?.step_key === 'first_listing'
            ? 'Voir mes annonces'
            : definition?.step_key === 'booking_quote_ready'
              ? 'Voir les rendez-vous'
              : 'Voir les statistiques',
    description: definition?.step_key === 'profile_complete'
      ? 'Ajoutez le nom de votre entreprise, votre commune et vos coordonnées.'
      : definition?.step_key === 'logo_added'
        ? 'Une identité visuelle claire rassure et rend votre vitrine plus mémorable.'
        : definition?.step_key === 'storefront_complete'
          ? 'Rédigez une description courte, vos horaires et votre site web.'
          : definition?.step_key === 'first_listing'
            ? 'Mettez en ligne une offre claire pour commencer à attirer des contacts.'
            : definition?.step_key === 'booking_quote_ready'
              ? 'Activez la réservation et préparez votre template de devis.'
              : 'Consultez vos vues, contacts et performances pour piloter votre activité.',
    highlighted: stepRow.step_key === 'stats_followup',
  };
}

function formatLaunchPackPayload(snapshot) {
  const steps = snapshot.steps.map(enrichStep);
  const completedSteps = steps.filter((step) => step.completed);
  const completedPoints = completedSteps.reduce((sum, step) => sum + Number(step.points ?? 1), 0);
  const totalPoints = steps.reduce((sum, step) => sum + Number(step.points ?? 1), 0);
  const nextStep = steps.find((step) => !step.completed) || null;
  const completionRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return {
    pack: snapshot.pack,
    pro: {
      id: Number(snapshot.profile.id),
      name: formatCompanyName(snapshot.profile),
      email: snapshot.profile.email,
      commune: snapshot.profile.pro_commune || null,
    },
    steps,
    progress: {
      completed_steps: completedSteps.length,
      total_steps: steps.length,
      completed_points: completedPoints,
      total_points: totalPoints,
      completion_rate: completionRate,
      is_completed: snapshot.pack?.status === 'completed',
    },
    next_step: nextStep,
    stats: {
      listing_count: Number(snapshot.profile.listing_count ?? 0),
      product_count: Number(snapshot.profile.product_count ?? 0),
      views_total: Number(snapshot.profile.views_total ?? 0),
      contacts_total: Number(snapshot.profile.contacts_total ?? 0),
      boosted_active_count: Number(snapshot.profile.boosted_active_count ?? 0),
      booking_slots_count: Number(snapshot.profile.booking_slots_count ?? 0),
      booking_enabled: Boolean(snapshot.profile.booking_enabled),
    },
    profile: {
      company_name: snapshot.profile.pro_company_name || null,
      category: snapshot.profile.pro_category || null,
      description: snapshot.profile.pro_description || null,
      commune: snapshot.profile.pro_commune || null,
      website: snapshot.profile.pro_website || null,
      phone: snapshot.profile.pro_phone || null,
      hours: snapshot.profile.pro_hours || null,
      siret: snapshot.profile.pro_siret || null,
      logo_url: snapshot.profile.pro_logo_url || null,
      banner_url: snapshot.profile.pro_banner_url || null,
      quote_template: snapshot.profile.pro_quote_template || {},
    },
  };
}

async function autoCompleteSteps(client, proId, snapshot) {
  const updates = [];

  for (const step of snapshot.steps) {
    if (step.completed_at) continue;
    if (!STEP_KEY_SET.has(step.step_key)) continue;
    if (!shouldAutoCompleteStep(step.step_key, snapshot)) continue;
    updates.push(step.step_key);
  }

  for (const stepKey of updates) {
    await client.query(
      `UPDATE pro_onboarding_steps
       SET completed_at = NOW(),
           updated_at = NOW()
       WHERE pro_id = $1
         AND step_key = $2
         AND completed_at IS NULL`,
      [proId, stepKey]
    );
  }

  return updates.length > 0;
}

async function finalizePackIfNeeded(client, proId, snapshot, payload) {
  if (snapshot.pack?.status === 'completed') {
    return false;
  }

  const allComplete = payload.progress.completed_steps >= payload.progress.total_steps
    && payload.progress.total_steps > 0;
  if (!allComplete) {
    return false;
  }

  const result = await client.query(
    `UPDATE pro_launch_packs
     SET status = 'completed',
         completed_at = COALESCE(completed_at, NOW()),
         updated_at = NOW()
     WHERE pro_id = $1
       AND status <> 'completed'
     RETURNING id, pro_id, status, completed_at, expires_at`,
    [proId]
  );

  if (!result.rows[0]) {
    return false;
  }

  return true;
}

async function notifyCompletion(snapshot, payload) {
  const proLabel = payload.pro.name;
  const dashboardLink = `${getBaseUrl()}/pro/dashboard/pack-lancement`;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;

  await Promise.all([
    sendMail({
      to: snapshot.profile.email,
      subject: '🎉 Votre pack de lancement Kalico est terminé',
      html: `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-weight:700;font-size:20px;">Kalico</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour ${escapeHtml(proLabel)},</p>
      <p>Bravo, votre pack de lancement est terminé. Votre vitrine Pro est prête à convertir.</p>
      <ul>
        <li>Profil complété</li>
        <li>Vitrine personnalisée</li>
        <li>Première annonce publiée</li>
        <li>Catalogue activé</li>
        <li>Rendez-vous et devis prêts</li>
        <li>Statistiques suivies</li>
      </ul>
      <p><a href="${dashboardLink}" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Voir mon pack</a></p>
    </div>
  </div>
</body></html>`,
    }).catch(() => {}),
    createNotification(snapshot.profile.id, {
      type: 'pro_launch_pack_completed',
      title: '🎉 Pack de lancement terminé',
      body: 'Votre vitrine Pro est prête à convertir.',
      href: '/pro/dashboard/pack-lancement',
    }).catch(() => {}),
    sendPushToUser(snapshot.profile.id, {
      title: '🎉 Pack de lancement terminé',
      body: 'Votre vitrine Pro est prête à convertir.',
      data: { type: 'pro_launch_pack_completed' },
    }).catch(() => {}),
    adminEmail ? sendMail({
      to: adminEmail,
      subject: `Pack de lancement complété - ${proLabel}`,
      html: `<p>Le pack de lancement Pro de <strong>${escapeHtml(proLabel)}</strong> vient d'être complété.</p><p>Email: ${escapeHtml(snapshot.profile.email || '')}</p>`,
    }).catch(() => {}) : Promise.resolve(),
  ]);
}

async function getLaunchPackData(proId) {
  return withTransaction(async (client) => {
    const pack = await ensureLaunchPack(client, proId);
    let snapshot = await loadLaunchPackSnapshot(client, proId);
    if (!snapshot) {
      return null;
    }

    await autoCompleteSteps(client, proId, snapshot);
    snapshot = await loadLaunchPackSnapshot(client, proId);
    if (!snapshot) {
      return null;
    }

    const payload = formatLaunchPackPayload({
      ...snapshot,
      pack,
    });

    const packFinalized = await finalizePackIfNeeded(client, proId, snapshot, payload);
    if (packFinalized) {
      snapshot = await loadLaunchPackSnapshot(client, proId);
      if (!snapshot) {
        return null;
      }
    }

    const finalPayload = formatLaunchPackPayload(snapshot);
    finalPayload.pack = snapshot.pack;

    return {
      snapshot,
      payload: finalPayload,
      packFinalized,
    };
  });
}

router.get('/launch-pack', authenticate, async (req, res, next) => {
  try {
    if (!await requirePro(req, res)) return;

    const result = await getLaunchPackData(req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Pack de lancement introuvable.' });
    }

    if (result.packFinalized) {
      await notifyCompletion(result.snapshot, result.payload);
    }

    return res.json({ data: result.payload });
  } catch (err) {
    next(err);
  }
});

router.post('/launch-pack/schedule-call', authenticate, async (req, res, next) => {
  try {
    if (!await requirePro(req, res)) return;
    const { error, value } = scheduleCallSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const scheduledAt = new Date(value.call_scheduled_at);
    if (Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ error: 'Date de rendez-vous invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const pack = await ensureLaunchPack(client, req.user.id);
      await client.query(
        `UPDATE pro_launch_packs
         SET call_scheduled_at = $2,
             call_phone = $3,
             call_notes = $4,
             updated_at = NOW()
         WHERE pro_id = $1
         RETURNING id`,
        [
          req.user.id,
          scheduledAt.toISOString(),
          normalizeMaybeText(value.call_phone),
          normalizeMaybeText(value.call_notes),
        ]
      );

      return loadLaunchPackSnapshot(client, req.user.id).then((snapshot) => ({
        pack,
        snapshot,
      }));
    });

    if (!result.snapshot) {
      return res.status(404).json({ error: 'Pack de lancement introuvable.' });
    }

    const payload = formatLaunchPackPayload(result.snapshot);
    const proLabel = payload.pro.name;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
    const callDateLabel = formatDateTime(result.snapshot.pack?.call_scheduled_at);
    const teamMail = adminEmail ? sendMail({
      to: adminEmail,
      subject: `Appel onboarding planifié - ${proLabel}`,
      html: `<p><strong>${escapeHtml(proLabel)}</strong> a planifié un appel onboarding.</p><p>Date: ${escapeHtml(callDateLabel || 'Non précisée')}</p><p>Téléphone: ${escapeHtml(result.snapshot.pack?.call_phone || 'Non renseigné')}</p><p>Notes: ${escapeHtml(result.snapshot.pack?.call_notes || 'Aucune')}</p>`,
    }).catch(() => {}) : Promise.resolve();

    await Promise.all([
      sendMail({
        to: result.snapshot.profile.email,
        subject: 'Votre appel onboarding Kalico est planifié',
        html: `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#0A7EA4;padding:24px 28px;color:#fff;font-weight:700;font-size:20px;">Kalico</div>
    <div style="padding:28px;color:#1f2937;line-height:1.6;">
      <p>Bonjour ${escapeHtml(proLabel)},</p>
      <p>Votre appel onboarding a bien été enregistré.</p>
      <p><strong>Date :</strong> ${escapeHtml(callDateLabel || 'Non précisée')}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(result.snapshot.pack?.call_phone || 'Non renseigné')}</p>
      <p><strong>Notes :</strong> ${escapeHtml(result.snapshot.pack?.call_notes || 'Aucune')}</p>
      <p><a href="${getBaseUrl()}/pro/dashboard/pack-lancement" style="display:inline-block;background:#0A7EA4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Voir mon pack</a></p>
    </div>
  </div>
</body></html>`,
      }).catch(() => {}),
      createNotification(result.snapshot.profile.id, {
        type: 'pro_launch_pack_call',
        title: '📞 Appel onboarding planifié',
        body: callDateLabel ? `Votre appel est prévu le ${callDateLabel}` : 'Votre appel onboarding a été enregistré.',
        href: '/pro/dashboard/pack-lancement',
      }).catch(() => {}),
      sendPushToUser(result.snapshot.profile.id, {
        title: '📞 Appel onboarding planifié',
        body: callDateLabel ? `Votre appel est prévu le ${callDateLabel}` : 'Votre appel onboarding a été enregistré.',
        data: { type: 'pro_launch_pack_call' },
      }).catch(() => {}),
      teamMail,
    ]);

    return res.json({ data: formatLaunchPackPayload(result.snapshot) });
  } catch (err) {
    next(err);
  }
});

router.post('/onboarding/complete-step', authenticate, async (req, res, next) => {
  try {
    if (!await requirePro(req, res)) return;

    const { error, value } = completeStepSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await withTransaction(async (client) => {
      await ensureLaunchPack(client, req.user.id);

      await client.query(
        `UPDATE pro_onboarding_steps
         SET completed_at = COALESCE(completed_at, NOW()),
             updated_at = NOW()
         WHERE pro_id = $1
           AND step_key = $2`,
        [req.user.id, value.step_key]
      );

      let snapshot = await loadLaunchPackSnapshot(client, req.user.id);
      if (!snapshot) {
        return null;
      }

      await autoCompleteSteps(client, req.user.id, snapshot);
      snapshot = await loadLaunchPackSnapshot(client, req.user.id);
      if (!snapshot) {
        return null;
      }

      const payload = formatLaunchPackPayload(snapshot);
      const packFinalized = await finalizePackIfNeeded(client, req.user.id, snapshot, payload);

      if (packFinalized) {
        snapshot = await loadLaunchPackSnapshot(client, req.user.id);
      }

      return {
        snapshot,
        payload: formatLaunchPackPayload(snapshot),
        packFinalized,
      };
    });

    if (!result) {
      return res.status(404).json({ error: 'Pack de lancement introuvable.' });
    }

    if (result.packFinalized) {
      await notifyCompletion(result.snapshot, result.payload);
    }

    return res.json({ data: result.payload });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.ensureLaunchPack = ensureLaunchPack;
