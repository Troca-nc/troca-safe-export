'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const { buildListingSearchContext, getSortConfig } = require('../services/listingsQuery');

describe('Listings query', () => {
  it('utilise l’expression indexée de la baseline pour la recherche plein texte', () => {
    const context = buildListingSearchContext({ q: 'vélo électrique' });

    assert.match(context.whereClause, /to_tsvector\('french'/);
    assert.doesNotMatch(context.whereClause, /a\.search_vector/);
    assert.deepStrictEqual(context.params, ['vélo électrique', '%vélo électrique%']);
  });

  it('calcule la pertinence sans dépendre d’une colonne absente du schéma', () => {
    const sort = getSortConfig('relevance', 'vélo');

    assert.match(sort.orderBy, /to_tsvector\('french'/);
    assert.match(sort.rankSelect, /AS relevance_score/);
    assert.doesNotMatch(sort.orderBy, /a\.search_vector/);
  });
});
