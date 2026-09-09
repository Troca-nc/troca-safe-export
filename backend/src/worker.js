'use strict';

const { checkConnection } = require('./config/database');
const { startAllJobs } = require('./jobs/scheduler');
const { startTicketEmailOutboxJob } = require('./jobs/ticketEmailOutbox');
const { startCampaignNotificationOutboxJob } = require('./jobs/campaignNotificationOutbox');
const { logger } = require('./utils/logger');
const { createWorkerHealthService } = require('./services/workerHealthService');
const { stopSchedulingAndDrain } = require('./services/jobRuntime');
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
  const ticketEmailJob = startTicketEmailOutboxJob();
  const campaignNotificationJob = startCampaignNotificationOutboxJob();
  void registerObservabilityInstance('worker');
  const health = createWorkerHealthService({ checkDatabase: checkConnection });
  await health.start();
  logger.info('worker_started');

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('worker_shutdown_signal', { signal });
    stopObservabilityHeartbeat();
    const timeoutMs = Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS || 60_000);
    const result = await stopSchedulingAndDrain(timeoutMs);
    ticketEmailJob.stop();
    campaignNotificationJob.stop();
    await health.stop();
    if (!result.drained) {
      logger.error('worker_shutdown_timeout', { active_jobs: result.active, timeout_ms: timeoutMs });
    }
    process.exit(result.drained ? 0 : 1);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('uncaughtException', (error) => {
    recordError({ source: 'worker', type: 'uncaughtException', message: error.message });
    logger.error('worker_uncaught_exception', { error });
    void shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    recordError({ source: 'worker', type: 'unhandledRejection', message: String(reason) });
    logger.error('worker_unhandled_rejection', { reason });
  });
}

start();
