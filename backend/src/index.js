// ============================================================
//  Troca — Backend Express (point d'entrée)
// ============================================================

'use strict';

const express     = require('express');
const http        = require('http');
const cors        = require('cors');
const { checkConnection }   = require('./config/database');
const { errorHandler }      = require('./middleware/errorHandler');
const { requestContext }    = require('./middleware/requestContext');
const { requestLogger }     = require('./middleware/requestLogger');
const { internalAuth }      = require('./middleware/internalAuth');
const { apiLimiter }        = require('./middleware/rateLimit');
const { initSocket, shutdownWebsocketBridge }        = require('./services/websocketServer');
const { startAllJobs }      = require('./jobs/scheduler');
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
const covoiturageRouter    = require('./routes/covoiturage.route');
const demoRouter           = require('./routes/demo.route');

// ── Application ───────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const port   = Number(process.env.PORT || 3001);

// ── Middlewares globaux ───────────────────────────────────────

const allowedOrigins = [
  process.env.BASE_URL        || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:19006',   // Expo dev
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

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use(requestContext);
app.use(requestLogger);
app.use('/api/', apiLimiter);

// ── Health check ──────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    const dbTime = await checkConnection();
    res.json({
      ok: true,
      service: 'troca-backend',
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
    service: 'troca-backend',
    request_id: _req.requestId ?? null,
    data: snapshot,
  });
});

// ── Routes API ────────────────────────────────────────────────

app.use('/api/auth',       authRouter);
app.use('/api/listings',   annoncesRouter);
app.use('/api/users',      usersRouter);
app.use('/api/users',      pushTokenRouter);   // POST /api/users/push-token
app.use('/api/messages',   messagesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/communes',   communesRouter);
app.use('/api/upload',     uploadRouter);
app.use('/uploads',        uploadsRouter);
app.use('/api/admin',      adminRouter);
app.use('/api/rgpd',       rgpdRouter);
app.use('/api/payment',    paymentRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/phone',      phoneRouter);
app.use('/api/alerts',     alertRouter);
app.use('/api/users',      notificationsRouter);
app.use('/api/stats',      statsRouter); // GET /api/users/notifications
app.use('/api/messages',   offersRouter);          // POST /api/messages/offers
app.use('/api/bon-plans',  bonPlansRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/admin/businesses', businessesAdminRouter);
app.use('/api/covoiturage', covoiturageRouter);
app.use('/api/demo',       demoRouter);

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
  try {
    await checkConnection();
    logger.info('db_connection_ok');
  } catch (err) {
    logger.error('db_connection_failed', { error: err });
    process.exit(1);
  }

  initSocket(server);
  if (process.env.RUN_JOBS !== 'false') {
    startAllJobs();
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
