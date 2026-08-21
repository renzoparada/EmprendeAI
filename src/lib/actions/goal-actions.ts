"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GoalTargetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import { buildCompanySnapshot, computeAggregateMargins, computeProductEconomics } from "@/lib/engine/financial";
import { computeGoalPlan } from "@/lib/engine/goals";
import { generateGoalActionPlan, type GoalActionPlan } from "@/lib/ai/goal-narrative";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import type { ActionState } from "@/lib/actions/auth-actions";

const goalSchema = z.object({
  targetType: z.nativeEnum(GoalTargetType),
  targetAmount: z.coerce.number().positive("La meta debe ser mayor a 0"),
  targetConversionPct: z.coerce.number().min(0.1).max(100),
  leadsPerVendedor: z.coerce.number().positive(),
  unitsPerCustomer: z.coerce.number().positive(),
});

export async function saveGoal(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de la meta." };

  await prisma.goal.upsert({
    where: { companyId: company.id },
    update: parsed.data,
    create: { companyId: company.id, ...parsed.data },
  });

  revalidatePath("/metas");
  return { success: true };
}

export interface GoalActionPlanResult {
  actionPlan: GoalActionPlan | null;
  error?: string;
}

export async function generateActionPlanForGoal(): Promise<GoalActionPlanResult> {
  const { company } = await requireCompany();

  const [goal, products, fixedCosts, variableCosts, funnel] = await Promise.all([
    prisma.goal.findUnique({ where: { companyId: company.id } }),
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.salesFunnel.findUnique({ where: { companyId: company.id } }),
  ]);

  if (!goal) return { actionPlan: null, error: "Define una meta primero." };

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);

  const economics = engineProducts.map((p) => computeProductEconomics(p, engineVariableCosts));
  const aggregate = computeAggregateMargins(economics, engineProducts);
  const totalUnits = engineProducts.reduce((sum, p) => sum + p.unitsSoldMonthly, 0);
  const avgTicket = totalUnits > 0 ? aggregate.ventas / totalUnits : funnel?.avgTicket ?? 0;

  const plan = computeGoalPlan({
    targetType: goal.targetType,
    targetAmount: goal.targetAmount,
    contributionMarginRatio: aggregate.contributionMarginRatio,
    fixedCostsMonthly: engineFixedCosts.reduce((sum, c) => sum + c.amountMonthly, 0),
    taxRatePct: company.taxRatePct,
    avgTicket,
    unitsPerCustomer: goal.unitsPerCustomer,
    targetConversionPct: goal.targetConversionPct,
    leadsPerVendedor: goal.leadsPerVendedor,
  });

  if (!plan) return { actionPlan: null, error: "No se pudo calcular el plan — revisa que tengas productos con margen positivo." };

  const { actionPlan, missingData } = await generateGoalActionPlan({
    companyName: company.name,
    currency: company.currency,
    targetType: goal.targetType,
    targetAmount: goal.targetAmount,
    plan,
    currentVentas: snapshot.statement.ventas,
    currentUtilidadNeta: snapshot.statement.utilidadNeta,
  });

  if (!actionPlan) return { actionPlan: null, error: missingData.join(" ") || "No se pudo generar el plan de acción." };

  return { actionPlan };
}
