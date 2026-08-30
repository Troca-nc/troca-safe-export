'use strict';

// Load real application code without opening its default DB pool or providers.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(relativeFile, imports, globals = {}) {
  const file = path.join(__dirname, '..', relativeFile);
  const sandbox = {
    module: { exports: {} }, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
      return imports[name];
    },
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file, timeout: 1000 });
  return sandbox.module.exports;
}

function loadDatabase(pool) {
  return load('config/database.js', {
    pg: { Pool: class { constructor() { return pool; } } },
    '../utils/logger': { logger: { error() {}, debug() {} } },
  }, { process: { env: {} } });
}

function loadServices(database, sendTicketEmail = async () => {}) {
  const ticketing = load('services/eventTicketingService.js', {
    '../config/database': database,
    '../config/env': { isConfiguredValue: () => false },
    './qrCodeService': { generateTicketToken() { throw new Error('Unexpected token generation'); } },
  });
  const forbidden = () => { throw new Error('Unexpected non-ticket effect'); };
  const webhook = load('services/paymentWebhookService.js', {
    './eventTicketingService': ticketing,
    './bonPlansService': { activateBonPlanFromPayment: forbidden },
    './campaignsService': { activateCampaignFromPayment: forbidden },
    './emailService': { sendTicketEmail, sendBoostActivatedEmail: forbidden },
    './paymentCatalog': { xpfToEurCents: forbidden },
  });
  return { ...ticketing, ...webhook };
}

const metadata = {
  payment_type: 'event_ticket', user_id: '7', order_id: '34', event_id: '12',
  amount_xpf: '3600', amount_eur_cents: '3017',
};
function ticketEvent(overrides = {}) {
  return { type: 'checkout.session.completed', data: { object: {
    id: 'cs_synthetic', payment_status: 'paid', currency: 'eur', amount_total: 3017,
    metadata: { ...metadata }, ...overrides,
  } } };
}

module.exports = { loadDatabase, loadServices, metadata, ticketEvent };
