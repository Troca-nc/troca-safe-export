'use strict';

const ticketExpiry = require('./ticketExpiry');
const importCleanup = require('./importCleanup');
const { startCinemaScraperJob } = require('./cinemaScraper');

function startCronJobs() {
  ticketExpiry.startTicketExpiryJob?.();
  importCleanup.startImportCleanupJob?.();
  startCinemaScraperJob();
}

module.exports = { ticketExpiry, importCleanup, startCinemaScraperJob, startCronJobs };
