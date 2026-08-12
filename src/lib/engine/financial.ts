/**
 * FINANCIAL ENGINE — motor financiero determinístico (spec §21, §27).
 *
 * Reglas de diseño (spec §0.3 / §27):
 *  - Funciones puras: sin I/O, sin acceso a DB, sin llamadas a IA. Mismos inputs
 *    siempre producen los mismos outputs — 100% testeable y auditable.
 *  - La IA (cuando se conecte en v1.1) solo puede LEER estos resultados para
 *    redactar texto; nunca recalcula ni inventa una cifra.
 *  - Cada número que se muestre en la UI debe poder trazarse a una fórmula de
 *    la spec §21 citada en el JSDoc de la función que lo produjo.
 *  - La naturaleza del dato (real / proyectado / supuesto) NO se decide aquí —
 *    depende del contexto en que se llama al engine (dato cargado por el
 *    usuario vs. escenario simulado). Se etiqueta en la capa que llama
 *    (ver `DataConfidence` y `tagConfidence`).
 */

export type DataConfidence = "real" | "proyectado" | "supuesto";

export interface Tagged<T> {
  value: T;
  confidence: DataConfidence;
}

export function tagConfidence<T>(value: T, confidence: DataConfidence): Tagged<T> {
  return { value, confidence };
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface EngineProduct {
  id: string;
  name: string;
  price: number;
  /** Costo variable unitario base (materia prima, insumos), sin comisión/impuesto/descuento. */
  variableCost: number;
  unitsSoldMonthly: number;
  commissionPct: number; // 0-100, % del precio neto
  taxPct: number; // 0-100, % del precio neto
  discountPct: number; // 0-100, % del precio de lista
}

export interface EngineVariableCost {
  id: string;
  /** Costo variable adicional por unidad, asociado a un producto específico. */
  amountPerUnit?: number | null;
  /** Costo variable como % de ventas, a nivel de toda la empresa (no ligado a un producto). */
  pctOfSales?: number | null;
  productId?: string | null;
}

export interface EngineFixedCost {
  id: string;
  /** Monto ya normalizado a base mensual. */
  amountMonthly: number;
}

// ---------------------------------------------------------------------------
// 21.1 — Rentabilidad y márgenes
// ---------------------------------------------------------------------------

export interface ProductEconomics {
  productId: string;
  netPrice: number;
  unitVariableCost: number;
  unitMargin: number;
  unitMarginPct: number;
  marginalContribution: number;
}

/**
 * Calcula la economía unitaria de un producto: precio neto (tras descuento),
 * costo variable unitario total (costo base + comisión + impuesto + costos
 * variables ligados por unidad + costos variables % de ventas a nivel
 * empresa), margen unitario, margen % y contribución marginal.
 *
 * Fórmulas: 21.1
 *   Margen unitario       = Precio − Costo Variable Unitario
 *   Margen unitario (%)   = Margen unitario / Precio × 100
 *   Contribución marginal = Margen unitario × Unidades vendidas
 */
export function computeProductEconomics(
  product: EngineProduct,
  linkedVariableCosts: EngineVariableCost[],
  companyWideVariableCostPctOfSales: number = 0
): ProductEconomics {
  const netPrice = product.price * (1 - product.discountPct / 100);
  const commissionCost = netPrice * (product.commissionPct / 100);
  const taxCost = netPrice * (product.taxPct / 100);
  const linkedPerUnitCost = linkedVariableCosts
    .filter((c) => c.productId === product.id)
    .reduce((sum, c) => sum + (c.amountPerUnit ?? 0), 0);
  const pctOfSalesCost = netPrice * (companyWideVariableCostPctOfSales / 100);

  const unitVariableCost =
    product.variableCost + commissionCost + taxCost + linkedPerUnitCost + pctOfSalesCost;
  const unitMargin = netPrice - unitVariableCost;
  const unitMarginPct = netPrice !== 0 ? (unitMargin / netPrice) * 100 : 0;
  const marginalContribution = unitMargin * product.unitsSoldMonthly;

  return {
    productId: product.id,
    netPrice,
    unitVariableCost,
    unitMargin,
    unitMarginPct,
    marginalContribution,
  };
}

export interface AggregateMargins {
  ventas: number;
  costoVariableTotal: number;
  contribucionMarginalTotal: number;
  /** Margen de contribución ponderado, usado para el punto de equilibrio monetario. */
  contributionMarginRatio: number;
  margenBrutoPct: number;
}

/**
 * Agrega la economía de todos los productos de la empresa. Es la base para
 * el punto de equilibrio (21.2), el estado de resultados y el flujo de caja.
 *
 * Fórmula: 21.1 — Margen bruto (%) = (Ventas − Costo de Ventas) / Ventas × 100
 */
export function computeAggregateMargins(economics: ProductEconomics[], products: EngineProduct[]): AggregateMargins {
  const byId = new Map(products.map((p) => [p.id, p]));
  let ventas = 0;
  let costoVariableTotal = 0;
  let contribucionMarginalTotal = 0;

  for (const e of economics) {
    const product = byId.get(e.productId);
    const units = product?.unitsSoldMonthly ?? 0;
    ventas += e.netPrice * units;
    costoVariableTotal += e.unitVariableCost * units;
    contribucionMarginalTotal += e.marginalContribution;
  }

  const contributionMarginRatio = ventas !== 0 ? contribucionMarginalTotal / ventas : 0;
  const margenBrutoPct = ventas !== 0 ? ((ventas - costoVariableTotal) / ventas) * 100 : 0;

  return { ventas, costoVariableTotal, contribucionMarginalTotal, contributionMarginRatio, margenBrutoPct };
}

// ---------------------------------------------------------------------------
// 21.2 — Punto de equilibrio
// ---------------------------------------------------------------------------

export interface BreakEven {
  /** Unidades necesarias, calculado sobre el ticket promedio ponderado. */
  units: number;
  /** Punto de equilibrio en moneda funcional. */
  amount: number;
}

/**
 * Fórmulas: 21.2
 *   PE (unidades)  = Costos Fijos / (Precio − Costo Variable Unitario)
 *   PE (monetario) = Costos Fijos / Margen de Contribución (%)
 *
 * Para negocios multi-producto se usa el ticket promedio ponderado y el
 * margen de contribución ponderado (`contributionMarginRatio`), consistente
 * con `computeAggregateMargins`.
 */
export function computeBreakEven(
  totalFixedCostsMonthly: number,
  aggregate: AggregateMargins,
  weightedUnitsSoldMonthly: number
): BreakEven {
  const amount =
    aggregate.contributionMarginRatio !== 0
      ? totalFixedCostsMonthly / aggregate.contributionMarginRatio
      : Infinity;

  const avgUnitMargin = weightedUnitsSoldMonthly !== 0 ? aggregate.contribucionMarginalTotal / weightedUnitsSoldMonthly : 0;
  const units = avgUnitMargin !== 0 ? totalFixedCostsMonthly / avgUnitMargin : Infinity;

  return { units, amount };
}

// ---------------------------------------------------------------------------
// 21.3 — Rentabilidad sobre inversión (subset MVP: ROI, Payback)
// ---------------------------------------------------------------------------

/** ROI (%) = (Utilidad Neta / Inversión Total) × 100 */
export function computeRoi(utilidadNeta: number, inversionTotal: number): number {
  return inversionTotal !== 0 ? (utilidadNeta / inversionTotal) * 100 : 0;
}

/** Payback (meses) = Inversión Inicial / Flujo de Caja Promedio Mensual */
export function computePaybackMonths(inversionInicial: number, flujoCajaPromedioMensual: number): number {
  return flujoCajaPromedioMensual > 0 ? inversionInicial / flujoCajaPromedioMensual : Infinity;
}

// ---------------------------------------------------------------------------
// 21.4 — VAN y TIR
// ---------------------------------------------------------------------------

/** VAN = Σ [FCt / (1+r)^t] − Inversión Inicial (t = 1..n). `discountRatePct` en %. */
export function computeNPV(cashFlows: number[], discountRatePct: number, initialInvestment: number): number {
  const r = discountRatePct / 100;
  const presentValue = cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + r, i + 1), 0);
  return presentValue - initialInvestment;
}

/**
 * TIR = tasa r que hace VAN = 0 — resolución numérica por bisección entre
 * -99% y 1000%, robusta para flujos convencionales (inversión inicial
 * negativa seguida de flujos positivos). Si no hay cambio de signo en ese
 * rango no se puede resolver de forma confiable — devuelve `null` en vez de
 * inventar una tasa (spec §0.3).
 */
export function computeIRR(cashFlows: number[], initialInvestment: number): number | null {
  const npvAtRate = (ratePct: number) => computeNPV(cashFlows, ratePct, initialInvestment);
  let lo = -99;
  let hi = 1000;
  const npvLo = npvAtRate(lo);
  const npvHi = npvAtRate(hi);
  if (npvLo === 0) return lo;
  if (npvHi === 0) return hi;
  if (Math.sign(npvLo) === Math.sign(npvHi)) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = npvAtRate(mid);
    if (Math.abs(npvMid) < 1e-6) return mid;
    if (Math.sign(npvMid) === Math.sign(npvLo)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// §8 — Estado de resultados
// ---------------------------------------------------------------------------

export interface IncomeStatement {
  ventas: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  ebitda: number;
  /** No modelada en el MVP (sin cronograma de depreciación aún) — queda en 0. */
  depreciacion: number;
  ebit: number;
  impuestos: number;
  utilidadNeta: number;
  margenNetoPct: number;
}

/**
 * Ventas → Costo de Ventas → Utilidad Bruta → Gastos Operativos → EBITDA →
 * Depreciación → EBIT → Impuestos → Utilidad Neta (spec §8).
 * Margen neto: fórmula 21.1.
 */
export function buildIncomeStatement(
  aggregate: AggregateMargins,
  totalFixedCostsMonthly: number,
  taxRatePct: number
): IncomeStatement {
  const { ventas, costoVariableTotal: costoVentas } = aggregate;
  const utilidadBruta = ventas - costoVentas;
  const gastosOperativos = totalFixedCostsMonthly;
  const ebitda = utilidadBruta - gastosOperativos;
  const depreciacion = 0;
  const ebit = ebitda - depreciacion;
  const impuestos = ebit > 0 ? ebit * (taxRatePct / 100) : 0;
  const utilidadNeta = ebit - impuestos;
  const margenNetoPct = ventas !== 0 ? (utilidadNeta / ventas) * 100 : 0;

  return { ventas, costoVentas, utilidadBruta, gastosOperativos, ebitda, depreciacion, ebit, impuestos, utilidadNeta, margenNetoPct };
}

// ---------------------------------------------------------------------------
// §8 — Flujo de caja mensual
// ---------------------------------------------------------------------------

export interface CashFlow {
  saldoInicial: number;
  ingresos: number;
  egresos: number;
  flujoNeto: number;
  saldoFinal: number;
  alertaFlujoNegativo: boolean;
}

/**
 * Flujo de caja simplificado del MVP: ingresos = ventas del período,
 * egresos = costo de ventas + gastos operativos + impuestos (no hay módulo
 * de financiamiento/deuda todavía — spec §14 llega en v1.2+). Como el MVP no
 * modela partidas no monetarias más allá de la utilidad neta, el flujo neto
 * operativo coincide con `IncomeStatement.utilidadNeta`; se calcula aquí de
 * forma independiente para no acoplar los dos conceptos cuando se agregue
 * depreciación/financiamiento real.
 */
export function buildCashFlow(saldoInicial: number, statement: IncomeStatement): CashFlow {
  const ingresos = statement.ventas;
  const egresos = statement.costoVentas + statement.gastosOperativos + statement.impuestos;
  const flujoNeto = ingresos - egresos;
  const saldoFinal = saldoInicial + flujoNeto;

  return {
    saldoInicial,
    ingresos,
    egresos,
    flujoNeto,
    saldoFinal,
    alertaFlujoNegativo: flujoNeto < 0 || saldoFinal < 0,
  };
}

// ---------------------------------------------------------------------------
// Utilidades de inversión (§5)
// ---------------------------------------------------------------------------

export function totalInvestment(amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}

// ---------------------------------------------------------------------------
// Snapshot compuesto — orquesta el pipeline completo del engine
// ---------------------------------------------------------------------------

export interface CompanySnapshot {
  economics: ProductEconomics[];
  aggregate: AggregateMargins;
  breakEven: BreakEven;
  statement: IncomeStatement;
  cashFlow: CashFlow;
  weightedUnitsSoldMonthly: number;
}

/**
 * Corre el pipeline completo (economía por producto → agregados → punto de
 * equilibrio → estado de resultados → flujo de caja) para un conjunto de
 * inputs. Es el único punto de entrada que usan tanto el Dashboard (con los
 * datos reales de la empresa) como el módulo de Escenarios (con los datos
 * ajustados por `applyScenario`) — así ambos garantizan el mismo cálculo.
 */
export function buildCompanySnapshot(
  products: EngineProduct[],
  variableCosts: EngineVariableCost[],
  fixedCosts: EngineFixedCost[],
  taxRatePct: number,
  openingCashBalance: number = 0
): CompanySnapshot {
  const companyWidePctOfSales = variableCosts
    .filter((c) => !c.productId)
    .reduce((sum, c) => sum + (c.pctOfSales ?? 0), 0);

  const economics = products.map((p) => computeProductEconomics(p, variableCosts, companyWidePctOfSales));
  const aggregate = computeAggregateMargins(economics, products);
  const weightedUnitsSoldMonthly = products.reduce((sum, p) => sum + p.unitsSoldMonthly, 0);
  const totalFixedCostsMonthly = fixedCosts.reduce((sum, c) => sum + c.amountMonthly, 0);
  const breakEven = computeBreakEven(totalFixedCostsMonthly, aggregate, weightedUnitsSoldMonthly);
  const statement = buildIncomeStatement(aggregate, totalFixedCostsMonthly, taxRatePct);
  const cashFlow = buildCashFlow(openingCashBalance, statement);

  return { economics, aggregate, breakEven, statement, cashFlow, weightedUnitsSoldMonthly };
}
