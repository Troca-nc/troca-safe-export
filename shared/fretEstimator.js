'use strict';

function toNumber(value, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeFreightInputs(input = {}) {
  return {
    volumeM3: Math.max(0.1, toNumber(input.volume_m3 ?? input.volumeM3, 0.1)),
    weightKg: Math.max(0, toNumber(input.weight_kg ?? input.weightKg, 0)),
    distanceKm: Math.max(1, toNumber(input.distance_km ?? input.distanceKm, 18)),
  };
}

function estimateFreightQuote(input = {}) {
  const { volumeM3, weightKg, distanceKm } = normalizeFreightInputs(input);
  const base = 4500;
  const volumeCost = Math.round(volumeM3 * 2400);
  const weightCost = Math.round(weightKg * 12);
  const distanceCost = Math.round(distanceKm * 115);
  const handlingCost = weightKg > volumeM3 * 220 ? 1200 : 0;
  const urgencyCost = String(input.urgency ?? 'standard') === 'express' ? 1800 : 0;
  const total = base + volumeCost + weightCost + distanceCost + handlingCost + urgencyCost;

  return {
    base_price_xpf: base,
    volume_cost_xpf: volumeCost,
    weight_cost_xpf: weightCost,
    distance_cost_xpf: distanceCost,
    handling_cost_xpf: handlingCost,
    urgency_cost_xpf: urgencyCost,
    estimated_total_xpf: total,
    estimated_total_per_m3_xpf: Math.round(total / volumeM3),
    estimated_min_duration_hours: Math.max(1, Math.round(distanceKm / 20) + 1),
    estimated_max_duration_hours: Math.max(2, Math.round(distanceKm / 14) + 2),
    volume_m3: volumeM3,
    weight_kg: weightKg,
    distance_km: distanceKm,
  };
}

module.exports = {
  estimateFreightQuote,
  normalizeFreightInputs,
};
