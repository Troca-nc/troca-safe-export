'use strict';

const ACCENT_RE = /[\u0300-\u036f]/g;

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(ACCENT_RE, '')
    .toLowerCase()
    .trim();
}

function normalizeTrocWants(input) {
  if (Array.isArray(input)) {
    return input
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(/[,\n|;/]+/g)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  return [];
}

function listingTerms(listing) {
  const terms = [
    listing?.title,
    listing?.titre,
    listing?.category_name,
    listing?.category_slug,
    listing?.category,
  ];

  return terms.map(normalizeText).filter(Boolean);
}

function listingMatchesNeed(needListing, offeredListing) {
  const wants = normalizeTrocWants(needListing?.troc_wants);
  if (!wants.length) return false;

  const offeredTerms = listingTerms(offeredListing);
  if (!offeredTerms.length) return false;

  return wants.some((want) => offeredTerms.some((term) => term.includes(want) || want.includes(term)));
}

function listingIsOpenTroc(listing) {
  return Boolean(listing?.is_troc) && (listing.troc_status ?? 'open') === 'open';
}

function getTrocCompatibilityScore(targetListing, viewerListings = [], options = {}) {
  if (!targetListing) {
    return null;
  }

  const matchingListings = viewerListings.filter((listing) => listingMatchesNeed(targetListing, listing));
  let score = Math.min(matchingListings.length * 40, 80);

  const targetOffersViewer = viewerListings.some((listing) => listingMatchesNeed(listing, targetListing));
  if (targetOffersViewer) {
    score += 30;
  }

  if (Boolean(targetListing.troc_accepts_complement_xpf) && Number(targetListing.troc_complement_max_xpf || 0) > 0) {
    const compatibleComplement = viewerListings.some((listing) => {
      const price = Number(listing?.price ?? listing?.prix ?? 0);
      return Number.isFinite(price) && price > 0 && price <= Number(targetListing.troc_complement_max_xpf || 0);
    });
    if (compatibleComplement) {
      score += 20;
    }
  }

  if (options.hasSuccessfulTroc) {
    score += 10;
  }

  score = Math.min(score, 100);

  return {
    score,
    label: score >= 80 ? 'Excellent' : score >= 50 ? 'Bon' : score > 0 ? 'Possible' : 'Faible',
    matching_listings: matchingListings,
    matching_count: matchingListings.length,
  };
}

function detectTrocCycles(anchorListing, listings = [], options = {}) {
  if (!anchorListing || !listingIsOpenTroc(anchorListing)) return [];

  const maxDepth = Number(options.maxDepth || 3);
  if (maxDepth < 3) return [];

  const cycles = [];
  const seen = new Set();

  const bCandidates = listings.filter((listing) =>
    listingIsOpenTroc(listing)
    && Number(listing.id) !== Number(anchorListing.id)
    && Number(listing.user_id) !== Number(anchorListing.user_id)
    && listingMatchesNeed(listing, anchorListing)
  );

  for (const b of bCandidates) {
    const cCandidates = listings.filter((listing) =>
      listingIsOpenTroc(listing)
      && Number(listing.id) !== Number(anchorListing.id)
      && Number(listing.id) !== Number(b.id)
      && Number(listing.user_id) !== Number(anchorListing.user_id)
      && Number(listing.user_id) !== Number(b.user_id)
      && listingMatchesNeed(listing, b)
      && listingMatchesNeed(anchorListing, listing)
    );

    for (const c of cCandidates) {
      const participantIds = [anchorListing.user_id, b.user_id, c.user_id].map((value) => Number(value));
      const listingIds = [anchorListing.id, b.id, c.id].map((value) => Number(value));
      const key = `${participantIds.join('-')}|${listingIds.join('-')}`;

      if (seen.has(key)) continue;
      seen.add(key);

      cycles.push({
        participant_ids: participantIds,
        listing_ids: listingIds,
        status: 'proposed',
        confirmations: [],
        detected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + ((Number(options.expiryHours || 48) * 60 * 60 * 1000))).toISOString(),
      });
    }
  }

  return cycles;
}

module.exports = {
  detectTrocCycles,
  getTrocCompatibilityScore,
  listingIsOpenTroc,
  listingMatchesNeed,
  normalizeTrocWants,
  normalizeText,
};
