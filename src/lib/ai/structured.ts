/**
 * Helper compartido para pedirle a la IA una respuesta JSON validada contra
 * un esquema Zod (spec §17.4: "un JSON inválido no se publica"). Usado por
 * la narrativa de escenarios y el plan de acción de Mis Metas — cualquier
 * otra sección que necesite texto de IA estructurado debería reusar esto en
 * vez de reimplementar el parseo/reintento.
 */
import "server-only";
import type { z } from "zod";
import { askEmprendeAI, isAIConfigured } from "@/lib/ai/client";

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

export interface StructuredJsonResult<T> {
  data: T | null;
  missingData: string[];
}

export async function generateStructuredJson<T>(
  schema: z.ZodType<T>,
  prompt: string,
  systemPrompt: string = "Devuelves únicamente JSON válido, sin texto adicional, sin markdown."
): Promise<StructuredJsonResult<T>> {
  if (!isAIConfigured()) {
    return { data: null, missingData: ["ANTHROPIC_API_KEY no configurada"] };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await askEmprendeAI(systemPrompt, [
        { role: "USER", content: attempt === 0 ? prompt : `${prompt}\n\nTu respuesta anterior no era JSON válido. Responde SOLO el objeto JSON.` },
      ]);
      const parsed = schema.safeParse(extractJson(response.text));
      if (parsed.success) {
        return { data: parsed.data, missingData: [] };
      }
    } catch {
      // intenta de nuevo en el siguiente loop, o cae al retorno de abajo
    }
  }

  return { data: null, missingData: ["No se pudo generar una respuesta válida."] };
}
