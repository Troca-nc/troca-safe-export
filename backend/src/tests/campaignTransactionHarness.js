'use strict';
const { load } = require('./paymentTransactionHarness');

function loadCampaigns(notify = async () => {}, clock = () => Date.now(), database = null, env = {}) {
  const forbidden = () => { throw new Error('Unexpected pool/provider call'); };
  const outbox = load('services/campaignNotificationOutboxService.js', {
    '../config/database': { withTransaction: forbidden },
  });
  return load('services/campaignsService.js', {
    twilio: () => ({ messages: { create: () => notify('sms') } }), stripe: forbidden,
    '../config/database': database || { query: forbidden, withTransaction: forbidden },
    './notificationService': { createNotification: () => notify('notification') },
    './emailService': { sendMail: () => notify('email') },
    './pushService': { sendPushToUsers: () => notify('push') },
    './fretWorkflowService': { sendSms: forbidden },
    '../config/env': { isConfiguredValue: () => false }, './payplugService': {},
    './paymentHelpers': { ensureStripe: forbidden, getOrCreateStripeCustomer: forbidden },
    './paymentCatalog': { xpfToEurCents: forbidden, formatXpfEur: forbidden },
    './campaignNotificationOutboxService': outbox,
    './campaignPushDelivery': { sendCampaignPush: () => notify('push') },
  }, {
    process: { env: { TWILIO_ACCOUNT_SID: 'synthetic', TWILIO_AUTH_TOKEN: 'synthetic', TWILIO_PHONE_NUMBER: '+000', ...env } },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [clock()])); }
      static now() { return clock(); }
    },
  });
}
const payment = { id: 9, user_id: 7, type: 'campaign', status: 'pending', amount_xpf: 1900,
  metadata: { campaign_id: '13', pricing_mode: 'one_shot', payment_type: 'campaign', user_id: '7' } };
const { xpfToEurCents } = require('../services/paymentCatalog');
function campaignEvent(changes = {}) {
  return { id: 'evt_campaign', type: 'checkout.session.completed', data: { object: {
    id: 'cs_synthetic', metadata: { ...payment.metadata }, currency: 'eur', payment_status: 'paid',
    amount_total: xpfToEurCents(payment.amount_xpf), ...changes,
  } } };
}
function loadCampaignWebhook(campaignService) {
  const forbidden = () => { throw new Error('Unexpected non-campaign effect'); };
  return load('services/paymentWebhookService.js', {
    './campaignsService': campaignService,
    './bonPlansService': { activateBonPlanFromPayment: forbidden },
    './emailService': { sendBoostActivatedEmail: forbidden },
    './eventTicketingService': { finalizeEventTicketPayment: forbidden },
    './ticketEmailOutboxService': { enqueueTicketEmail: forbidden },
    './paymentCatalog': { xpfToEurCents },
  });
}
module.exports = { loadCampaigns, payment, campaignEvent, loadCampaignWebhook };
