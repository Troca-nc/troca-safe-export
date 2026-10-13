'use strict';

const crypto = require('crypto');
const twilio = require('twilio');
const { query } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { isConfiguredValue } = require('../config/env');
const { sendMail } = require('./emailService');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 10 * 60 * 1000;
const RESEND_MAX = 3;
const DEMO_OTP_CODE = '123456';

const fallbackOtpStore = new Map();
const fallbackResendStore = new Map();

function normalizePhoneNumber(telephone) {
  const raw = String(telephone || '').trim().replace(/\s+/g, '');
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('687')) return `+${digits}`;
  return `+687${digits.replace(/^0+/, '')}`;
}

function maskPhoneNumber(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) return '';
  const digits = normalized.replace(/\D/g, '');
  if (digits.length <= 4) return normalized;
  const visible = digits.slice(-2);
  return `${normalized.slice(0, 4)}${'•'.repeat(Math.max(4, digits.length - 6))}${visible}`;
}

function maskEmail(email) {
  const value = String(email || '').trim();
  if (!value || !value.includes('@')) return value || '';
  const [local, domain] = value.split('@');
  if (!local) return `***@${domain}`;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFallbackOtpEmail({ firstName, code, maskedEmail, maskedPhone, baseUrl }) {
  const normalizedFirstName = String(firstName || '').trim().replace(/\s+/g, ' ');
  const safeFirstName = escapeHtml(normalizedFirstName);
  const safeCode = escapeHtml(code);
  const safeEmail = escapeHtml(maskedEmail);
  const safePhone = escapeHtml(maskedPhone);
  const safeBaseUrl = escapeHtml(String(baseUrl || 'https://kalico.nc').replace(/\/$/, ''));
  const greeting = safeFirstName ? `Bonjour ${safeFirstName},` : 'Bonjour,';
  const textGreeting = normalizedFirstName ? `Bonjour ${normalizedFirstName},` : 'Bonjour,';

  return {
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code de vérification Kalico</title>
</head>
<body style="margin:0;padding:0;background:#FBF6EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#123A44;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FBF6EC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FEFAF3;border:1px solid #E4D7C3;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(18,58,68,.10);">
          <tr>
            <td style="padding:26px 30px;background:#123A44;">
              <img src="${safeBaseUrl}/brand/kalico1.svg" width="126" alt="Kalico" style="display:block;max-width:126px;height:auto;border:0;color:#FEFAF3;font-size:22px;font-weight:700;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px 30px 26px;">
              <p style="margin:0 0 16px;font-size:17px;line-height:1.6;color:#123A44;">${greeting}</p>
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;color:#123A44;">Confirmez votre adresse e-mail</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#365D65;">Saisissez ce code dans Kalico pour confirmer votre e-mail. Votre téléphone restera non vérifié tant qu’un code reçu par SMS n’aura pas été validé.</p>
              <div style="margin:0 0 22px;padding:20px;text-align:center;background:#F3E9D8;border:1px solid #E4D7C3;border-radius:14px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9E4E06;">Votre code</p>
                <p style="margin:0;font-size:36px;line-height:1;font-weight:800;letter-spacing:.16em;color:#123A44;">${safeCode}</p>
              </div>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#365D65;">Ce code est valable pendant <strong style="color:#123A44;">10 minutes</strong>.</p>
              <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:#58757B;">E-mail : ${safeEmail}<br>Téléphone : ${safePhone}</p>
              <div style="padding:14px 16px;background:#FBF6EC;border-left:4px solid #E8832A;border-radius:10px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#365D65;">Vous n’êtes pas à l’origine de cette demande ? Ignorez simplement cet e-mail. Ne communiquez jamais ce code à une autre personne.</p>
              </div>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#123A44;">À très vite,<br><strong>L’équipe Kalico</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 30px;background:#F3E9D8;border-top:1px solid #E4D7C3;font-size:12px;line-height:1.6;color:#58757B;text-align:center;">Kalico — La plateforme locale de Nouvelle-Calédonie</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `${textGreeting}\n\nVotre code de confirmation e-mail Kalico est : ${code}\n\nIl est valable pendant 10 minutes. Votre téléphone restera non vérifié tant qu'un code reçu par SMS n'aura pas été validé.\nE-mail : ${maskedEmail}\nTéléphone renseigné : ${maskedPhone}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et ne communiquez jamais ce code.\n\nÀ très vite,\nL'équipe Kalico`,
  };
}

async function resolveOtpFirstName(user) {
  const directName = String(user?.prenom || '').trim();
  if (directName) return directName;
  if (!user?.id) return '';

  try {
    const result = await query('SELECT prenom FROM users WHERE id = $1 LIMIT 1', [user.id]);
    return String(result.rows[0]?.prenom || '').trim();
  } catch {
    return '';
  }
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function buildOtpKey(telephone) {
  return `phone:otp:${telephone}`;
}

function buildResendKey(telephone) {
  return `phone:otp:resend:${telephone}`;
}

function buildTwilioClient() {
  if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
    return null;
  }
  if (!isConfiguredValue(process.env.TWILIO_ACCOUNT_SID) || !isConfiguredValue(process.env.TWILIO_AUTH_TOKEN)) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim());
}

const twilioClient = buildTwilioClient();
const VERIFY_SID = isConfiguredValue(process.env.TWILIO_VERIFY_SID) ? process.env.TWILIO_VERIFY_SID.trim() : '';

function getOtpRecordFromCache(store, key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry;
}

async function loadOtpRecord(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) return null;

  const client = await getRedisClient();
  if (client) {
    try {
      const raw = await client.get(buildOtpKey(normalized));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.code || !parsed?.expiresAt || Date.now() > Date.parse(parsed.expiresAt)) {
        await client.del(buildOtpKey(normalized)).catch(() => {});
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  return getOtpRecordFromCache(fallbackOtpStore, buildOtpKey(normalized));
}

async function clearOtpRecord(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) return;

  const client = await getRedisClient();
  if (client) {
    await client.del(buildOtpKey(normalized)).catch(() => {});
    return;
  }

  fallbackOtpStore.delete(buildOtpKey(normalized));
}

async function storeOtpRecord({ telephone, code, userId, channel, expiresAt }) {
  const normalized = normalizePhoneNumber(telephone);
  const payload = {
    code,
    userId: Number(userId || 0) || null,
    telephone: normalized,
    channel,
    expiresAt,
  };

  const client = await getRedisClient();
  if (client) {
    await client.set(buildOtpKey(normalized), JSON.stringify(payload), { PX: Math.max(1, expiresAt.getTime() - Date.now()) });
    return payload;
  }

  fallbackOtpStore.set(buildOtpKey(normalized), { ...payload, expiresAt: expiresAt.getTime() });
  return payload;
}

async function recordResendAttempt(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  const key = buildResendKey(normalized);

  const client = await getRedisClient();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, Math.ceil(RESEND_WINDOW_MS / 1000));
    }

    if (count > RESEND_MAX) {
      const retryAfter = Number(await client.ttl(key));
      return {
        allowed: false,
        count,
        retryAfter: retryAfter > 0 ? retryAfter : Math.ceil(RESEND_WINDOW_MS / 1000),
      };
    }

    return { allowed: true, count, retryAfter: 0 };
  }

  const entry = getOtpRecordFromCache(fallbackResendStore, key) || { count: 0, expiresAt: Date.now() + RESEND_WINDOW_MS };
  entry.count += 1;
  entry.expiresAt = Date.now() + RESEND_WINDOW_MS;
  fallbackResendStore.set(key, entry);

  if (entry.count > RESEND_MAX) {
    return {
      allowed: false,
      count: entry.count,
      retryAfter: Math.ceil((entry.expiresAt - Date.now()) / 1000),
    };
  }

  return { allowed: true, count: entry.count, retryAfter: 0 };
}

async function updateUserPhone(userId, telephone) {
  await query(
    `UPDATE users SET telephone = $1, phone_verified = FALSE, updated_at = NOW() WHERE id = $2`,
    [telephone, userId]
  );
}

async function verifyStoredOtp({ telephone, code, userId }) {
  const record = await loadOtpRecord(telephone);
  if (!record) return null;
  if (record.userId && Number(record.userId) !== Number(userId)) return null;
  if (String(record.code) !== String(code)) return null;

  await clearOtpRecord(telephone);

  if (record.channel === 'email') {
    await query(
      `UPDATE users
       SET telephone = $1, phone_verified = FALSE, email_verified = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [normalizePhoneNumber(telephone), userId]
    );

    return {
      verified: true,
      verification_target: 'email',
      email_verified: true,
      phone_verified: false,
      message: 'Adresse e-mail vérifiée. Le téléphone reste non vérifié.',
      channel: 'email',
    };
  }

  if (record.channel !== 'sms') return null;

  await query(
    `UPDATE users
     SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
     WHERE id = $2`,
    [normalizePhoneNumber(telephone), userId]
  );

  return {
    verified: true,
    verification_target: 'phone',
    phone_verified: true,
    message: 'Téléphone vérifié avec succès',
    channel: 'sms',
  };
}

async function sendFallbackEmailOtp({ user, telephone, code, reason }) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const maskedEmail = maskEmail(user.email);
  const maskedPhone = maskPhoneNumber(telephone);
  const firstName = await resolveOtpFirstName(user);
  const email = buildFallbackOtpEmail({
    firstName,
    code,
    maskedEmail,
    maskedPhone,
    baseUrl: process.env.BASE_URL || 'https://kalico.nc',
  });
  const subject = reason === 'resend'
    ? 'Votre code de confirmation e-mail Kalico'
    : 'Votre code de confirmation e-mail Kalico';

  await sendMail({
    to: user.email,
    subject,
    html: email.html,
    text: email.text,
  });

  return {
    success: true,
    channel: 'email',
    masked: maskedEmail,
    expires_at: expiresAt.toISOString(),
    cooldown: 60,
    message: 'Code de confirmation envoyé par e-mail',
  };
}

async function sendSmsOtp(telephone) {
  if (!twilioClient || !VERIFY_SID) {
    const error = new Error('TWILIO_NOT_CONFIGURED');
    error.code = 'TWILIO_NOT_CONFIGURED';
    throw error;
  }

  await twilioClient.verify.v2.services(VERIFY_SID)
    .verifications.create({ to: telephone, channel: 'sms' });

  return {
    success: true,
    channel: 'sms',
    masked: maskPhoneNumber(telephone),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    cooldown: 60,
    message: 'Code SMS envoyé',
  };
}

async function sendPhoneOtp({ user, telephone, preferChannel = 'sms', reason = 'send' }) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) {
    const error = new Error('Numéro de téléphone invalide');
    error.status = 400;
    error.code = 'PHONE_INVALID';
    throw error;
  }

  await updateUserPhone(user.id, normalized);

  if (preferChannel === 'email') {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await storeOtpRecord({
      telephone: normalized,
      code,
      userId: user.id,
      channel: 'email',
      expiresAt,
    });
    return sendFallbackEmailOtp({ user, telephone: normalized, code, reason: reason || 'send' });
  }

  if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await storeOtpRecord({
      telephone: normalized,
      code: DEMO_OTP_CODE,
      userId: user.id,
      channel: 'sms',
      expiresAt,
    });

    return {
      success: true,
      channel: 'sms',
      masked: maskPhoneNumber(normalized),
      expires_at: expiresAt.toISOString(),
      cooldown: 60,
      message: 'Code SMS envoye',
    };
  }

  try {
    return await sendSmsOtp(normalized);
  } catch (err) {
    console.error(`[phone] Twilio send error${err?.code ? ` (${err.code})` : ''}:`, err.message);
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await storeOtpRecord({
      telephone: normalized,
      code,
      userId: user.id,
      channel: 'email',
      expiresAt,
    });
    return sendFallbackEmailOtp({ user, telephone: normalized, code, reason: reason || 'send' });
  }
}

async function resendPhoneOtp({ user, telephone, preferChannel = 'sms' }) {
  const normalized = normalizePhoneNumber(telephone);
  const limit = await recordResendAttempt(normalized);
  if (!limit.allowed) {
    const error = new Error('Trop de demandes de renvoi. Réessayez plus tard.');
    error.status = 429;
    error.retryAfter = limit.retryAfter;
    error.code = 'OTP_RESEND_LIMIT';
    throw error;
  }

  return sendPhoneOtp({ user, telephone: normalized, preferChannel, reason: 'resend' });
}

async function verifyPhoneOtp({ user, telephone, code }) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) {
    const error = new Error('Numéro de téléphone invalide');
    error.status = 400;
    error.code = 'PHONE_INVALID';
    throw error;
  }

  const stored = await loadOtpRecord(normalized);
  if (stored) {
    if (
      String(stored.code) !== String(code)
      || (stored.userId && Number(stored.userId) !== Number(user.id))
    ) {
      const error = new Error('Code incorrect ou expiré');
      error.status = 400;
      error.code = 'OTP_INVALID';
      throw error;
    }

    await clearOtpRecord(normalized);

    if (stored.channel === 'email') {
      await query(
        `UPDATE users
         SET telephone = $1, phone_verified = FALSE, email_verified = TRUE, updated_at = NOW()
         WHERE id = $2`,
        [normalized, user.id]
      );

      return {
        verified: true,
        verification_target: 'email',
        email_verified: true,
        phone_verified: false,
        message: 'Adresse e-mail vérifiée. Le téléphone reste non vérifié.',
        channel: 'email',
      };
    }

    if (stored.channel !== 'sms') {
      const error = new Error('Canal de vérification invalide');
      error.status = 400;
      error.code = 'OTP_CHANNEL_INVALID';
      throw error;
    }

    await query(
      `UPDATE users
       SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [normalized, user.id]
    );

    return {
      verified: true,
      verification_target: 'phone',
      phone_verified: true,
      message: 'Téléphone vérifié avec succès',
      channel: 'sms',
    };
  }

  if (!twilioClient || !VERIFY_SID) {
    const error = new Error('Vérification téléphone non configurée');
    error.status = 503;
    error.code = 'TWILIO_NOT_CONFIGURED';
    throw error;
  }

  const check = await twilioClient.verify.v2.services(VERIFY_SID)
    .verificationChecks.create({ to: normalized, code });

  if (check.status !== 'approved') {
    const error = new Error('Code incorrect ou expiré');
    error.status = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  await clearOtpRecord(normalized);
  await query(
    `UPDATE users
     SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
     WHERE id = $2`,
    [normalized, user.id]
  );

  return {
    verified: true,
    verification_target: 'phone',
    phone_verified: true,
    message: 'Téléphone vérifié avec succès',
    channel: 'sms',
  };
}

module.exports = {
  OTP_TTL_MS,
  RESEND_MAX,
  RESEND_WINDOW_MS,
  buildFallbackOtpEmail,
  buildOtpKey,
  buildResendKey,
  clearOtpRecord,
  generateOtpCode,
  maskEmail,
  maskPhoneNumber,
  normalizePhoneNumber,
  recordResendAttempt,
  resendPhoneOtp,
  sendPhoneOtp,
  sendSmsOtp,
  storeOtpRecord,
  verifyPhoneOtp,
  verifyStoredOtp,
};
