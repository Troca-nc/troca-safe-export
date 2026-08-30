'use strict';
const { load } = require('./paymentTransactionHarness');

function loadCampaigns(notify = async () => {}, clock = () => Date.now()) {
  const forbidden = () => { throw new Error('Unexpected pool/provider call'); };
  return load('services/campaignsService.js', {
    twilio: () => ({ messages: { create: () => notify('sms') } }), stripe: forbidden,
    '../config/database': { query: forbidden, withTransaction: forbidden },
    './notificationService': { createNotification: () => notify('notification') },
    './emailService': { sendMail: () => notify('email') },
    './pushService': { sendPushToUsers: () => notify('push') },
    './fretWorkflowService': { sendSms: forbidden },
    '../config/env': { isConfiguredValue: () => false }, './payplugService': {},
    './paymentHelpers': { ensureStripe: forbidden, getOrCreateStripeCustomer: forbidden },
    './paymentCatalog': { xpfToEurCents: forbidden, formatXpfEur: forbidden },
  }, {
    process: { env: { TWILIO_ACCOUNT_SID: 'synthetic', TWILIO_AUTH_TOKEN: 'synthetic', TWILIO_PHONE_NUMBER: '+000' } },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [clock()])); }
      static now() { return clock(); }
    },
  });
}
const payment = { id: 9, user_id: 7, type: 'campaign', status: 'pending', amount_xpf: 1900,
  metadata: { campaign_id: '13', pricing_mode: 'one_shot' } };
module.exports = { loadCampaigns, payment };
