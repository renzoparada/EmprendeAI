/**
 * CAP TABLE ENGINE — dilución, rondas de inversión y waterfall de salida
 * (spec §16.2-16.4, fórmulas 21.9-21.10). Determinístico y puro (spec §27).
 */

// ---------------------------------------------------------------------------
// 21.9 — Dilución y Cap Table
// ---------------------------------------------------------------------------

/** % Participación = Acciones del socio / Acciones totales. */
export function computeOwnershipPct(shares: number, totalShares: number): number {
  return totalShares > 0 ? (shares / totalShares) * 100 : 0;
}

/** Precio por acción = Valoración Pre-Money / Acciones existentes pre-ronda. */
export function computePricePerShare(preMoneyValuation: number, existingShares: number): number {
  return existingShares > 0 ? preMoneyValuation / existingShares : 0;
}

/** Acciones nuevas emitidas = Monto invertido / Precio por acción. */
export function computeNewSharesIssued(investmentAmount: number, pricePerShare: number): number {
  return pricePerShare > 0 ? investmentAmount / pricePerShare : 0;
}

/** Dilución del socio (%) = % antes − % después. */
export function computeDilutionPct(pctBefore: number, pctAfter: number): number {
  return pctBefore - pctAfter;
}

export interface CapTableHolding {
  shareholderId: string;
  shareholderName: string;
  shares: number;
}

export interface FundingRoundSimulationInput {
  currentHoldings: CapTableHolding[];
  preMoneyValuation: number;
  investmentAmount: number;
  newInvestorName: string;
}

export interface FundingRoundHoldingResult {
  shareholderId: string;
  shareholderName: string;
  sharesBefore: number;
  pctBefore: number;
  sharesAfter: number;
  pctAfter: number;
  dilutionPct: number;
  isNewInvestor: boolean;
}

export interface FundingRoundSimulationResult {
  pricePerShare: number;
  newSharesIssued: number;
  postMoneyValuation: number;
  totalSharesBefore: number;
  totalSharesAfter: number;
  holdings: FundingRoundHoldingResult[];
}

/**
 * Simula una ronda de inversión (spec §16.3): monto a levantar + valoración
 * pre-money → post-money, % a ceder y nueva estructura de cap table con
 * dilución por socio. No persiste nada — es una simulación de solo lectura.
 */
export function simulateFundingRound(input: FundingRoundSimulationInput): FundingRoundSimulationResult {
  const totalSharesBefore = input.currentHoldings.reduce((sum, h) => sum + h.shares, 0);
  const pricePerShare = computePricePerShare(input.preMoneyValuation, totalSharesBefore);
  const newSharesIssued = computeNewSharesIssued(input.investmentAmount, pricePerShare);
  const totalSharesAfter = totalSharesBefore + newSharesIssued;
  const postMoneyValuation = input.preMoneyValuation + input.investmentAmount;

  const holdings: FundingRoundHoldingResult[] = input.currentHoldings.map((h) => {
    const pctBefore = computeOwnershipPct(h.shares, totalSharesBefore);
    const pctAfter = computeOwnershipPct(h.shares, totalSharesAfter);
    return {
      shareholderId: h.shareholderId,
      shareholderName: h.shareholderName,
      sharesBefore: h.shares,
      pctBefore,
      sharesAfter: h.shares,
      pctAfter,
      dilutionPct: computeDilutionPct(pctBefore, pctAfter),
      isNewInvestor: false,
    };
  });

  holdings.push({
    shareholderId: "__new_investor__",
    shareholderName: input.newInvestorName || "Nuevo inversionista",
    sharesBefore: 0,
    pctBefore: 0,
    sharesAfter: newSharesIssued,
    pctAfter: computeOwnershipPct(newSharesIssued, totalSharesAfter),
    dilutionPct: 0,
    isNewInvestor: true,
  });

  return { pricePerShare, newSharesIssued, postMoneyValuation, totalSharesBefore, totalSharesAfter, holdings };
}

// ---------------------------------------------------------------------------
// 21.10 — Waterfall de salida
// ---------------------------------------------------------------------------

export interface WaterfallPreferredEntry {
  shareholderId: string;
  shareholderName: string;
  investedAmount: number;
  liquidationPreferenceMultiple: number;
}

export interface WaterfallCommonEntry {
  shareholderId: string;
  shareholderName: string;
  shares: number;
}

export interface WaterfallDistribution {
  shareholderId: string;
  shareholderName: string;
  amount: number;
}

export interface WaterfallResult {
  debtPayment: number;
  preferredDistribution: WaterfallDistribution[];
  commonDistribution: WaterfallDistribution[];
  remainderUndistributed: number;
}

/**
 * Orden de prelación (spec §16.4/21.10):
 *   1. Pago de deuda pendiente
 *   2. Preferencia de liquidación de preferentes (monto invertido × múltiplo)
 *   3. Reparto del remanente entre comunes, pro-rata por % de participación
 * Preferentes no-participantes: reciben su preferencia y no comparten el
 * remanente (el modelo más simple y común, spec no pide participación doble).
 */
export function computeExitWaterfall(
  exitPrice: number,
  debtOutstanding: number,
  preferred: WaterfallPreferredEntry[],
  common: WaterfallCommonEntry[]
): WaterfallResult {
  let remaining = Math.max(0, exitPrice);

  const debtPayment = Math.min(remaining, Math.max(0, debtOutstanding));
  remaining -= debtPayment;

  const preferredDistribution: WaterfallDistribution[] = preferred.map((p) => {
    const claim = p.investedAmount * p.liquidationPreferenceMultiple;
    const paid = Math.min(remaining, Math.max(0, claim));
    remaining -= paid;
    return { shareholderId: p.shareholderId, shareholderName: p.shareholderName, amount: paid };
  });

  const totalCommonShares = common.reduce((sum, c) => sum + c.shares, 0);
  const commonDistribution: WaterfallDistribution[] = common.map((c) => ({
    shareholderId: c.shareholderId,
    shareholderName: c.shareholderName,
    amount: totalCommonShares > 0 ? remaining * (c.shares / totalCommonShares) : 0,
  }));

  const distributedToCommon = commonDistribution.reduce((sum, d) => sum + d.amount, 0);

  return {
    debtPayment,
    preferredDistribution,
    commonDistribution,
    remainderUndistributed: remaining - distributedToCommon,
  };
}
