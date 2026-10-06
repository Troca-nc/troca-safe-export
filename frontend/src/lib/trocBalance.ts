export const TROC_BALANCE_TOLERANCE = 0.1;
export const TROC_COMPLEMENT_STEP = 500;
export const TROC_MAX_BEAM_ANGLE = 14;

export type ComplementDirection = "offered" | "requested" | "none";

export interface TrocBalanceInput {
  offeredValue: number;
  requestedValue: number;
  complement?: number;
}

export interface TrocBalanceResult {
  offeredTotal: number;
  requestedTotal: number;
  difference: number;
  ratio: number;
  angle: number;
  isBalanced: boolean;
  suggestedComplement: number;
  suggestedDirection: ComplementDirection;
}

const finitePositive = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export const roundTrocComplement = (
  value: number,
  step = TROC_COMPLEMENT_STEP,
) => {
  const safeStep = finitePositive(step) || TROC_COMPLEMENT_STEP;
  return Math.round(finitePositive(value) / safeStep) * safeStep;
};

export function calculateTrocBalance({
  offeredValue,
  requestedValue,
  complement = 0,
}: TrocBalanceInput): TrocBalanceResult {
  const safeOfferedValue = finitePositive(offeredValue);
  const safeRequestedValue = finitePositive(requestedValue);
  const safeComplement = Number.isFinite(complement) ? complement : 0;
  const offeredTotal = safeOfferedValue + Math.max(safeComplement, 0);
  const requestedTotal = safeRequestedValue + Math.max(-safeComplement, 0);
  const difference = requestedTotal - offeredTotal;
  const largestTotal = Math.max(offeredTotal, requestedTotal, 1);
  const ratio = difference / largestTotal;
  const angle = Math.max(
    -TROC_MAX_BEAM_ANGLE,
    Math.min(TROC_MAX_BEAM_ANGLE, ratio * 26),
  );
  const suggestedComplement = roundTrocComplement(
    Math.abs(safeRequestedValue - safeOfferedValue),
  );

  return {
    offeredTotal,
    requestedTotal,
    difference,
    ratio,
    angle,
    isBalanced: Math.abs(difference) / largestTotal <= TROC_BALANCE_TOLERANCE,
    suggestedComplement,
    suggestedDirection:
      safeOfferedValue < safeRequestedValue
        ? "offered"
        : safeOfferedValue > safeRequestedValue
          ? "requested"
          : "none",
  };
}
