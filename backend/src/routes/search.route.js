// backend/src/routes/search.route.js
// Suggestions de recherche: popularité globale + proximité textuelle

'use strict';

const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();
router.use(optionalAuth);

const FALLBACK_SUGGESTIONS = [
  'Toyota Hilux',
  'iPhone',
  'Nouméa',
  'Dumbéa',
  'Canapé',
  'Location',
  'Troc possible',
  'PS5',
];

const requestSchema = Joi.object({
  q: Joi.string().allow('', null).default(''),
  limit: Joi.number().integer().min(4).max(24).default(12),
});

function normalizeSearchTerm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
}

function makeSearchHref(label) {
  return `/annonces?q=${encodeURIComponent(label)}`;
}

function makeCategoryHref(rootSlug, subcategorySlug) {
  const params = new URLSearchParams();
  params.set('categorie', rootSlug);
  if (subcategorySlug && subcategorySlug !== rootSlug) params.set('sous_categorie', subcategorySlug);
  return `/annonces?${params.toString()}`;
}

function makeCommuneHref(slug, label) {
  const params = new URLSearchParams();
  params.set('commune', slug || label);
  return `/annonces?${params.toString()}`;
}

function serializeSuggestion(row) {
  if (!row?.label) return null;
  return {
    label: row.label,
    href: row.href || makeSearchHref(row.label),
    kind: row.kind || 'search',
    score: Number(row.score || 0),
    usage_count: Number(row.usage_count || 0),
    source: row.source || 'global',
  };
}

async function getPopularSearchSuggestions(normalizedQuery, limit, userId) {
  const { rows } = await query(
    `
      WITH aggregated AS (
        SELECT
          lower(unaccent(trim(COALESCE(metadata ->> 'query', metadata ->> 'term', '')))) AS normalized_term,
          MIN(trim(COALESCE(metadata ->> 'query', metadata ->> 'term', ''))) AS label,
          COUNT(*)::int AS usage_count,
          MAX(created_at) AS last_used_at,
          MAX(CASE WHEN user_id = $1 THEN 1 ELSE 0 END)::int AS personal_score
        FROM analytics_events
        WHERE event_name = 'listing_search'
          AND COALESCE(metadata ->> 'query', metadata ->> 'term', '') <> ''
        GROUP BY 1
      )
      SELECT
        label,
        usage_count,
        last_used_at,
        personal_score,
        CASE
          WHEN $2 = '' THEN usage_count::numeric
          ELSE similarity(normalized_term, $2)::numeric
        END AS score
      FROM aggregated
      WHERE $2 = ''
         OR normalized_term % $2
         OR similarity(normalized_term, $2) >= 0.16
         OR normalized_term LIKE '%' || $2 || '%'
      ORDER BY
        CASE WHEN $2 = '' THEN usage_count ELSE similarity(normalized_term, $2) END DESC,
        personal_score DESC,
        usage_count DESC,
        last_used_at DESC
      LIMIT $3
    `,
    [userId, normalizedQuery, limit],
  );

  return rows
    .map((row) =>
      serializeSuggestion({
        ...row,
        kind: 'search',
        source: row.personal_score > 0 ? 'personal' : 'global',
      }),
    )
    .filter(Boolean);
}

async function getCategorySuggestions(normalizedQuery, limit) {
  if (!normalizedQuery) return [];

  const { rows } = await query(
    `
      WITH category_tree AS (
        SELECT
          c.slug,
          c.name,
          COALESCE(p.slug, c.slug) AS root_slug,
          CASE
            WHEN p.name IS NOT NULL THEN p.name || ' · ' || c.name
            ELSE c.name
          END AS label,
          lower(unaccent(CASE
            WHEN p.name IS NOT NULL THEN p.name || ' ' || c.name
            ELSE c.name
          END)) AS normalized_label
        FROM categories c
        LEFT JOIN categories p ON p.id = c.parent_id
      )
      SELECT
        label,
        slug,
        root_slug,
        similarity(normalized_label, $1) AS score
      FROM category_tree
      WHERE normalized_label % $1
         OR similarity(normalized_label, $1) >= 0.2
         OR normalized_label LIKE '%' || $1 || '%'
      ORDER BY score DESC, label ASC
      LIMIT $2
    `,
    [normalizedQuery, limit],
  );

  return rows
    .map((row) =>
      serializeSuggestion({
        label: row.label,
        href: makeCategoryHref(row.root_slug || row.slug, row.slug),
        kind: 'category',
        score: row.score,
        source: 'taxonomy',
      }),
    )
    .filter(Boolean);
}

async function getCommuneSuggestions(normalizedQuery, limit) {
  if (!normalizedQuery) return [];

  const { rows } = await query(
    `
      SELECT
        name AS label,
        slug,
        similarity(lower(unaccent(name)), $1) AS score
      FROM communes
      WHERE lower(unaccent(name)) % $1
         OR similarity(lower(unaccent(name)), $1) >= 0.2
         OR lower(unaccent(name)) LIKE '%' || $1 || '%'
      ORDER BY score DESC, name ASC
      LIMIT $2
    `,
    [normalizedQuery, limit],
  );

  return rows
    .map((row) =>
      serializeSuggestion({
        label: row.label,
        href: makeCommuneHref(row.slug, row.label),
        kind: 'commune',
        score: row.score,
        source: 'taxonomy',
      }),
    )
    .filter(Boolean);
}

router.get('/suggestions', async (req, res) => {
  const { error, value } = requestSchema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const normalizedQuery = normalizeSearchTerm(value.q);
  const userId = req.user?.id ?? null;

  try {
    const popular = await getPopularSearchSuggestions(normalizedQuery, value.limit, userId);
    const categoryHints = await getCategorySuggestions(normalizedQuery, value.limit);
    const communeHints = await getCommuneSuggestions(normalizedQuery, value.limit);

    let suggestions = [...popular, ...categoryHints, ...communeHints];

    if (suggestions.length === 0) {
      suggestions = FALLBACK_SUGGESTIONS.map((label, index) =>
        serializeSuggestion({
          label,
          href: makeSearchHref(label),
          kind: 'search',
          score: 0.1 - index * 0.001,
          usage_count: 0,
          source: 'fallback',
        }),
      ).filter(Boolean);
    }

    const seen = new Set();
    const deduped = [];
    for (const item of suggestions) {
      if (!item?.label) continue;
      const key = `${item.kind || 'search'}:${item.href || item.label}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= value.limit) break;
    }

    res.json({
      ok: true,
      data: {
        query: value.q,
        normalized_query: normalizedQuery,
        suggestions: deduped,
      },
    });
  } catch (err) {
    logger.error('search_suggestions_error', { error: err, user_id: userId });
    const fallback = FALLBACK_SUGGESTIONS.slice(0, value.limit).map((label) =>
      serializeSuggestion({
        label,
        href: makeSearchHref(label),
        kind: 'search',
        score: 0,
        usage_count: 0,
        source: 'fallback',
      }),
    ).filter(Boolean);

    res.json({
      ok: true,
      data: {
        query: value.q,
        normalized_query: normalizedQuery,
        suggestions: fallback,
      },
    });
  }
});

module.exports = router;
