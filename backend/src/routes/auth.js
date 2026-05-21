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
  refreshLimiter,
} = require('../middleware/rateLimit');
const { sendResetEmail, sendWelcomeEmail, sendVerificationEmail } = require('../services/emailService');
const { verifyTurnstileToken } = require('../services/turnstile');
const {
  confirmEmail,
  deleteRefreshToken,
  findUserById,
  loginAccount,
  refreshSession,
  registerAccount,
  resendVerification,
  requestPasswordReset,
  resetPasswordWithToken,
} = require('../services/authAccountService');

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(100).required(),
  prenom: Joi.string().min(1).max(100).required(),
  nom: Joi.string().min(1).max(100).required(),
  commune_id: Joi.number().integer().optional(),
  account_type: Joi.string().valid('particulier', 'pro').default('particulier'),
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
  email: Joi.string().email().required(),
  turnstile_token: Joi.string().allow('').optional(),
});

const resetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(100).required(),
});

router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'register' });
    const { user, verificationToken, accessToken, refreshToken } = await registerAccount(value);

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
        refresh_token: refreshToken,
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

    return res.json({
      data: {
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
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

router.post('/refresh', refreshLimiter, async (req, res, next) => {
  try {
    const { error, value } = refreshSchema.validate(req.body);
    if (error) return res.status(400).json({ error: 'refresh_token manquant.' });

    const { accessToken, refreshToken: newRefresh } = await refreshSession(value.refresh_token);

    return res.json({
      data: {
        access_token: accessToken,
        refresh_token: newRefresh,
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

router.post('/logout', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await deleteRefreshToken(refresh_token);
    }
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
