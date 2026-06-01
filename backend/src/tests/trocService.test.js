'use strict';

const assert = require('assert');
const { describe, it } = require('./helpers');
const {
  detectTrocCycles,
  getTrocCompatibilityScore,
} = require('../services/trocService');

describe('trocService', () => {
  it('calcule un score de compatibilite quand mes annonces correspondent', () => {
    const target = {
      id: 1,
      user_id: 10,
      is_troc: true,
      troc_status: 'open',
      troc_wants: ['velo', 'outil'],
      troc_accepts_complement_xpf: true,
      troc_complement_max_xpf: 5000,
      title: 'Table de jardin',
      category_name: 'Maison',
      category_slug: 'maison',
    };
    const viewerListings = [
      { id: 2, user_id: 99, is_troc: true, troc_status: 'open', title: 'Velo de ville', category_name: 'Sports & Loisirs', category_slug: 'sports-loisirs', price: 2000 },
      { id: 3, user_id: 99, is_troc: true, troc_status: 'open', title: 'Outils bricolage', category_name: 'Divers', category_slug: 'divers', price: 3000 },
    ];

    const compatibility = getTrocCompatibilityScore(target, viewerListings);

    assert.ok(compatibility);
    assert.strictEqual(compatibility.matching_count, 2);
    assert.ok(compatibility.score >= 80);
    assert.strictEqual(compatibility.label, 'Excellent');
  });

  it('renvoie un score faible quand rien ne matche', () => {
    const compatibility = getTrocCompatibilityScore(
      {
        id: 1,
        user_id: 10,
        is_troc: true,
        troc_status: 'open',
        troc_wants: ['macbook'],
        title: 'Fauteuil',
        category_name: 'Maison',
        category_slug: 'maison',
      },
      [
        { id: 2, user_id: 99, is_troc: true, troc_status: 'open', title: 'VTT', category_name: 'Sports & Loisirs', category_slug: 'sports-loisirs', price: 1000 },
      ]
    );

    assert.strictEqual(compatibility.matching_count, 0);
    assert.strictEqual(compatibility.score, 0);
    assert.strictEqual(compatibility.label, 'Faible');
  });

  it('detecte un cycle A -> B -> C -> A', () => {
    const listings = [
      { id: 1, user_id: 1, is_troc: true, troc_status: 'open', troc_wants: ['velo'], title: 'Table', category_name: 'Maison', category_slug: 'maison' },
      { id: 2, user_id: 2, is_troc: true, troc_status: 'open', troc_wants: ['tablet'], title: 'Velo', category_name: 'Sports & Loisirs', category_slug: 'sports-loisirs' },
      { id: 3, user_id: 3, is_troc: true, troc_status: 'open', troc_wants: ['table'], title: 'Tablet', category_name: 'Divers', category_slug: 'divers' },
    ];

    const cycles = detectTrocCycles(listings[0], listings);

    assert.strictEqual(cycles.length, 1);
    assert.deepStrictEqual(cycles[0].participant_ids, [1, 2, 3]);
    assert.deepStrictEqual(cycles[0].listing_ids, [1, 2, 3]);
    assert.strictEqual(cycles[0].status, 'proposed');
  });
});
