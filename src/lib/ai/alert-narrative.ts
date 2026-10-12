/**
 * Explicación conversacional de una alerta ya detectada por el Alert Engine
 * (spec §12: "Cada alerta incluye explicación IA y recomendación de
 * acción"). La IA NUNCA decide si una alerta existe ni cambia su severidad
 * — eso ya lo hizo `buildAlerts` con reglas determinísticas (spec §0.3). Su
 * único trabajo aquí es redactar, en lenguaje natural, por qué importa y
 * qué hacer, a partir del mensaje y la recomendación base que ya calculó
 * el motor — no puede citar una cifra que no esté en ese contexto.
 */
import "server-only";
import { z } from "zod";
import { generateStructuredJson } from "@/lib/ai/structured";

export const AlertExplanationSchema = z.object({
  explanation: z.string().min(1),
  recommendation: z.string().min(1),
});

export type AlertExplanation = z.infer<typeof AlertExplanationSchema>;

export interface AlertExplanationContext {
  companyName: string;
  currency: string;
  alertMessage: string;
  baseRecommendation: string;
}

function buildPrompt(ctx: AlertExplanationContext): string {
  return `Eres EMPRENDE AI. "${ctx.companyName}" (moneda ${ctx.currency}) recibió esta alerta, ya detectada por reglas determinísticas del sistema (no la cuestiones, no la recalcules):

Alerta: "${ctx.alertMessage}"
Recomendación base del sistema: "${ctx.baseRecommendation}"

Responde ÚNICAMENTE con un objeto JSON (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "explanation": "1-2 frases explicando en lenguaje cercano por qué esta alerta importa para este negocio",
  "recommendation": "1-3 frases con una recomendación de acción concreta, expandiendo la recomendación base — nunca la contradigas"
}

Reglas: no inventes ninguna cifra que no esté en el mensaje de la alerta de arriba. En español.`;
}

export async function generateAlertExplanation(ctx: AlertExplanationContext) {
  const { data, missingData } = await generateStructuredJson(AlertExplanationSchema, buildPrompt(ctx));
  return { explanation: data, missingData };
}
