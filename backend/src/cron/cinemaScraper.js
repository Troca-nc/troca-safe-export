'use strict';

const cron = require('node-cron');
const { runCinemaScraper } = require('../services/cinemaScraperService');
const { logger } = require('../utils/logger');

let job = null;

function startCinemaScraperJob() {
  if (job) return job;
  job = cron.schedule('0 2 * * *', async () => {
    try {
      const report = await runCinemaScraper();
      logger.info('cinema_scraper_job_done', { report });
    } catch (error) {
      logger.error('cinema_scraper_job_failed', { error: error?.message || String(error) });
    }
  });
  return job;
}

module.exports = { startCinemaScraperJob };
