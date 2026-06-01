'use strict';

const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { buildListingSearchContext } = require('../services/listingsQuery');
const { mapListingSearchRow, mapListingDetailResponse } = require('../services/listingsPresentation');
const {
  acceptTrocProposal,
  completeTrocProposal,
  confirmTrocCycleParticipation,
  counterTrocProposal,
  createTrocProposal,
  getTrocCompatibilityScore,
  listTrocCycles,
  listTrocProposalsReceived,
  listTrocProposalsSent,
  loadProposalById,
  normalizeComplementDirection,
} = require('../services/trocWorkflowService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUsers } = require('../services/pushService');
const { sendMail } = require('../services/emailService');

const router = express.Router();

const swipeSchema = Joi.object({
  listing_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim()).required(),
  direction: Joi.string().valid('left', 'right').required(),
});

const proposalSchema = Joi.object({
  offered_listing_ids: Joi.array().items(Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim())).default([]),
  offered_description: Joi.string().max(2000).allow('', null).optional(),
  offered_photos: Joi.array().items(Joi.string().trim().allow('', null)).default([]),
  complement_xpf: Joi.number().integer().min(0).default(0),
  complement_direction: Joi.string().valid('none', 'i_pay', 'they_pay').default('none'),
  message: Joi.string().max(2000).allow('', null).optional(),
});

const counterSchema = proposalSchema;

function buildViewerExclusionClause(baseParamCount, viewerId) {
  if (!viewerId) {
    return { clause: '', params: [] };
  }

  const clauseParts = [];
  const params = [];
  let nextParam = baseParamCount;

  nextParam += 1;
  clauseParts.push(`a.user_id <> $${nextParam}`);
  params.push(viewerId);

  nextParam += 1;
  clauseParts.push(`NOT EXISTS (
    SELECT 1 FROM troc_swipes ts
    WHERE ts.user_id = $${nextParam}
      AND ts.listing_id = a.id
      AND ts.direction = 'left'
  )`);
  params.push(viewerId);

  return {
    clause: clauseParts.join(' AND '),
    params,
  };
}

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function loadViewerTrocListings(userId) {
  if (!userId) return [];

  const result = await query(`
    SELECT
      a.id,
      a.user_id,
      a.titre AS title,
      a.prix AS price,
      a.category_id,
      cat.name AS category_name,
      cat.slug AS category_slug,
      a.troc_wants,
      a.troc_accepts_complement_xpf,
      a.troc_complement_max_xpf,
      a.is_troc,
      a.troc_status
    FROM annonces a
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE a.user_id = $1
      AND a.deleted_at IS NULL
      AND a.status = 'active'
      AND COALESCE(a.is_troc, FALSE) = TRUE
      AND COALESCE(a.troc_status, 'open') = 'open'
    ORDER BY a.created_at DESC
    LIMIT 30
  `, [userId]);

  return result.rows;
}

async function runTrocFeedQuery(req, res, isSwipeFeed = false) {
  const cacheQuery = { ...req.query, troc: 'true' };
  const feedQuery = buildListingSearchContext({
    ...cacheQuery,
    limit: isSwipeFeed ? 100 : (req.query.limit || 20),
    sort: req.query.sort || 'date',
  });

  const countExclusion = buildViewerExclusionClause(feedQuery.params.length, req.user?.id ?? null);
  const listExclusion = buildViewerExclusionClause(feedQuery.params.length + feedQuery.cursorParams.length, req.user?.id ?? null);
  const countWhereClause = [feedQuery.whereClause, countExclusion.clause].filter(Boolean).join(' AND ');
  const listWhereClause = [feedQuery.whereClause, listExclusion.clause].filter(Boolean).join(' AND ');
  const countParams = [...feedQuery.params, ...countExclusion.params];
  const listParams = [...feedQuery.params, ...feedQuery.cursorParams, ...listExclusion.params, feedQuery.pageSize, feedQuery.offset];
  const cursorParamCount = feedQuery.cursorParams?.length || 0;
  const limitPlaceholder = feedQuery.params.length + cursorParamCount + listExclusion.params.length + 1;
  const offsetPlaceholder = feedQuery.params.length + cursorParamCount + listExclusion.params.length + 2;
  const distanceSelect = feedQuery.geo?.enabled
    ? `ROUND((ST_Distance(
        ST_SetSRID(ST_MakePoint(com.longitude, com.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($${feedQuery.geo.lngParam}, $${feedQuery.geo.latParam}), 4326)::geography
      ) / 1000.0)::numeric, 1) AS distance_km`
    : 'NULL::numeric AS distance_km';

  const countRes = await query(
    `SELECT COUNT(*) AS total
     FROM annonces a
     LEFT JOIN categories cat    ON cat.id = a.category_id
     LEFT JOIN categories parent ON parent.id = cat.parent_id
     LEFT JOIN communes com      ON com.id = a.commune_id
     LEFT JOIN provinces prov    ON prov.id = com.province_id
     WHERE ${countWhereClause}`,
    countParams
  );

  const listRes = await query(
    `SELECT
        a.id,
        a.titre AS titre,
        a.titre AS title,
        a.prix AS prix,
        a.prix AS price,
        a.condition,
        a.is_negotiable AS price_negotiable,
        (a.prix IS NULL) AS is_free,
        a.contre_quoi,
        a.is_troc,
        a.troc_wants,
        a.troc_accepts_complement_xpf,
        a.troc_complement_max_xpf,
        a.troc_status,
        a.created_at AS published_at,
        a.created_at AS created_at_sort,
        a.boost_expires_at AS boost_expires_at,
        a.nb_vues,
        a.boost_expires_at AS boosted_until,
        ${distanceSelect},
        a.commune_id,
        cat.id AS category_id,
        cat.name AS category_name,
        cat.slug AS category_slug,
        cat.icon AS category_icon,
        com.name AS commune_name,
        u.id AS seller_id,
        u.prenom AS seller_prenom,
        u.nom AS seller_nom,
        CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
        u.email_verified AS seller_email_verified,
        u.phone_verified AS seller_phone_verified,
        u.trust_score AS seller_trust_score,
        u.trust_level AS seller_trust_level,
        u.note_moyenne AS user_rating,
        (SELECT thumbnail_url FROM annonce_images
         WHERE annonce_id = a.id AND is_cover = TRUE
         LIMIT 1) AS cover_image_thumbnail,
        (SELECT id FROM annonce_images
         WHERE annonce_id = a.id AND is_cover = TRUE
         LIMIT 1) AS cover_image_id
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     LEFT JOIN categories parent ON parent.id = cat.parent_id
     LEFT JOIN communes com ON com.id = a.commune_id
     LEFT JOIN provinces prov ON prov.id = com.province_id
     LEFT JOIN users u ON u.id = a.user_id
     WHERE ${listWhereClause}${feedQuery.cursorWhere ? ` AND ${feedQuery.cursorWhere}` : ''}
     ORDER BY ${feedQuery.orderBy}
     LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
    listParams
  );

  const rows = listRes.rows.map(mapListingSearchRow);
  let payloadRows = rows;

  if (isSwipeFeed && req.user?.id) {
    const viewerListings = await loadViewerTrocListings(req.user.id);
    payloadRows = rows
      .map((row) => ({
        ...row,
        compatibility: getTrocCompatibilityScore(row, viewerListings),
      }))
      .sort((a, b) => {
        const scoreDiff = (b.compatibility?.score ?? 0) - (a.compatibility?.score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
      })
      .slice(0, 25);
  }

  const total = parseInt(countRes.rows[0].total, 10) || 0;
  const lastRow = listRes.rows[listRes.rows.length - 1] || null;
  const nextCursor = lastRow && listRes.rows.length === feedQuery.pageSize
    ? Buffer.from(JSON.stringify({ v: 1, sort: feedQuery.sort, values: feedQuery.sortConfig.tupleFromRow(lastRow) }), 'utf8').toString('base64url')
    : null;

  return res.json({
    data: payloadRows,
    nextCursor,
    pagination: {
      total,
      page: feedQuery.pageNum,
      pages: Math.ceil(total / feedQuery.pageSize),
      limit: feedQuery.pageSize,
    },
  });
}

// TODO: test E2E sur le feed troc, le swipe-feed et le score de compatibilite.
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    await runTrocFeedQuery(req, res, false);
  } catch (err) {
    next(err);
  }
});

router.get('/swipe-feed', optionalAuth, async (req, res, next) => {
  try {
    await runTrocFeedQuery(req, res, true);
  } catch (err) {
    next(err);
  }
});

router.get('/proposals/received', authenticate, async (req, res, next) => {
  try {
    const rows = await listTrocProposalsReceived(query, req.user.id);
    return res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/proposals/sent', authenticate, async (req, res, next) => {
  try {
    const rows = await listTrocProposalsSent(query, req.user.id);
    return res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/proposals', authenticate, validate({ body: proposalSchema }), async (req, res, next) => {
  try {
    const result = await createTrocProposal(query, {
      listingId: Number(req.params.id),
      proposerId: req.user.id,
      payload: {
        ...req.body,
        complement_direction: normalizeComplementDirection(req.body.complement_direction),
      },
    });

    return res.status(201).json({
      data: {
        ...result.proposal,
        listing: result.listing,
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.patch('/proposals/:id/accept', authenticate, async (req, res, next) => {
  try {
    const result = await acceptTrocProposal(query, {
      proposalId: req.params.id,
      actorId: req.user.id,
    });
    return res.json({ data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

router.patch('/proposals/:id/decline', authenticate, async (req, res, next) => {
  try {
    const { proposalId, actorId } = { proposalId: req.params.id, actorId: req.user.id };
    const proposal = await loadProposalById(query, proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposition introuvable' });
    if (Number(actorId) !== Number(proposal.recipient_id)) {
      return res.status(403).json({ error: 'Non autorise' });
    }

    await query(
      `UPDATE troc_proposals
       SET status = 'declined', updated_at = NOW()
       WHERE id = $1`,
      [proposalId]
    );

    const targetUserId = Number(actorId) === Number(proposal.listing_owner_id)
      ? Number(proposal.proposer_id)
      : Number(proposal.listing_owner_id);

    await createNotification(targetUserId, {
      type: 'troc_declined',
      title: '❌ Proposition refusee',
      body: 'Votre proposition de troc a ete refusee.',
      href: `/troc/${proposal.listing_id}`,
    }).catch(() => {});

    await sendPushToUsers([targetUserId], {
      title: '❌ Proposition refusee',
      body: 'Votre proposition de troc a ete refusee.',
      data: { type: 'troc_declined', proposal_id: proposalId },
    }).catch(() => {});

    return res.json({ data: { proposalId, declined: true } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.patch('/proposals/:id/counter', authenticate, validate({ body: counterSchema }), async (req, res, next) => {
  try {
    const result = await counterTrocProposal(query, {
      proposalId: req.params.id,
      actorId: req.user.id,
      counterData: req.body,
    });
    return res.json({ data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.patch('/proposals/:id/complete', authenticate, async (req, res, next) => {
  try {
    const result = await completeTrocProposal(query, {
      proposalId: req.params.id,
      actorId: req.user.id,
    });
    return res.json({ data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/cycles', authenticate, async (req, res, next) => {
  try {
    const rows = await listTrocCycles(query, req.user.id);
    return res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.patch('/cycles/:id/confirm', authenticate, async (req, res, next) => {
  try {
    const result = await confirmTrocCycleParticipation(query, {
      cycleId: req.params.id,
      userId: req.user.id,
    });
    return res.json({ data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
          a.*,
          cat.id AS category_id,
          cat.name AS category_name,
          cat.slug AS category_slug,
          cat.icon AS category_icon,
          parent.name AS parent_category_name,
          parent.slug AS parent_category_slug,
          com.id AS commune_id,
          com.name AS commune_name,
          com.slug AS commune_slug,
          prov.name AS province_name,
          u.id AS seller_id,
          u.prenom AS seller_prenom,
          u.nom AS seller_nom,
          u.avatar_url AS seller_avatar,
          CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS seller_is_pro,
          u.trust_score AS seller_trust_score,
          u.trust_level AS seller_trust_level,
          u.note_moyenne AS seller_note,
          u.nb_avis AS seller_nb_avis,
          u.created_at AS seller_since,
          u.nb_annonces AS seller_nb_annonces,
          seller_com.name AS seller_commune_name,
          seller_prov.name AS seller_province_name,
          u.email_verified AS seller_email_verified,
          u.phone_verified AS seller_phone_verified,
          COALESCE(
            json_agg(
              json_build_object(
                'id', img.id,
                'url', img.url,
                'thumbnail_url', img.thumbnail_url,
                'variants', img.variants,
                'is_cover', img.is_cover
              )
              ORDER BY img.is_cover DESC, img.sort_order
            ) FILTER (WHERE img.id IS NOT NULL),
            '[]'
          ) AS images
       FROM annonces a
       LEFT JOIN categories cat    ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com      ON com.id = a.commune_id
       LEFT JOIN provinces prov    ON prov.id = com.province_id
       LEFT JOIN users u           ON u.id = a.user_id
       LEFT JOIN communes seller_com ON seller_com.id = u.commune_id
       LEFT JOIN provinces seller_prov ON seller_prov.id = seller_com.province_id
       LEFT JOIN annonce_images img ON img.annonce_id = a.id
       WHERE a.id = $1 AND a.deleted_at IS NULL AND COALESCE(a.is_troc, FALSE) = TRUE
       GROUP BY a.id, cat.id, parent.id, com.id, prov.id, u.id, seller_com.id, seller_prov.id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    const listing = result.rows[0];
    if (req.user) {
      const viewerListings = await loadViewerTrocListings(req.user.id);
      listing.compatibility = getTrocCompatibilityScore(listing, viewerListings);
    } else {
      listing.compatibility = null;
    }

    return res.json(mapListingDetailResponse(listing));
  } catch (err) {
    next(err);
  }
});

router.post('/swipes', authenticate, validate({ body: swipeSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const listingId = Number(req.body.listing_id);
    const direction = req.body.direction;

    await query(
      `INSERT INTO troc_swipes (user_id, listing_id, direction)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, listing_id) DO UPDATE SET direction = EXCLUDED.direction, created_at = NOW()`,
      [userId, listingId, direction]
    );

    return res.json({ ok: true, data: { listing_id: listingId, direction } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
