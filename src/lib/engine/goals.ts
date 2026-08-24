/**
 * GOAL PLANNER ENGINE — Mis Metas (spec §11). Determinístico y puro (spec
 * §27): dado un objetivo de utilidad neta o ventas, resuelve hacia atrás
 * cuánto hay que vender, cuántas unidades/clientes/leads/vendedores se
 * necesitan, reusando el mismo margen de contribución que el Financial
 * Engine (nunca un cálculo paralelo).
 */

export type GoalTargetType = "UTILIDAD_NETA" | "VENTAS";

export interface GoalPlanInputs {
  targetType: GoalTargetType;
  targetAmount: number;
  /** Margen de contribución ponderado actual (0-1), de `computeAggregateMargins`. */
  contributionMarginRatio: number;
  fixedCostsMonthly: number;
  taxRatePct: number;
  /** Ticket promedio ponderado actual, para traducir ventas a unidades. */
  avgTicket: number;
  /** Unidades que compra un cliente típico por mes — supuesto editable. */
  unitsPerCustomer: number;
  /** % de leads que se convierten en cliente — del embudo real o supuesto editable. */
  targetConversionPct: number;
  /** Leads que un vendedor puede atender por mes — supuesto editable. */
  leadsPerVendedor: number;
}

export interface GoalPlanResult {
  ventasNecesarias: number;
  unidadesNecesarias: number;
  clientesNecesarios: number;
  leadsNecesarios: number;
  vendedoresNecesarios: number;
}

/**
 * Ventas necesarias para una Utilidad Neta objetivo, invirtiendo el mismo
 * pipeline del Financial Engine (§8): Utilidad Neta = EBIT × (1 − T), y
 * EBIT = Ventas × Margen de Contribución − Costos Fijos (sin depreciación
 * modelada, igual que `buildIncomeStatement`).
 */
export function computeGoalPlan(inputs: GoalPlanInputs): GoalPlanResult | null {
  if (inputs.contributionMarginRatio <= 0) return null;

  let ventasNecesarias: number;
  if (inputs.targetType === "VENTAS") {
    ventasNecesarias = inputs.targetAmount;
  } else {
    const taxFraction = inputs.taxRatePct / 100;
    if (taxFraction >= 1) return null;
    const ebitNecesario = inputs.targetAmount / (1 - taxFraction);
    ventasNecesarias = (ebitNecesario + inputs.fixedCostsMonthly) / inputs.contributionMarginRatio;
  }

  const unidadesNecesarias = inputs.avgTicket > 0 ? ventasNecesarias / inputs.avgTicket : 0;
  const clientesNecesarios = inputs.unitsPerCustomer > 0 ? unidadesNecesarias / inputs.unitsPerCustomer : 0;
  const leadsNecesarios = inputs.targetConversionPct > 0 ? clientesNecesarios / (inputs.targetConversionPct / 100) : 0;
  const vendedoresNecesarios = inputs.leadsPerVendedor > 0 ? leadsNecesarios / inputs.leadsPerVendedor : 0;

  return { ventasNecesarias, unidadesNecesarias, clientesNecesarios, leadsNecesarios, vendedoresNecesarios };
}

/** % de avance del dato real (`current`) hacia la meta (`target`), acotado a [0, 100+]. */
export function computeGoalProgressPct(current: number, target: number): number {
  return target !== 0 ? (current / target) * 100 : 0;
}
