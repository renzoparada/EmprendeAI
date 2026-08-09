/**
 * PRICING ENGINE — Precificación Inteligente y Curva de Demanda (spec §6,
 * fórmula 21.11). Determinístico y puro, mismas reglas que financial.ts
 * (spec §27): sin I/O, sin IA, cada función cita la fórmula que implementa.
 */

export interface DemandPoint {
  price: number;
  quantity: number;
}

export interface LinearDemandCurve {
  /** Q = intercept + slope × P. `slope` es dQ/dP (normalmente negativo). */
  intercept: number;
  slope: number;
  /** R² del ajuste — qué tan confiable es la curva con los datos cargados. */
  rSquared: number;
  pointsUsed: number;
}

/**
 * Regresión lineal simple (mínimos cuadrados) de cantidad vendida sobre
 * precio, a partir de datos históricos reales (spec §6: "A partir de datos
 * históricos (precio, cantidad vendida): construye la curva"). Requiere al
 * menos 2 puntos con precios distintos — si no hay suficiente variación,
 * devuelve `null` en vez de inventar una curva.
 */
export function fitLinearDemandCurve(points: DemandPoint[]): LinearDemandCurve | null {
  if (points.length < 2) return null;

  const n = points.length;
  const meanP = points.reduce((s, p) => s + p.price, 0) / n;
  const meanQ = points.reduce((s, p) => s + p.quantity, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.price - meanP) * (p.quantity - meanQ);
    den += (p.price - meanP) ** 2;
  }
  if (den === 0) return null; // todos los precios son iguales, no hay variación que ajustar

  const slope = num / den;
  const intercept = meanQ - slope * meanP;

  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const predicted = intercept + slope * p.price;
    ssRes += (p.quantity - predicted) ** 2;
    ssTot += (p.quantity - meanQ) ** 2;
  }
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 1;

  return { intercept, slope, rSquared, pointsUsed: n };
}

export type ElasticityClass = "elastica" | "unitaria" | "inelastica";

export interface DemandElasticity {
  value: number;
  classification: ElasticityClass;
}

/**
 * Fórmula 21.11:
 *   E = (%ΔCantidad) / (%ΔPrecio)
 *   E < −1     → elástica
 *   E = −1     → unitaria
 *   −1 < E < 0 → inelástica
 * Se evalúa la derivada de la curva ajustada (slope = dQ/dP) en el punto
 * promedio de precio/cantidad de los datos cargados.
 */
export function computeElasticity(curve: LinearDemandCurve, atPrice: number, atQuantity: number): DemandElasticity {
  const value = atQuantity !== 0 ? curve.slope * (atPrice / atQuantity) : 0;
  let classification: ElasticityClass;
  if (value < -1.05) classification = "elastica";
  else if (value <= -0.95) classification = "unitaria";
  else classification = "inelastica";
  return { value, classification };
}

// ---------------------------------------------------------------------------
// Precios calculados (spec §6)
// ---------------------------------------------------------------------------

/** Precio mínimo: el que solo cubre el costo variable unitario (margen = 0). */
export function minPrice(unitVariableCost: number): number {
  return unitVariableCost;
}

/** Precio de equilibrio: cubre costo variable + la parte proporcional de costos fijos al volumen actual. */
export function breakEvenPrice(unitVariableCost: number, fixedCostsMonthly: number, unitsSoldMonthly: number): number {
  return unitsSoldMonthly > 0 ? unitVariableCost + fixedCostsMonthly / unitsSoldMonthly : Infinity;
}

/** Precio objetivo: el que logra el margen % que se propone el usuario. Margen% = (P−c)/P ⇒ P = c/(1−margen%). */
export function targetPrice(unitVariableCost: number, targetMarginPct: number): number {
  const marginFraction = targetMarginPct / 100;
  return marginFraction < 1 ? unitVariableCost / (1 - marginFraction) : Infinity;
}

/** Precio que maximiza ingresos: Ingresos(P) = P×(a+bP), máximo en P = −a / (2b). */
export function revenueMaximizingPrice(curve: LinearDemandCurve): number | null {
  if (curve.slope >= 0) return null; // sin pendiente negativa no hay máximo interior
  return -curve.intercept / (2 * curve.slope);
}

/** Precio que maximiza utilidad: Utilidad(P) = (P−c)×(a+bP), máximo en P = (b·c − a) / (2b). */
export function profitMaximizingPrice(curve: LinearDemandCurve, unitVariableCost: number): number | null {
  if (curve.slope >= 0) return null;
  return (curve.slope * unitVariableCost - curve.intercept) / (2 * curve.slope);
}

/** Precio psicológico: redondea al entero más cercano y termina en `.90` (charm pricing). */
export function psychologicalPrice(price: number, ending: number = 0.9): number {
  if (price <= 0) return 0;
  const rounded = Math.round(price);
  return rounded > 0 ? rounded - 1 + ending : ending;
}

// ---------------------------------------------------------------------------
// Series para gráficos Precio vs Demanda/Ingresos/Utilidad/Margen (spec §6)
// ---------------------------------------------------------------------------

export function demandAtPrice(curve: LinearDemandCurve, price: number): number {
  return Math.max(0, curve.intercept + curve.slope * price);
}

export function revenueAtPrice(curve: LinearDemandCurve, price: number): number {
  return price * demandAtPrice(curve, price);
}

export function profitAtPrice(curve: LinearDemandCurve, price: number, unitVariableCost: number): number {
  return (price - unitVariableCost) * demandAtPrice(curve, price);
}

export function marginPctAtPrice(price: number, unitVariableCost: number): number {
  return price !== 0 ? ((price - unitVariableCost) / price) * 100 : 0;
}

export interface PriceCurvePoint {
  price: number;
  demand: number;
  revenue: number;
  profit: number;
  marginPct: number;
}

export function buildPriceCurveSeries(
  curve: LinearDemandCurve,
  unitVariableCost: number,
  range: { min: number; max: number; steps: number }
): PriceCurvePoint[] {
  const steps = Math.max(2, range.steps);
  const step = (range.max - range.min) / (steps - 1);
  const points: PriceCurvePoint[] = [];
  for (let i = 0; i < steps; i++) {
    const price = range.min + step * i;
    points.push({
      price,
      demand: demandAtPrice(curve, price),
      revenue: revenueAtPrice(curve, price),
      profit: profitAtPrice(curve, price, unitVariableCost),
      marginPct: marginPctAtPrice(price, unitVariableCost),
    });
  }
  return points;
}
