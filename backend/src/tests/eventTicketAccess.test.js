'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { canManageTicket, serializeTicketForViewer } = require('../services/eventTicketingService');

const ticket = {
  id: 42,
  token: 'KAL-SECRET-TOKEN',
  status: 'active',
  is_scanned: false,
  scanned_at: null,
  scan_location: null,
  event_title: 'Concert test',
  event_date: '2026-08-28',
  event_time: '18:00:00',
  event_status: 'published',
  ticket_type_name: 'Standard',
  ticket_price_xpf: 2500,
  buyer_name: 'Acheteur privé',
  buyer_email: 'private@example.test',
  order_status: 'paid',
  organizer_id: 7,
  buyer_id: 9,
};

describe('Event ticket access control', () => {
  it('limite la vue publique aux informations non personnelles', () => {
    const result = serializeTicketForViewer(ticket);
    assert.strictEqual(result.event_title, 'Concert test');
    assert.strictEqual(result.status, 'active');
    assert.strictEqual(result.can_manage, false);
    assert.strictEqual(result.token, undefined);
    assert.strictEqual(result.buyer_name, undefined);
    assert.strictEqual(result.buyer_email, undefined);
    assert.strictEqual(result.order_status, undefined);
    assert.strictEqual(result.scan_location, undefined);
  });

  it('autorise uniquement l organisateur ou un administrateur a gerer le billet', () => {
    assert.strictEqual(canManageTicket({ id: 7, is_admin: false }, ticket), true);
    assert.strictEqual(canManageTicket({ id: 8, is_admin: false }, ticket), false);
    assert.strictEqual(canManageTicket({ id: 8, is_admin: true }, ticket), true);
    assert.strictEqual(canManageTicket(null, ticket), false);
    assert.strictEqual(canManageTicket({ is_admin: false }, { ...ticket, organizer_id: null }), false);
  });

  it('expose les donnees de controle uniquement au gestionnaire autorise', () => {
    const result = serializeTicketForViewer(ticket, { id: 7, is_admin: false });
    assert.strictEqual(result.token, 'KAL-SECRET-TOKEN');
    assert.strictEqual(result.can_manage, true);
    assert.strictEqual(result.buyer_name, 'Acheteur privé');
    assert.strictEqual(result.buyer_email, 'private@example.test');
    assert.strictEqual(result.order_status, 'paid');
  });
});
