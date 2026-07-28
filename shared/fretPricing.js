'use strict';

const { GEO_DATA } = require('./geoData');

const VOLUME_BUCKETS = {
  lt_0_5: { label: '< 0,5 m³', min_xpf: 0, max_xpf: 0 },
  range_0_5_2: { label: '0,5–2 m³', min_xpf: 1_200, max_xpf: 2_400 },
  range_2_10: { label: '2–10 m³', min_xpf: 3_600, max_xpf: 7_200 },
  gt_10: { label: '> 10 m³', min_xpf: 7_500, max_xpf: 14_500 },
};

const WEIGHT_BUCKETS = {
  lt_10: { label: '< 10 kg', min_xpf: 0, max_xpf: 0 },
  range_10_50: { label: '10–50 kg', min_xpf: 600, max_xpf: 1_200 },
  range_50_200: { label: '50–200 kg', min_xpf: 1_800, max_xpf: 3_600 },
  gt_200: { label: '> 200 kg', min_xpf: 4_500, max_xpf: 8_500 },
};

const URGENCY_BUCKETS = {
  h24: { label: 'Dans les 24h', min_xpf: 2_400, max_xpf: 4_800 },
  week: { label: 'Dans la semaine', min_xpf: 900, max_xpf: 1_800 },
  flexible: { label: 'Date flexible', min_xpf: 0, max_xpf: 0 },
};

const ROUTE_REFERENCE_TABLE = {
  'dumbea|noumea': { distance_km: 13, reference_price_xpf: 5_600 },
  'mont-dore|noumea': { distance_km: 18, reference_price_xpf: 6_800 },
  'noumea|paita': { distance_km: 24, reference_price_xpf: 8_200 },
  'boulouparis|noumea': { distance_km: 56, reference_price_xpf: 14_500 },
  'la-foa|noumea': { distance_km: 84, reference_price_xpf: 18_500 },
  'bourail|noumea': { distance_km: 157, reference_price_xpf: 25_500 },
  'kone|noumea': { distance_km: 230, reference_price_xpf: 33_500 },
  'koumac|noumea': { distance_km: 360, reference_price_xpf: 44_000 },
  'poindimie|noumea': { distance_km: 340, reference_price_xpf: 40_500 },
  'touho|noumea': { distance_km: 320, reference_price_xpf: 38_500 },
  'hienghene|noumea': { distance_km: 355, reference_price_xpf: 41_500 },
  'pouembout|noumea': { distance_km: 210, reference_price_xpf: 31_000 },
  'lifou|noumea': { distance_km: 410, reference_price_xpf: 52_000 },
  'mare|noumea': { distance_km: 390, reference_price_xpf: 49_000 },
  'ouvea|noumea': { distance_km: 440, reference_price_xpf: 55_000 },
  'dumbea|mont-dore': { distance_km: 12, reference_price_xpf: 4_900 },
  'dumbea|paita': { distance_km: 11, reference_price_xpf: 5_400 },
  'mont-dore|paita': { distance_km: 20, reference_price_xpf: 7_900 },
  'boulouparis|paita': { distance_km: 34, reference_price_xpf: 9_100 },
  'bourail|la-foa': { distance_km: 43, reference_price_xpf: 9_200 },
  'bourail|kone': { distance_km: 115, reference_price_xpf: 15_500 },
  'kone|koumac': { distance_km: 68, reference_price_xpf: 8_100 },
  'kone|poindimie': { distance_km: 64, reference_price_xpf: 7_800 },
  'lifou|mare': { distance_km: 32, reference_price_xpf: 9_200 },
  'lifou|ouvea': { distance_km: 58, reference_price_xpf: 11_200 },
  'mare|ouvea': { distance_km: 54, reference_price_xpf: 10_400 },
};

const PROVINCE_REFERENCE_TABLE = {
  'province-sud|province-sud': { distance_km: 18, reference_price_xpf: 5_200 },
  'province-nord|province-nord': { distance_km: 44, reference_price_xpf: 11_000 },
  'province-iles|province-iles': { distance_km: 26, reference_price_xpf: 8_600 },
  'province-sud|province-nord': { distance_km: 240, reference_price_xpf: 29_500 },
  'province-sud|province-iles': { distance_km: 365, reference_price_xpf: 48_500 },
  'province-nord|province-iles': { distance_km: 250, reference_price_xpf: 36_500 },
};

function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase();
}

function makeRouteKey(a, b) {
  return [normalizeSlug(a), normalizeSlug(b)].sort().join('|');
}

function findCommuneContext(communeSlug) {
  const slug = normalizeSlug(communeSlug);
  if (!slug) return null;

  for (const province of Object.values(GEO_DATA)) {
    const communeIndex = province.communes.findIndex((commune) => commune.slug === slug);
    if (communeIndex >= 0) {
      return {
        provinceSlug: province.slug,
        provinceName: province.name,
        communeIndex,
        communeName: province.communes[communeIndex].name,
      };
    }
  }

  return null;
}

function resolveRouteReference(departureSlug, destinationSlug) {
  const from = normalizeSlug(departureSlug);
  const to = normalizeSlug(destinationSlug);
  if (!from || !to) {
    return {
      distance_km: 18,
      reference_price_xpf: 5_000,
    };
  }

  if (from === to) {
    return {
      distance_km: 6,
      reference_price_xpf: 3_900,
    };
  }

  const explicit = ROUTE_REFERENCE_TABLE[makeRouteKey(from, to)];
  if (explicit) {
    return explicit;
  }

  const fromContext = findCommuneContext(from);
  const toContext = findCommuneContext(to);
  if (!fromContext || !toContext) {
    return {
      distance_km: 24,
      reference_price_xpf: 6_000,
    };
  }

  const provinceKey = makeRouteKey(fromContext.provinceSlug, toContext.provinceSlug);
  const provinceReference = PROVINCE_REFERENCE_TABLE[provinceKey];

  if (!provinceReference) {
    return {
      distance_km: 30,
      reference_price_xpf: 6_800,
    };
  }

  const sameProvince = fromContext.provinceSlug === toContext.provinceSlug;
  const communeDelta = sameProvince ? Math.abs(fromContext.communeIndex - toContext.communeIndex) : 0;

  return {
    distance_km: provinceReference.distance_km + (sameProvince ? communeDelta * 8 : 0),
    reference_price_xpf: provinceReference.reference_price_xpf + (sameProvince ? communeDelta * 650 : 0),
  };
}

function getBucketConfig(bucketMap, bucketKey, fallbackKey) {
  return bucketMap[bucketKey] || bucketMap[fallbackKey] || Object.values(bucketMap)[0];
}

function estimateFreightQuote({
  departureSlug,
  destinationSlug,
  volumeBucket,
  weightBucket,
  urgency = 'flexible',
}) {
  const route = resolveRouteReference(departureSlug, destinationSlug);
  const volumeConfig = getBucketConfig(VOLUME_BUCKETS, volumeBucket, 'range_0_5_2');
  const weightConfig = getBucketConfig(WEIGHT_BUCKETS, weightBucket, 'lt_10');
  const urgencyConfig = getBucketConfig(URGENCY_BUCKETS, urgency, 'flexible');

  const estimatedMinXpf = Math.max(
    0,
    route.reference_price_xpf + volumeConfig.min_xpf + weightConfig.min_xpf + urgencyConfig.min_xpf
  );

  const estimatedMaxXpf = Math.max(
    estimatedMinXpf,
    route.reference_price_xpf + volumeConfig.max_xpf + weightConfig.max_xpf + urgencyConfig.max_xpf
  );

  return {
    route_reference_xpf: route.reference_price_xpf,
    distance_km: route.distance_km,
    volume_label: volumeConfig.label,
    weight_label: weightConfig.label,
    urgency_label: urgencyConfig.label,
    estimated_min_xpf: estimatedMinXpf,
    estimated_max_xpf: estimatedMaxXpf,
    recommended_total_xpf: Math.round((estimatedMinXpf + estimatedMaxXpf) / 2),
  };
}

module.exports = {
  VOLUME_BUCKETS,
  WEIGHT_BUCKETS,
  URGENCY_BUCKETS,
  estimateFreightQuote,
  findCommuneContext,
  resolveRouteReference,
};
