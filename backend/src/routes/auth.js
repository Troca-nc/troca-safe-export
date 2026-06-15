// ============================================================
//  Routes — Authentification
//  POST /api/auth/register
//  POST /api/auth/login
//  POST /api/auth/refresh
//  GET  /api/auth/me
//  POST /api/auth/logout
//  POST /api/auth/forgot-password
//  POST /api/auth/reset-password
// ============================================================

const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verificationLimiter,
  phoneLimiter,
  refreshLimiter,
} = require('../middleware/rateLimit');
const { sendWelcomeEmail, sendVerificationEmail } = require('../services/emailService');
const { verifyTurnstileToken } = require('../services/turnstile');
const { query } = require('../config/database');
const { verifyCsrf } = require('../middleware/csrf');
const { setSecureCookie, clearSecureCookie, getCookieValue } = require('../config/cookies');
const { getRefreshExpiresMs } = require('../config/jwt');
const { deliverPasswordReset } = require('../services/passwordResetDeliveryService');
const {
  normalizePhoneNumber,
  resendPhoneOtp,
} = require('../services/phoneOtpService');
const {
  confirmEmail,
  deleteRefreshToken,
  findUserByIdentifier,
  findUserById,
  loginAccount,
  refreshSessionWithRotation,
  registerAccount,
  resendVerification,
  requestPasswordResetForUser,
  resetPasswordWithToken,
} = require('../services/authAccountService');
const { addToTokenBlacklist } = require('../services/tokenService');

const router = express.Router();
const REFRESH_COOKIE_NAME = 'kalico_refresh_token';

const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(100).required(),
  prenom: Joi.string().min(1).max(100).required(),
  nom: Joi.string().min(1).max(100).required(),
  commune_id: Joi.number().integer().optional(),
  telephone: Joi.string().pattern(/^(\+687|0)[0-9]{6}$/).required(),
  account_type: Joi.string().valid('personal', 'professional', 'particulier', 'pro').default('personal'),
  turnstile_token: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  turnstile_token: Joi.string().allow('').optional(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const forgotSchema = Joi.object({
  identifier: Joi.string().trim().min(3).max(255).required(),
  turnstile_token: Joi.string().allow('').optional(),
});

const resetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(100).required(),
});

const resendOtpSchema = Joi.object({
  telephone: Joi.string().pattern(/^\+?[0-9]{6,15}$/).required(),
  channel: Joi.string().valid('sms', 'email').default('sms'),
});

function setRefreshCookie(res, refreshToken) {
  setSecureCookie(res, REFRESH_COOKIE_NAME, refreshToken, {
    maxAge: getRefreshExpiresMs(),
  });
}

function readRefreshToken(req) {
  const bodyToken = String(req.body?.refresh_token || '').trim();
  if (bodyToken) return bodyToken;
  return getCookieValue(req, REFRESH_COOKIE_NAME);
}

router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'register' });
    const { user, verificationToken, accessToken, refreshToken } = await registerAccount(value);
    const normalizedPhone = normalizePhoneNumber(value.telephone);
    await query('UPDATE users SET telephone = $1, phone_verified = FALSE, updated_at = NOW() WHERE id = $2', [normalizedPhone, user.id]);
    setRefreshCookie(res, refreshToken);

    sendVerificationEmail(user.email, user.prenom, verificationToken).catch((err) => {
      console.error('[AUTH] Erreur envoi email vérification:', err.message);
    });

    sendWelcomeEmail(user.email, user.prenom).catch((err) => {
      console.error('[AUTH] Erreur envoi email bienvenue:', err.message);
    });

    return res.status(201).json({
      data: {
        user,
        access_token: accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'login' });
    const { user, accessToken, refreshToken } = await loginAccount(value, { ip: req.ip });
    setRefreshCookie(res, refreshToken);

    return res.json({
      data: {
        user,
        access_token: accessToken,
      },
    });
  } catch (err) {
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
});

// TODO: test refresh rotation after deploy with Redis blacklist enabled.
router.post('/refresh', refreshLimiter, async (req, res, next) => {
  try {
    const { error, value = {} } = refreshSchema.validate(req.body);
    const refreshToken = String(value.refresh_token || readRefreshToken(req) || '').trim();
    if (error && !refreshToken) return res.status(400).json({ error: 'refresh_token manquant.' });
    if (!refreshToken) return res.status(400).json({ error: 'refresh_token manquant.' });

    const { accessToken, refreshToken: newRefresh } = await refreshSessionWithRotation(refreshToken);
    setRefreshCookie(res, newRefresh);

    return res.json({
      data: {
        access_token: accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await findUserById(req.user.id);
    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', verifyCsrf, async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const accessToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    const refresh_token = readRefreshToken(req);
    if (accessToken) {
      await addToTokenBlacklist(accessToken);
    }
    if (refresh_token) {
      await deleteRefreshToken(refresh_token);
    }
    clearSecureCookie(res, REFRESH_COOKIE_NAME);
    return res.json({ message: 'Déconnecté avec succès.' });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'forgot_password' });
    const recipient = await findUserByIdentifier(value.identifier);
    const user = recipient.rows[0];
    const neutralMessage = 'Si ce compte existe, vous recevrez un lien de réinitialisation par email ou SMS selon vos coordonnées vérifiées.';

    if (!user) {
      return res.json({ message: neutralMessage });
    }

    const reset = await requestPasswordResetForUser(user);
    if (!reset) {
      return res.json({ message: neutralMessage });
    }

    await deliverPasswordReset({ user, token: reset.token });

    return res.json({ message: neutralMessage });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'forgot_password' });
    const reset = await requestPasswordReset(value.email);
    if (!reset) {
      return res.json({ message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' });
    }

    await sendResetEmail(value.email, reset.token).catch((err) => {
      console.error('[AUTH] Erreur envoi email reset:', err.message);
    });

    return res.json({ message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-email', verificationLimiter, async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token manquant.' });

    const user = await confirmEmail(token);
    if (!user) {
      return res.status(400).json({ error: 'Lien invalide ou expiré.' });
    }

    sendWelcomeEmail(user.email, user.prenom).catch((err) => {
      console.error('[AUTH] Erreur envoi welcome après vérification:', err.message);
    });

    return res.json({
      message: 'Email confirmé avec succès.',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/resend-verification', verificationLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email manquant.' });

    await verifyTurnstileToken({ req, token: req.body?.turnstile_token, ip: req.ip, action: 'resend_verification' });
    const result = await resendVerification(email);
    if (!result) {
      return res.json({ message: 'Si un compte existe, un nouveau lien a été envoyé.' });
    }

    await sendVerificationEmail(result.user.email, result.user.prenom, result.token);

    return res.json({ message: 'Si un compte existe, un nouveau lien de confirmation a été envoyé.' });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/resend', authenticate, phoneLimiter, async (req, res, next) => {
  try {
    const { error, value } = resendOtpSchema.validate(req.body || {});
    if (error) return res.status(400).json({ error: error.details[0].message });

    const normalized = normalizePhoneNumber(value.telephone);
    const { rows } = await query(
      'SELECT id FROM users WHERE telephone = $1 AND phone_verified = TRUE AND id != $2',
      [normalized, req.user.id]
    );
    if (rows[0]) {
      return res.status(409).json({ error: 'Ce numéro est déjà associé à un autre compte' });
    }

    const result = await resendPhoneOtp({
      user: req.user,
      telephone: normalized,
      preferChannel: value.channel,
    });

    return res.json({
      success: true,
      message: result.message,
      channel: result.channel,
      masked: result.masked,
      expires_at: result.expires_at,
      cooldown: result.cooldown,
      telephone: normalized,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { error, value } = resetSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const ok = await resetPasswordWithToken(value.token, value.password);
    if (!ok) {
      return res.status(400).json({ error: 'Lien invalide ou expiré.' });
    }

    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
