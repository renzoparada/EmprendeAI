/**
 * Narrativa IA por escenario — spec §17.2/§17.4. El motor financiero ya
 * calculó `assumptions` y `results` (contexto de solo lectura); la IA
 * SOLO redacta el objeto `narrative`. Si no puede producir un JSON válido,
 * se devuelve `narrative: null` — nunca se publica texto sin validar
 * (spec §17.4: "un JSON inválido no se publica").
 */
import "server-only";
import { z } from "zod";
import { generateStructuredJson } from "@/lib/ai/structured";

export const ScenarioNarrativeSchema = z.object({
  summary: z.string().min(1),
  extended: z.string().min(1),
  recommended_action: z.string().min(1),
  trigger_condition: z.string().min(1),
});

export type ScenarioNarrative = z.infer<typeof ScenarioNarrativeSchema>;

export interface ScenarioNarrativeContext {
  companyName: string;
  currency: string;
  scenarioType: "pesimista" | "base" | "optimista";
  assumptions: { variable: string; change_pct: number; unit: string }[];
  results: Record<string, number | null>;
  resultsVsBasePct: number | null;
}

function buildPrompt(ctx: ScenarioNarrativeContext): string {
  return `Eres EMPRENDE AI. Vas a redactar el análisis narrativo de UN escenario financiero para "${ctx.companyName}".

Estos datos ya fueron calculados por el Financial Engine (no los recalcules, no los cuestiones, úsalos tal cual):
- Escenario: ${ctx.scenarioType}
- Supuestos: ${JSON.stringify(ctx.assumptions)}
- Resultados (moneda ${ctx.currency}): ${JSON.stringify(ctx.results)}
- Variación de utilidad neta vs. escenario Base: ${ctx.resultsVsBasePct != null ? `${ctx.resultsVsBasePct.toFixed(1)}%` : "no aplica (es el escenario Base)"}

Responde ÚNICAMENTE con un objeto JSON (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "summary": "3-5 líneas, lenguaje simple, cuantitativo",
  "extended": "párrafo más extenso, mismo estilo que summary pero con más detalle",
  "recommended_action": "una acción concreta y accionable si este escenario se materializa",
  "trigger_condition": "qué señal observable indicaría que este escenario se está materializando"
}

Reglas: nunca inventes una cifra que no esté en "Resultados" o "Supuestos" de arriba. Sé específico y cuantitativo (spec de estilo: nunca digas solo "el margen bajó", di cuánto y por qué). Responde en español.`;
}

export interface ScenarioNarrativeOutcome {
  narrative: ScenarioNarrative | null;
  missingData: string[];
}

export async function generateScenarioNarrative(ctx: ScenarioNarrativeContext): Promise<ScenarioNarrativeOutcome> {
  const { data, missingData } = await generateStructuredJson(ScenarioNarrativeSchema, buildPrompt(ctx));
  return { narrative: data, missingData };
}
