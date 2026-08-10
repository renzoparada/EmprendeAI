/**
 * Narrativa IA por escenario — spec §17.2/§17.4. El motor financiero ya
 * calculó `assumptions` y `results` (contexto de solo lectura); la IA
 * SOLO redacta el objeto `narrative`. Si no puede producir un JSON válido,
 * se devuelve `narrative: null` — nunca se publica texto sin validar
 * (spec §17.4: "un JSON inválido no se publica").
 */
import "server-only";
import { z } from "zod";
import { askEmprendeAI, isAIConfigured } from "@/lib/ai/client";

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

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
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
  if (!isAIConfigured()) {
    return { narrative: null, missingData: ["ANTHROPIC_API_KEY no configurada"] };
  }

  const prompt = buildPrompt(ctx);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await askEmprendeAI(
        "Devuelves únicamente JSON válido, sin texto adicional, sin markdown.",
        [{ role: "USER", content: attempt === 0 ? prompt : `${prompt}\n\nTu respuesta anterior no era JSON válido. Responde SOLO el objeto JSON.` }]
      );
      const parsed = ScenarioNarrativeSchema.safeParse(extractJson(raw));
      if (parsed.success) {
        return { narrative: parsed.data, missingData: [] };
      }
    } catch {
      // intenta de nuevo en el siguiente loop, o cae al retorno null de abajo
    }
  }

  return { narrative: null, missingData: ["No se pudo generar una narrativa válida para este escenario."] };
}
