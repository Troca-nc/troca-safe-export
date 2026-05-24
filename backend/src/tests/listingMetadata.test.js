'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { validateListingMetadata } = require('../services/listingMetadata');

describe('validateListingMetadata', () => {
  it('valide une métadonnée immobilier complète', () => {
    const metadata = validateListingMetadata('immobilier', {
      transaction: 'vente',
      type_bien: 'appartement',
      surface_m2: 85,
      nb_pieces: 3,
      nb_chambres: 2,
      nb_sdb: 1,
      etat_bien: 'bon',
      parking: true,
      equipements: ['climatisation', 'fibre'],
    });

    assert.strictEqual(metadata.transaction, 'vente');
    assert.strictEqual(metadata.type_bien, 'appartement');
    assert.strictEqual(metadata.surface_m2, 85);
  });

  it('rejette une métadonnée immobilier incomplète', () => {
    assert.throws(
      () => validateListingMetadata('immobilier', { transaction: 'vente' }),
      /"type_bien"/i
    );
  });
});
