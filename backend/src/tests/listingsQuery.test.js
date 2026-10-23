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

  it('ordonne réellement les prix dans la direction demandée', () => {
    const ascending = getSortConfig('price_asc');
    const descending = getSortConfig('price_desc');

    assert.strictEqual(
      ascending.orderBy,
      'COALESCE(a.prix, 999999999) ASC, -EXTRACT(EPOCH FROM a.created_at) ASC, -a.id ASC'
    );
    assert.strictEqual(
      descending.orderBy,
      '-COALESCE(a.prix, 0) ASC, -EXTRACT(EPOCH FROM a.created_at) ASC, -a.id ASC'
    );
    const row = { id: 7, prix: 1000, published_at: '1970-01-01T00:00:01.000Z' };
    assert.deepStrictEqual(ascending.tupleFromRow(row), [1000, -1, -7]);
    assert.deepStrictEqual(descending.tupleFromRow(row), [-1000, -1, -7]);
  });
});
