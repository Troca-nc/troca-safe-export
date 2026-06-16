'use strict';

const fs = require('fs/promises');
const path = require('path');
const cron = require('node-cron');

const { query } = require('../config/database');
const { withLock } = require('../services/sharedCache');
const { logger } = require('../utils/logger');
const { recordJob } = require('../services/observability');

function getImportRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads', 'imports');
}

function isInsideRoot(filePath, rootDir) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${path.sep}`);
}

async function removeImportFile(filePath) {
  if (!filePath) return false;
  const rootDir = getImportRoot();
  if (!isInsideRoot(filePath, rootDir)) return false;

  try {
    await fs.unlink(path.resolve(filePath));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function purgeImportJobs({ statuses, intervalLabel, lockName }) {
  const jobs = await query(
    `SELECT id, file_path
       FROM import_jobs
      WHERE status = ANY($1::text[])
        AND created_at < NOW() - $2::interval
      ORDER BY created_at ASC
      LIMIT 250`,
    [statuses, intervalLabel]
  );

  if (!jobs.rows.length) {
    return { filesRemoved: 0, jobsRemoved: 0 };
  }

  let filesRemoved = 0;
  for (const job of jobs.rows) {
    try {
      if (await removeImportFile(job.file_path)) {
        filesRemoved += 1;
      }
    } catch (error) {
      logger.warn('import_cleanup_file_error', {
        job_id: job.id,
        file_path: job.file_path,
        error: error.message,
      });
    }
  }

  await query(
    `DELETE FROM import_jobs
      WHERE id = ANY($1::int[])`,
    [jobs.rows.map((job) => Number(job.id))]
  );

  return { filesRemoved, jobsRemoved: jobs.rows.length, lockName };
}

function startImportCleanupJob() {
  cron.schedule('0 3 * * *', async () => {
    recordJob('started', { job: 'import-cleanup' });
    await withLock('cron:import-cleanup', 55 * 60 * 1000, async () => {
      try {
        const pending = await purgeImportJobs({
          statuses: ['pending', 'processing'],
          intervalLabel: '24 hours',
          lockName: 'import-cleanup-pending',
        });

        const completed = await purgeImportJobs({
          statuses: ['completed', 'failed', 'cancelled'],
          intervalLabel: '30 days',
          lockName: 'import-cleanup-archive',
        });

        if (pending.jobsRemoved || completed.jobsRemoved) {
          logger.info('cron_import_cleanup_done', {
            pending: pending.jobsRemoved,
            archived: completed.jobsRemoved,
            files_removed: pending.filesRemoved + completed.filesRemoved,
          });
        }
      } catch (error) {
        recordJob('error', { job: 'import-cleanup', message: error.message });
        logger.error('cron_import_cleanup_error', { error });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'import-cleanup' });
}

module.exports = { startImportCleanupJob };
