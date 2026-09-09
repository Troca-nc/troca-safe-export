'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('./helpers');

describe('Fret state transitions', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'services', 'fretWorkflowService.js'), 'utf8');
  const selectionStart = source.indexOf('async function selectFretOffer');
  const deliveryStart = source.indexOf('async function markFretDelivered');
  const selection = source.slice(selectionStart, deliveryStart);
  const delivery = source.slice(deliveryStart, source.indexOf('async function withdrawMyFretOffer', deliveryStart));

  it('sélectionne une offre une seule fois depuis une demande ouverte', () => {
    assert.ok(selection.includes("o.status = 'pending'"));
    assert.ok(selection.includes("AND status = 'open'"));
    assert.ok(selection.includes('AND selected_offer_id IS NULL'));
    assert.ok(selection.includes('RETURNING *'));
    assert.ok(selection.includes('if (!requestUpdate.rows[0])'));
  });

  it('ferme la demande avant de réécrire les statuts des offres', () => {
    const requestTransition = selection.indexOf('const requestUpdate = await client.query');
    const offerTransition = selection.indexOf('UPDATE delivery_offers', requestTransition);
    assert.ok(requestTransition >= 0 && offerTransition > requestTransition);
  });

  it('enregistre la livraison une seule fois depuis closed', () => {
    assert.ok(delivery.includes("AND status = 'closed'"));
    assert.ok(delivery.includes('AND delivered_at IS NULL'));
    assert.ok(delivery.includes('AND selected_transporter_id = $2'));
    assert.ok(delivery.includes('if (!deliveryUpdate.rows[0])'));
    assert.ok(delivery.includes('error.status = 409'));
  });
});
