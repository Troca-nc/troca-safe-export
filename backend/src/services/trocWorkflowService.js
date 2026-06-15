'use strict';

const { query: defaultQuery, withTransaction } = require('../config/database');
const { createNotification } = require('./notificationService');
const { sendPushToUser, sendPushToUsers } = require('./pushService');
const { sendMail } = require('./emailService');
const { enqueueTrocMatching } = require('./trocQueueService');
const {
  getTrocCompatibilityScore,
  detectTrocCycles,
  listingIsOpenTroc,
  normalizeTrocWants,
  listingMatchesNeed,
} = require('./trocService');

function getDbRunner(db = defaultQuery) {
  if (typeof db === 'function') return db;
  if (db && typeof db.query === 'function') return db.query.bind(db);
  return defaultQuery;
}

function makeError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function xpf(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} XPF`;
}

function formatName(firstName, lastName) {
  return `${firstName || ''} ${lastName || ''}`.trim() || 'Un utilisateur';
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeComplementDirection(value) {
  const normalized = String(value || 'none').trim();
  return ['none', 'i_pay', 'they_pay'].includes(normalized) ? normalized : 'none';
}

async function loadTrocListing(db, listingId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT
       a.id, a.user_id, a.titre, a.description, a.prix, a.category_id, a.commune_id,
       a.is_troc, a.troc_wants, a.troc_accepts_complement_xpf, a.troc_complement_max_xpf,
       a.troc_status, a.status, a.created_at,
       cat.name AS category_name,
       cat.slug AS category_slug,
       cat.icon AS category_icon,
       u.prenom AS seller_prenom,
       u.nom AS seller_nom,
       u.email AS seller_email,
       u.avatar_url AS seller_avatar,
       u.expo_push_token AS seller_push_token,
       CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS seller_is_pro
     FROM annonces a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.id = $1 AND a.deleted_at IS NULL`,
    [listingId]
  );

  return result.rows[0] || null;
}

async function loadProposalById(db, proposalId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT
       p.*,
       l.titre AS listing_title,
       l.user_id AS listing_owner_id,
       l.troc_status AS listing_troc_status,
       l.troc_wants AS listing_troc_wants,
       l.troc_accepts_complement_xpf AS listing_accepts_complement_xpf,
       l.troc_complement_max_xpf AS listing_complement_max_xpf,
       l.is_troc AS listing_is_troc,
       owner.prenom AS owner_prenom,
       owner.nom AS owner_nom,
       owner.email AS owner_email,
       owner.expo_push_token AS owner_push_token,
       proposer.prenom AS proposer_prenom,
       proposer.nom AS proposer_nom,
       proposer.email AS proposer_email,
       proposer.expo_push_token AS proposer_push_token
     FROM troc_proposals p
     JOIN annonces l ON l.id = p.listing_id
     JOIN users owner ON owner.id = l.user_id
     JOIN users proposer ON proposer.id = p.proposer_id
     WHERE p.id = $1`,
    [proposalId]
  );

  const proposal = result.rows[0] || null;
  if (!proposal) return null;

  const parentResult = await q(
    `SELECT id, proposer_id
     FROM troc_proposals
     WHERE counter_proposal_id = $1
     LIMIT 1`,
    [proposalId]
  );

  const parent = parentResult.rows[0] || null;
  proposal.parent_proposal_id = parent?.id || null;
  proposal.parent_proposer_id = parent?.proposer_id || null;
  proposal.recipient_id = parent?.proposer_id || proposal.listing_owner_id;
  return proposal;
}

async function loadProposalHydration(db, proposalRows) {
  const q = getDbRunner(db);
  const ids = proposalRows.flatMap((row) => parseJsonArray(row.offered_listing_ids));
  if (!ids.length) {
    return proposalRows.map((row) => ({ ...row, offered_listings: [] }));
  }

  const { rows } = await q(
    `SELECT
       a.id,
       a.titre AS title,
       a.description,
       a.prix AS price,
       a.category_id,
       a.is_troc,
       a.troc_wants,
       a.troc_accepts_complement_xpf,
       a.troc_complement_max_xpf,
       a.troc_status,
       a.created_at,
       cat.name AS category_name,
       cat.slug AS category_slug,
       u.id AS seller_id,
       u.prenom AS seller_prenom,
       u.nom AS seller_nom
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.id = ANY($1::int[])`,
    [ids]
  );

  const map = new Map(rows.map((row) => [Number(row.id), row]));
  return proposalRows.map((row) => ({
    ...row,
    offered_listing_ids: parseJsonArray(row.offered_listing_ids),
    offered_listings: parseJsonArray(row.offered_listing_ids).map((id) => map.get(Number(id))).filter(Boolean),
    counter_proposal: row.counter_proposal ? {
      ...row.counter_proposal,
      offered_listing_ids: parseJsonArray(row.counter_proposal.offered_listing_ids),
    } : null,
  }));
}

function proposalVisibilityStatus(row, userId) {
  if (Number(row.proposer_id) === Number(userId)) return 'sent';
  if (Number(row.listing_owner_id) === Number(userId)) return 'received';
  return 'other';
}

async function validateProposalOwnership(db, listingId, proposerId) {
  const listing = await loadTrocListing(db, listingId);
  if (!listing) throw makeError(404, 'Annonce troc introuvable');
  if (!listingIsOpenTroc(listing)) throw makeError(400, 'Cette annonce troc nest plus disponible');
  if (Number(listing.user_id) === Number(proposerId)) {
    throw makeError(400, 'Vous ne pouvez pas proposer un troc sur votre propre annonce');
  }
  return listing;
}

function validateProposalPayload(listing, proposerListings, payload) {
  const offeredListingIds = Array.isArray(payload.offered_listing_ids)
    ? payload.offered_listing_ids.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
    : [];
  const offeredDescription = String(payload.offered_description || '').trim();
  const offeredPhotos = Array.isArray(payload.offered_photos)
    ? payload.offered_photos.map((value) => String(value).trim()).filter(Boolean)
    : [];
  const complementXpf = Number(payload.complement_xpf || 0);
  const complementDirection = normalizeComplementDirection(payload.complement_direction);
  const message = String(payload.message || '').trim() || null;

  if (!offeredListingIds.length && !offeredDescription && !offeredPhotos.length) {
    throw makeError(400, 'Veuillez decrire ce que vous proposez en echange');
  }

  if (complementDirection !== 'none' && complementXpf <= 0) {
    throw makeError(400, 'Le complement XPF doit etre superieur a 0');
  }

  if (!listing.troc_accepts_complement_xpf && complementXpf > 0) {
    throw makeError(400, 'Cette annonce naccepte pas de complement XPF');
  }

  if (listing.troc_accepts_complement_xpf && listing.troc_complement_max_xpf > 0 && complementXpf > listing.troc_complement_max_xpf) {
    throw makeError(400, 'Le complement depasse le maximum accepte');
  }

  if (offeredListingIds.length) {
    const allowedIds = new Set((proposerListings || []).map((row) => Number(row.id)));
    const invalid = offeredListingIds.filter((id) => !allowedIds.has(id));
    if (invalid.length) {
      throw makeError(403, 'Vous ne pouvez proposer que vos propres annonces');
    }
  }

  return {
    offered_listing_ids: offeredListingIds,
    offered_description: offeredDescription || null,
    offered_photos: offeredPhotos,
    complement_xpf: complementDirection === 'none' ? 0 : complementXpf,
    complement_direction: complementDirection,
    message,
  };
}

async function ensureConversationForTroc(db, { listingId, ownerId, proposerId, proposalId, conversationType = 'troc_negotiation', metadata = {} }) {
  const q = getDbRunner(db);
  const existing = await q(
    `SELECT id
     FROM conversations
     WHERE annonce_id = $1 AND buyer_id = $2
     LIMIT 1`,
    [listingId, proposerId]
  );

  if (existing.rows[0]) {
    const updated = await q(
      `UPDATE conversations
       SET conversation_type = $2,
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [existing.rows[0].id, conversationType, JSON.stringify(metadata)]
    );
    return updated.rows[0];
  }

  const created = await q(
    `INSERT INTO conversations
       (annonce_id, buyer_id, seller_id, conversation_type, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [listingId, proposerId, ownerId, conversationType, JSON.stringify(metadata)]
  );

  return created.rows[0];
}

async function sendTrocProposalNotifications(db, proposal, listing, recipient, actorName) {
  const recipientName = formatName(recipient?.prenom, recipient?.nom);
  const listingTitle = listing?.titre || listing?.title || 'votre annonce';
  const summary = proposal.offered_description || (
    proposal.offered_listing_ids?.length
      ? `${proposal.offered_listing_ids.length} annonce(s) proposee(s)`
      : 'Nouvelle proposition de troc'
  );

  await createNotification(recipient.id, {
    type: 'troc_proposal',
    title: `🔄 ${actorName} veut troquer avec vous`,
    body: listingTitle,
    href: `/troc/${listing.id}`,
  }).catch(() => {});

  await sendPushToUser(recipient.id, {
    title: `🔄 ${actorName} veut troquer avec vous`,
    body: listingTitle,
    data: { type: 'troc_proposal', listing_id: listing.id, proposal_id: proposal.id },
  }).catch(() => {});

  if (recipient.email) {
    await sendMail({
      to: recipient.email,
      subject: `🔄 ${actorName} veut troquer avec vous`,
      html: `<p>Bonjour ${recipientName},</p>
        <p>Vous avez reçu une proposition de troc pour <strong>${listingTitle}</strong>.</p>
        <p><strong>${actorName}</strong> propose: ${summary}</p>
        <p><a href="${process.env.BASE_URL || 'https://kalico.nc'}/troc/${listing.id}">Voir la proposition</a></p>`,
    }).catch(() => {});
  }
}

async function createTrocProposal(db, { listingId, proposerId, payload }) {
  const q = getDbRunner(db);
  const listing = await validateProposalOwnership(q, listingId, proposerId);

  const proposerListingsResult = await q(
    `SELECT id, titre, description, prix, category_id, is_troc, troc_wants, troc_accepts_complement_xpf, troc_complement_max_xpf, troc_status
     FROM annonces
     WHERE user_id = $1
       AND deleted_at IS NULL
       AND status = 'active'`,
    [proposerId]
  );

  const normalized = validateProposalPayload(listing, proposerListingsResult.rows, payload);

  const created = await q(
    `INSERT INTO troc_proposals
       (listing_id, proposer_id, offered_listing_ids, offered_description, offered_photos,
        complement_xpf, complement_direction, message, status, expires_at)
     VALUES ($1, $2, $3::int[], $4, $5::text[], $6, $7, $8, 'pending', NOW() + make_interval(days => $9))
     RETURNING *`,
    [
      listing.id,
      proposerId,
      normalized.offered_listing_ids,
      normalized.offered_description,
      normalized.offered_photos,
      normalized.complement_xpf,
      normalized.complement_direction,
      normalized.message,
      Number(process.env.TROC_PROPOSAL_EXPIRY_DAYS || 7),
    ]
  );

  const proposal = created.rows[0];
  const recipient = {
    id: Number(listing.user_id),
    prenom: listing.seller_prenom,
    nom: listing.seller_nom,
    email: listing.seller_email,
  };

  const proposerRows = await q(
    `SELECT prenom, nom
     FROM users
     WHERE id = $1`,
    [proposerId]
  );
  const proposerName = formatName(proposerRows.rows[0]?.prenom, proposerRows.rows[0]?.nom);

  await sendTrocProposalNotifications(q, proposal, listing, recipient, proposerName);
  enqueueTrocMatching(listing.id).catch(() => {});

  return {
    proposal,
    listing,
    recipient,
  };
}

async function listTrocProposalsReceived(db, userId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT
       p.*,
       l.titre AS listing_title,
       l.user_id AS listing_owner_id,
       owner.prenom AS owner_prenom,
       owner.nom AS owner_nom,
       owner.email AS owner_email,
       proposer.prenom AS proposer_prenom,
       proposer.nom AS proposer_nom,
       proposer.email AS proposer_email
     FROM troc_proposals p
     JOIN annonces l ON l.id = p.listing_id
     JOIN users owner ON owner.id = l.user_id
     JOIN users proposer ON proposer.id = p.proposer_id
     WHERE l.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return loadProposalHydration(q, result.rows);
}

async function listTrocProposalsSent(db, userId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT
       p.*,
       l.titre AS listing_title,
       l.user_id AS listing_owner_id,
       owner.prenom AS owner_prenom,
       owner.nom AS owner_nom,
       owner.email AS owner_email,
       proposer.prenom AS proposer_prenom,
       proposer.nom AS proposer_nom,
       proposer.email AS proposer_email,
       counter.id AS counter_id,
       counter.proposer_id AS counter_proposer_id,
       counter.offered_listing_ids AS counter_offered_listing_ids,
       counter.offered_description AS counter_offered_description,
       counter.offered_photos AS counter_offered_photos,
       counter.complement_xpf AS counter_complement_xpf,
       counter.complement_direction AS counter_complement_direction,
       counter.status AS counter_status,
       counter.message AS counter_message,
       counter.created_at AS counter_created_at,
       counter.expires_at AS counter_expires_at
     FROM troc_proposals p
     JOIN annonces l ON l.id = p.listing_id
     JOIN users owner ON owner.id = l.user_id
     JOIN users proposer ON proposer.id = p.proposer_id
     LEFT JOIN troc_proposals counter ON counter.id = p.counter_proposal_id
     WHERE p.proposer_id = $1
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [userId]
  );

  const proposals = await loadProposalHydration(q, result.rows.map((row) => ({
    ...row,
    counter_proposal: row.counter_id ? {
      id: row.counter_id,
      proposer_id: row.counter_proposer_id,
      offered_listing_ids: row.counter_offered_listing_ids,
      offered_description: row.counter_offered_description,
      offered_photos: row.counter_offered_photos,
      complement_xpf: row.counter_complement_xpf,
      complement_direction: row.counter_complement_direction,
      status: row.counter_status,
      message: row.counter_message,
      created_at: row.counter_created_at,
      expires_at: row.counter_expires_at,
    } : null,
  })));

  return proposals;
}

async function resolveTrocProposalRecipient(db, proposalId) {
  const proposal = await loadProposalById(db, proposalId);
  if (!proposal) throw makeError(404, 'Proposition introuvable');
  const parent = proposal.parent_proposal_id ? await loadProposalById(db, proposal.parent_proposal_id) : null;
  const recipientId = parent ? Number(parent.proposer_id) : Number(proposal.listing_owner_id);
  return { proposal, parent, recipientId };
}

async function acceptTrocProposal(db, { proposalId, actorId }) {
  const q = getDbRunner(db);
  const { proposal, parent, recipientId } = await resolveTrocProposalRecipient(q, proposalId);
  if (Number(actorId) !== Number(recipientId)) {
    throw makeError(403, 'Non autorise');
  }
  if (proposal.status !== 'pending' && proposal.status !== 'seen') {
    throw makeError(409, 'Cette proposition a deja ete traitee');
  }
  if (parent && parent.status === 'countered') {
    // Accepting a counter proposal is allowed, but the parent remains countered.
  } else if (!parent && proposal.counter_proposal_id) {
    throw makeError(409, 'Une contre-proposition existe deja pour cette proposition');
  }

  const result = await withTransaction(async (client) => {
    const updated = await client.query(
      `UPDATE troc_proposals
       SET status = 'accepted', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [proposalId]
    );

    await client.query(
      `UPDATE annonces
       SET troc_status = 'negotiating', updated_at = NOW()
       WHERE id = $1`,
      [proposal.listing_id]
    );

    const conversation = await ensureConversationForTroc(client, {
      listingId: proposal.listing_id,
      ownerId: proposal.listing_owner_id,
      proposerId: proposal.proposer_id,
      proposalId,
      conversationType: 'troc_negotiation',
      metadata: { proposal_id: proposalId, parent_proposal_id: proposal.parent_proposal_id || null },
    });

    await client.query(
      `UPDATE troc_proposals
       SET conversation_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [proposalId, conversation.id]
    );

    if (proposal.parent_proposal_id) {
      await client.query(
        `UPDATE troc_proposals
         SET conversation_id = $2, updated_at = NOW()
         WHERE id = $1`,
        [proposal.parent_proposal_id, conversation.id]
      );
    }

    const systemMessage = await client.query(
      `INSERT INTO messages (conv_id, sender_id, type, content)
       VALUES ($1, $2, 'system', $3)
       RETURNING id, content, created_at, type, sender_id`,
      [conversation.id, actorId, '🤝 Proposition acceptee ! Discutez des modalites de l echange ici.']
    );

    await client.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversation.id]
    );

    return { proposal: updated.rows[0], conversation, message: systemMessage.rows[0] };
  });

  const otherUserId = Number(actorId) === Number(proposal.listing_owner_id)
    ? Number(proposal.proposer_id)
    : Number(proposal.listing_owner_id);

  const otherUserRows = await q(
    `SELECT prenom, nom, email FROM users WHERE id = $1`,
    [otherUserId]
  );
  const otherUser = otherUserRows.rows[0] || null;

  if (otherUser?.email) {
    await sendMail({
      to: otherUser.email,
      subject: '✅ Votre proposition de troc a ete acceptee',
      html: `<p>Bonjour ${formatName(otherUser.prenom, otherUser.nom)},</p>
        <p>Bonne nouvelle ! Votre proposition de troc a ete acceptee.</p>
        <p><a href="${process.env.BASE_URL || 'https://kalico.nc'}/messages/${result.conversation.id}">Discuter maintenant</a></p>`,
    }).catch(() => {});
  }

  await sendPushToUser(otherUserId, {
    title: '✅ Proposition acceptee !',
    body: 'Votre proposition de troc a ete acceptee.',
    data: { type: 'troc_accepted', conversation_id: result.conversation.id, proposal_id: proposalId },
  }).catch(() => {});

  await createNotification(otherUserId, {
    type: 'troc_accepted',
    title: '✅ Proposition acceptee !',
    body: 'Votre proposition de troc a ete acceptee.',
    href: `/messages/${result.conversation.id}`,
  }).catch(() => {});

  return result;
}

async function declineTrocProposal(db, { proposalId, actorId }) {
  const q = getDbRunner(db);
  const { proposal, parent, recipientId } = await resolveTrocProposalRecipient(q, proposalId);
  if (Number(actorId) !== Number(recipientId)) {
    throw makeError(403, 'Non autorise');
  }
  if (proposal.status !== 'pending' && proposal.status !== 'seen' && proposal.status !== 'countered') {
    throw makeError(409, 'Cette proposition a deja ete traitee');
  }

  await q(
    `UPDATE troc_proposals
     SET status = 'declined', updated_at = NOW()
     WHERE id = $1`,
    [proposalId]
  );

  const otherUserId = Number(actorId) === Number(proposal.listing_owner_id)
    ? Number(proposal.proposer_id)
    : Number(proposal.listing_owner_id);

  await sendPushToUser(otherUserId, {
    title: '❌ Proposition refusee',
    body: 'Votre proposition de troc a ete refusee.',
    data: { type: 'troc_declined', proposal_id: proposalId },
  }).catch(() => {});

  await createNotification(otherUserId, {
    type: 'troc_declined',
    title: '❌ Proposition refusee',
    body: 'Votre proposition de troc a ete refusee.',
    href: `/troc/${proposal.listing_id}`,
  }).catch(() => {});

  if (parent) {
    await q(
      `UPDATE troc_proposals
       SET updated_at = NOW()
       WHERE id = $1`,
      [parent.id]
    ).catch(() => {});
  }

  return { proposalId, declinedBy: actorId };
}

async function counterTrocProposal(db, { proposalId, actorId, counterData }) {
  const q = getDbRunner(db);
  const original = await loadProposalById(q, proposalId);
  if (!original) throw makeError(404, 'Proposition introuvable');
  if (Number(actorId) !== Number(original.listing_owner_id)) {
    throw makeError(403, 'Non autorise');
  }
  if (original.counter_proposal_id) {
    throw makeError(409, 'Une contre-proposition existe deja');
  }
  if (original.status !== 'pending' && original.status !== 'seen') {
    throw makeError(409, 'Cette proposition a deja ete traitee');
  }

  const listing = await loadTrocListing(q, original.listing_id);
  const ownerListingsResult = await q(
    `SELECT id, titre, description, prix, category_id, is_troc, troc_wants, troc_accepts_complement_xpf, troc_complement_max_xpf, troc_status
     FROM annonces
     WHERE user_id = $1
       AND deleted_at IS NULL
       AND status = 'active'`,
    [actorId]
  );

  const normalized = validateProposalPayload(listing, ownerListingsResult.rows, counterData);
  const created = await q(
    `INSERT INTO troc_proposals
       (listing_id, proposer_id, offered_listing_ids, offered_description, offered_photos,
        complement_xpf, complement_direction, message, status, expires_at)
     VALUES ($1, $2, $3::int[], $4, $5::text[], $6, $7, $8, 'pending', NOW() + make_interval(days => $9))
     RETURNING *`,
    [
      original.listing_id,
      actorId,
      normalized.offered_listing_ids,
      normalized.offered_description,
      normalized.offered_photos,
      normalized.complement_xpf,
      normalized.complement_direction,
      normalized.message,
      Number(process.env.TROC_PROPOSAL_EXPIRY_DAYS || 7),
    ]
  );

  await q(
    `UPDATE troc_proposals
     SET status = 'countered',
         counter_proposal_id = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [proposalId, created.rows[0].id]
  );

  const recipientId = Number(original.proposer_id);
  const owner = await q(`SELECT prenom, nom, email FROM users WHERE id = $1`, [actorId]);
  const proposer = await q(`SELECT prenom, nom, email FROM users WHERE id = $1`, [recipientId]);

  await createNotification(recipientId, {
    type: 'troc_countered',
    title: '↩️ Contre-proposition recue',
    body: `${formatName(owner.rows[0]?.prenom, owner.rows[0]?.nom)} vous propose un echange different`,
    href: `/troc/${original.listing_id}`,
  }).catch(() => {});

  await sendPushToUser(recipientId, {
    title: '↩️ Contre-proposition recue',
    body: `${formatName(owner.rows[0]?.prenom, owner.rows[0]?.nom)} vous propose un echange different`,
    data: { type: 'troc_countered', proposal_id: created.rows[0].id },
  }).catch(() => {});

  if (proposer.rows[0]?.email) {
    await sendMail({
      to: proposer.rows[0].email,
      subject: '↩️ Contre-proposition recue',
      html: `<p>Bonjour ${formatName(proposer.rows[0]?.prenom, proposer.rows[0]?.nom)},</p>
        <p>${formatName(owner.rows[0]?.prenom, owner.rows[0]?.nom)} vous a fait une contre-proposition pour votre troc.</p>
        <p><a href="${process.env.BASE_URL || 'https://kalico.nc'}/troc/${original.listing_id}">Voir la contre-proposition</a></p>`,
    }).catch(() => {});
  }

  enqueueTrocMatching(original.listing_id).catch(() => {});

  return {
    original,
    counterProposal: created.rows[0],
  };
}

async function completeTrocProposal(db, { proposalId, actorId }) {
  const q = getDbRunner(db);
  const { proposal } = await resolveTrocProposalRecipient(q, proposalId);
  const allowedIds = new Set([Number(proposal.listing_owner_id), Number(proposal.proposer_id)]);
  const parentRecipientId = proposal.parent_proposal_id
    ? Number(proposal.parent_proposer_id)
    : Number(proposal.listing_owner_id);
  allowedIds.add(parentRecipientId);
  if (!allowedIds.has(Number(actorId))) {
    throw makeError(403, 'Non autorise');
  }

  await q(
    `UPDATE troc_proposals
     SET status = 'completed', updated_at = NOW()
     WHERE id = $1`,
    [proposalId]
  );

  if (proposal.parent_proposal_id) {
    await q(
      `UPDATE troc_proposals
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND status <> 'completed'`,
      [proposal.parent_proposal_id]
    ).catch(() => {});
  }

  await q(
    `UPDATE annonces
     SET troc_status = 'completed', updated_at = NOW()
     WHERE id = $1`,
    [proposal.listing_id]
  );

  const completedBy = Number(actorId);
  const ownerId = Number(proposal.listing_owner_id);
  const proposerId = Number(proposal.proposer_id);
  const completedPairs = [completedBy, ownerId, proposerId].filter(Boolean);
  const badgeRows = [];

  const badgeCountResult = await q(
    `SELECT COUNT(*)::int AS total
     FROM troc_proposals
     WHERE status = 'completed'
       AND (proposer_id = $1 OR listing_id IN (SELECT id FROM annonces WHERE user_id = $1))`,
    [actorId]
  );

  const completedCount = Number(badgeCountResult.rows[0]?.total || 0);
  const badges = [
    { badge: 'first_troc', threshold: 1 },
    { badge: 'regular_trader', threshold: 5 },
    { badge: 'master_trader', threshold: 20 },
  ];

  for (const { badge, threshold } of badges) {
    if (completedCount >= threshold) {
      const inserted = await q(
        `INSERT INTO troc_badges (user_id, badge)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [actorId, badge]
      );
      if (inserted.rows[0]) badgeRows.push(inserted.rows[0]);
    }
  }

  return { proposalId, completedBy, badgeRows, completedPairs };
}

async function listTrocCycles(db, userId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT id, participant_ids, listing_ids, status, confirmations, detected_at, updated_at, expires_at
     FROM troc_cycles
     WHERE $1 = ANY(participant_ids)
     ORDER BY detected_at DESC
     LIMIT 50`,
    [userId]
  );
  return result.rows;
}

async function confirmTrocCycleParticipation(db, { cycleId, userId }) {
  const q = getDbRunner(db);
  const { rows } = await q(
    `UPDATE troc_cycles
     SET confirmations = CASE
           WHEN NOT ($2 = ANY(confirmations)) THEN array_append(confirmations, $2)
           ELSE confirmations
         END,
         updated_at = NOW()
     WHERE id = $1
       AND $2 = ANY(participant_ids)
     RETURNING *`,
    [cycleId, userId]
  );

  const cycle = rows[0];
  if (!cycle) throw makeError(404, 'Cycle introuvable');

  const allConfirmed = cycle.confirmations.length >= cycle.participant_ids.length;
  if (!allConfirmed) {
    return { cycle, conversation: null };
  }

  const updated = await q(
    `UPDATE troc_cycles
     SET status = 'all_accepted', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [cycleId]
  );
  const finalCycle = updated.rows[0] || cycle;

  const firstListing = Array.isArray(finalCycle.listing_ids) ? finalCycle.listing_ids[0] : null;
  const buyerId = finalCycle.participant_ids[0];
  const sellerId = finalCycle.participant_ids[1] || finalCycle.participant_ids[0];
  const conversation = await ensureConversationForTroc(q, {
    listingId: Number(firstListing || 0),
    ownerId: sellerId,
    proposerId: buyerId,
    proposalId: cycleId,
    conversationType: 'troc_cycle',
    metadata: {
      cycle_id: cycleId,
      participant_ids: finalCycle.participant_ids,
      listing_ids: finalCycle.listing_ids,
    },
  });

  await q(
    `UPDATE conversations
     SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [conversation.id, JSON.stringify({
      cycle_id: cycleId,
      participant_ids: finalCycle.participant_ids,
      listing_ids: finalCycle.listing_ids,
    })]
  );

  await q(
    `INSERT INTO messages (conv_id, sender_id, type, content)
     VALUES ($1, $2, 'system', $3)`,
    [conversation.id, userId, '🔄 Troc en chaine confirme par tous ! Organisez vos echanges ici.']
  ).catch(() => {});

  await sendPushToUsers(finalCycle.participant_ids, {
    title: '🎉 Troc en chaine confirme !',
    body: 'Tout le monde a dit oui. Organisez vos echanges maintenant.',
    data: { type: 'troc_cycle_confirmed', cycle_id: cycleId, conversation_id: conversation.id },
  }).catch(() => {});

  for (const participantId of finalCycle.participant_ids) {
    await createNotification(participantId, {
      type: 'troc_cycle_confirmed',
      title: '🎉 Troc en chaine confirme !',
      body: 'Tout le monde a dit oui. Organisez vos echanges maintenant.',
      href: `/messages/${conversation.id}`,
    }).catch(() => {});

    await q(
      `INSERT INTO troc_badges (user_id, badge)
       VALUES ($1, 'cycle_master')
       ON CONFLICT DO NOTHING`,
      [participantId]
    ).catch(() => {});
  }

  return { cycle: finalCycle, conversation };
}

async function awardTrocBadges(db, userId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT COUNT(*)::int AS total
     FROM troc_proposals
     WHERE status = 'completed'
       AND (proposer_id = $1 OR listing_id IN (SELECT id FROM annonces WHERE user_id = $1))`,
    [userId]
  );
  const count = Number(result.rows[0]?.total || 0);
  const badges = [
    { badge: 'first_troc', threshold: 1 },
    { badge: 'regular_trader', threshold: 5 },
    { badge: 'master_trader', threshold: 20 },
  ];

  for (const { badge, threshold } of badges) {
    if (count >= threshold) {
      await q(
        `INSERT INTO troc_badges (user_id, badge)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, badge]
      ).catch(() => {});
    }
  }

  return count;
}

async function getUserTrocBadges(db, userId) {
  const q = getDbRunner(db);
  const result = await q(
    `SELECT badge, earned_at
     FROM troc_badges
     WHERE user_id = $1
     ORDER BY earned_at DESC`,
    [userId]
  );
  return result.rows;
}

module.exports = {
  acceptTrocProposal,
  awardTrocBadges,
  completeTrocProposal,
  confirmTrocCycleParticipation,
  counterTrocProposal,
  createTrocProposal,
  detectTrocCycles,
  formatName,
  getTrocCompatibilityScore,
  getUserTrocBadges,
  listTrocCycles,
  listTrocProposalsReceived,
  listTrocProposalsSent,
  loadProposalById,
  loadTrocListing,
  normalizeComplementDirection,
  proposalVisibilityStatus,
  resolveTrocProposalRecipient,
  sendTrocProposalNotifications,
  validateProposalPayload,
  validateProposalOwnership,
  xpf,
};
