// ============================================================
//  Kalico — Backend Express (point d'entrée)
// ============================================================

'use strict';

const express     = require('express');
const http        = require('http');
const path        = require('path');
const cors        = require('cors');
const helmet      = require('helmet');
const { checkConnection }   = require('./config/database');
const errorHandler          = require('./middleware/errorHandler');
const { requestContext }    = require('./middleware/requestContext');
const { requestLogger }     = require('./middleware/requestLogger');
const { internalAuth }      = require('./middleware/internalAuth');
const { apiLimiter, authLimiter }        = require('./middleware/rateLimit');
const { csrfMiddleware }    = require('./middleware/csrf');
const { initSocket, shutdownWebsocketBridge }        = require('./services/websocketServer');
const { startAllJobs }      = require('./jobs/scheduler');
const { ensureDefaultPopupCampaign } = require('./services/campaignsService');
const { logger }            = require('./utils/logger');
const {
  getSnapshot,
  registerObservabilityInstance,
  stopObservabilityHeartbeat,
} = require('./services/observability');

// ── Routes ────────────────────────────────────────────────────
const authRouter      = require('./routes/auth');
const annoncesRouter  = require('./routes/annonces');
const usersRouter     = require('./routes/users');
const messagesRouter  = require('./routes/messages');
const categoriesRouter= require('./routes/categories');
const communesRouter  = require('./routes/communes');
const uploadRouter    = require('./routes/upload');
const uploadsRouter   = require('./routes/uploads');
const adminRouter     = require('./routes/admin.routes');
const rgpdRouter      = require('./routes/rgpd.route');
const legalRouter     = require('./routes/legal');
const paymentRouter   = require('./routes/payment.route');
const subscriptionsRouter = require('./routes/subscriptions');
const phoneRouter     = require('./routes/phone.route');
const alertRouter     = require('./routes/alert.route');
const pushTokenRouter      = require('./routes/pushToken.route');
const notificationsRouter  = require('./routes/notifications.route');
const statsRouter          = require('./routes/stats.route');
const offersRouter         = require('./routes/offers.route');
const bonPlansRouter       = require('./routes/bonPlans.route');
const businessesRouter     = require('./routes/businesses.route');
const businessesAdminRouter = require('./routes/businesses.admin.route');
const proRouter            = require('./routes/pro');
const proDocumentsRouter   = require('./routes/pro-documents');
const proQuotesRouter      = require('./routes/pro.quotes');
const reviewsRouter        = require('./routes/reviews');
const newsletterRouter     = require('./routes/newsletter');
const contactRouter        = require('./routes/contact.route');
const analyticsRouter      = require('./routes/analytics.route');
const searchRouter         = require('./routes/search.route');
const proBookingsRouter    = require('./routes/pro.bookings');
const proLaunchPackRouter  = require('./routes/pro.launch-pack');
const proTransportRouter   = require('./routes/pro-transport');
const fretRouter           = require('./routes/fret');
const deliveryRouter       = require('./routes/delivery');
const campaignsRouter      = require('./routes/campaigns.route');
const quoteRequestsRouter  = require('./routes/quote-requests.route');
const eventsRouter         = require('./routes/events.route');
const importRouter         = require('./routes/import.route');
const covoiturageRouter    = require('./routes/covoiturage.route');
const couponsRouter        = require('./routes/coupons.route');
const proProductsRouter    = require('./routes/pro.products');
const demoRouter           = require('./routes/demo.route');
const trocRouter           = require('./routes/troc');

// ── Application ───────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const port   = Number(process.env.PORT || 3001);

// ── Middlewares globaux ───────────────────────────────────────

const allowedOrigins = [
  process.env.BASE_URL        || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:19006',   // Expo dev
  'http://127.0.0.1:3000',
  'http://127.0.0.1:19006',
];

const allowedOriginSet = new Set(
  allowedOrigins.map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      return value;
    }
  })
);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    let normalizedOrigin = origin;
    try {
      normalizedOrigin = new URL(origin).origin;
    } catch {
      cb(new Error(`CORS: origine non autorisée — ${origin}`));
      return;
    }
    if (allowedOriginSet.has(normalizedOrigin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origine non autorisée — ${origin}`));
    }
  },
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production' || req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});
app.use(requestContext);
app.use(requestLogger);
app.use(csrfMiddleware);
app.use('/api/', apiLimiter);

// ── Health check ──────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    const dbTime = await checkConnection();
    res.json({
      ok: true,
      service: 'kalico-backend',
      db: dbTime,
      request_id: _req.requestId ?? null,
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: 'DB indisponible',
      detail: err.message,
      request_id: _req.requestId ?? null,
    });
  }
});

app.get('/api/internal/observability', internalAuth, async (_req, res) => {
  const snapshot = await getSnapshot();
  res.json({
    ok: true,
    service: 'kalico-backend',
    request_id: _req.requestId ?? null,
    data: snapshot,
  });
});

// ── Routes API ────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/listings',   annoncesRouter);
app.use('/api/users/notifications', notificationsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/users',      pushTokenRouter);   // POST /api/users/push-token
app.use('/api/messages',   messagesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/communes',   communesRouter);
app.use('/api/upload',     uploadRouter);
app.use(['/uploads/pro-documents', '/uploads/imports'], (_req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(404).json({ error: 'Fichier introuvable' });
});
app.use('/uploads',        express.static(path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')));
app.use('/uploads',        uploadsRouter);
app.use('/api/admin',      adminRouter);
app.use('/api/rgpd',       rgpdRouter);
app.use('/api',            legalRouter);
app.use('/api/payment',    paymentRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/phone',      phoneRouter);
app.use('/api/alerts',     alertRouter);
app.use('/api/stats',      statsRouter); // GET /api/users/notifications
app.use('/api/messages',   offersRouter);          // POST /api/messages/offers
app.use('/api/bon-plans',  bonPlansRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/admin/businesses', businessesAdminRouter);
app.use('/api/pro',        proBookingsRouter);
app.use('/api/pro',        proLaunchPackRouter);
app.use('/api/pro',        proDocumentsRouter);
app.use('/api/pro-quotes', proQuotesRouter);
app.use('/api/pros',       proRouter);
app.use('/api/pro',        proRouter);
app.use('/api/pro',        proProductsRouter);
app.use('/api/reviews',    reviewsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/contact',    contactRouter);
app.use('/api/analytics',  analyticsRouter);
app.use('/api/search',     searchRouter);
app.use('/api/pro-transport', proTransportRouter);
app.use('/api/fret', fretRouter);
app.use('/api/delivery-requests', deliveryRouter);
app.use('/api/delivery-offers', deliveryRouter);
app.use('/api/quote-requests', quoteRequestsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/import', importRouter);
app.use('/api/covoiturage', covoiturageRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/demo',       demoRouter);
app.use('/api/troc',       trocRouter);

// Auth sociale (Google / Apple) — chargement optionnel
try {
  app.use('/api/auth', require('./routes/auth.social'));
} catch { /* module optionnel */ }

// ── 404 ───────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    error: 'Route introuvable.',
    request_id: _req.requestId ?? null,
  });
});

// ── Gestionnaire d'erreurs global ─────────────────────────────

app.use(errorHandler);

// ── Démarrage ─────────────────────────────────────────────────

async function start() {
  let databaseReady = true;
  try {
    await checkConnection();
    logger.info('db_connection_ok');
  } catch (err) {
    logger.error('db_connection_failed', { error: err });
    if (process.env.DEMO_MODE !== 'true') {
      process.exit(1);
    }
    databaseReady = false;
    logger.warn('db_connection_failed_demo_mode', {
      message: 'Base de donnees indisponible, mode demo degrade active.',
    });
  }

  initSocket(server);
  await ensureDefaultPopupCampaign().catch((error) => {
    logger.warn('default_popup_init_failed', { error: error?.message || String(error) });
  });
  if (process.env.RUN_JOBS !== 'false' && databaseReady) {
    startAllJobs();
  } else if (process.env.RUN_JOBS !== 'false') {
    logger.warn('jobs_skipped_demo_mode', {
      message: 'Jobs ignores pendant le boot demo sans base locale.',
    });
  } else {
    logger.info('cron_disabled_on_instance');
  }

  server.listen(port, () => {
    void registerObservabilityInstance('api');
    logger.info('api_started', {
      port,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  const shutdown = (signal) => {
    logger.info('api_shutdown_signal', { signal });
    server.close(() => {
      stopObservabilityHeartbeat();
      shutdownWebsocketBridge().finally(() => {
        logger.info('api_http_closed');
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('uncaught_exception', { error });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', { reason });
  });
}

start();
