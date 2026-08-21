/**
 * Plan de acción de Mis Metas (spec §11: "genera un plan de acción"). El
 * Goal Planner Engine ya calculó ventas/unidades/clientes/leads/vendedores
 * necesarios; la IA solo redacta un resumen motivador y una lista de
 * acciones concretas — nunca recalcula ni agrega una cifra nueva.
 */
import "server-only";
import { z } from "zod";
import { generateStructuredJson } from "@/lib/ai/structured";
import type { GoalPlanResult, GoalTargetType } from "@/lib/engine/goals";

export const GoalActionPlanSchema = z.object({
  summary: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1).max(6),
});

export type GoalActionPlan = z.infer<typeof GoalActionPlanSchema>;

export interface GoalActionPlanContext {
  companyName: string;
  currency: string;
  targetType: GoalTargetType;
  targetAmount: number;
  plan: GoalPlanResult;
  currentVentas: number;
  currentUtilidadNeta: number;
}

function buildPrompt(ctx: GoalActionPlanContext): string {
  return `Eres EMPRENDE AI. "${ctx.companyName}" definió esta meta: ${ctx.targetType === "UTILIDAD_NETA" ? "Utilidad Neta" : "Ventas"} de ${ctx.targetAmount} ${ctx.currency} al mes.

El Goal Planner Engine ya calculó lo que se necesita (no lo recalcules, no lo cuestiones, úsalo tal cual):
${JSON.stringify(ctx.plan)}

Situación actual: Ventas ${ctx.currentVentas} ${ctx.currency}/mes, Utilidad Neta ${ctx.currentUtilidadNeta} ${ctx.currency}/mes.

Responde ÚNICAMENTE con un objeto JSON (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "summary": "2-3 líneas: qué tan lejos está de la meta y qué es lo más importante a resolver primero",
  "actions": ["acción concreta 1", "acción concreta 2", "..."]
}

Reglas: máximo 6 acciones, concretas y específicas para este negocio (no genéricas), en español. Nunca inventes una cifra que no esté en los datos de arriba.`;
}

export async function generateGoalActionPlan(ctx: GoalActionPlanContext) {
  const { data, missingData } = await generateStructuredJson(GoalActionPlanSchema, buildPrompt(ctx));
  return { actionPlan: data, missingData };
}
