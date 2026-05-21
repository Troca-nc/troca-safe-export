'use strict';

const { checkConnection } = require('./config/database');
const { startAllJobs } = require('./jobs/scheduler');
const { logger } = require('./utils/logger');
const {
  recordError,
  registerObservabilityInstance,
  stopObservabilityHeartbeat,
} = require('./services/observability');

async function start() {
  try {
    await checkConnection();
    logger.info('worker_db_connection_ok');
  } catch (err) {
    recordError({ source: 'worker', message: err.message, error_code: err.code ?? null });
    logger.error('worker_db_connection_failed', { error: err });
    process.exit(1);
  }

  startAllJobs();
  void registerObservabilityInstance('worker');
  logger.info('worker_started');

  const shutdown = (signal) => {
    logger.info('worker_shutdown_signal', { signal });
    stopObservabilityHeartbeat();
    setTimeout(() => process.exit(0), 0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    recordError({ source: 'worker', type: 'uncaughtException', message: error.message });
    logger.error('worker_uncaught_exception', { error });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    recordError({ source: 'worker', type: 'unhandledRejection', message: String(reason) });
    logger.error('worker_unhandled_rejection', { reason });
  });
}

start();
