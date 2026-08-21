/**
 * Borrador de secciones cualitativas del Business Plan (spec §18: "todo
 * conectado al modelo financiero real, no generado de forma aislada"). La IA
 * solo redacta texto de arranque para secciones cualitativas (Problema,
 * Solución, Mercado, etc.) apoyándose en el contexto real de la empresa y en
 * los números ya calculados por el Financial Engine — nunca inventa una
 * cifra que no esté en ese contexto. Las secciones cuantitativas (Inversión,
 * Proyección financiera, Riesgos) NO pasan por aquí: se renderizan en vivo
 * desde los motores en la página, spec §18.
 */
import "server-only";
import { z } from "zod";
import type { BusinessPlanSectionKey } from "@prisma/client";
import { generateStructuredJson } from "@/lib/ai/structured";
import { BUSINESS_PLAN_SECTION_LABELS } from "@/lib/constants";

export const BusinessPlanDraftSchema = z.object({
  draft: z.string().min(1),
});

export type BusinessPlanDraft = z.infer<typeof BusinessPlanDraftSchema>;

const SECTION_GUIDANCE: Record<BusinessPlanSectionKey, string> = {
  RESUMEN_EJECUTIVO: "Resume en un párrafo qué hace el negocio, a quién sirve y por qué es una oportunidad, usando los datos reales de abajo.",
  PROBLEMA: "Describe el problema o necesidad concreta que el negocio resuelve para su cliente objetivo.",
  SOLUCION: "Explica cómo el producto/servicio resuelve ese problema, en términos simples.",
  PRODUCTO: "Describe el producto o servicio principal a partir de los productos/servicios ya cargados.",
  MERCADO: "Describe el mercado y la oportunidad, sin inventar tamaños de mercado (TAM/SAM/SOM) que no estén en los datos — si no hay datos de mercado, dilo explícitamente y sugiere investigarlo.",
  CLIENTE_OBJETIVO: "Describe el perfil del cliente objetivo (segmento, necesidades) de forma cualitativa.",
  MODELO_NEGOCIO: "Explica cómo el negocio genera ingresos, apoyándote en los productos y el margen de contribución ya calculados.",
  COMPETENCIA: "Sugiere cómo posicionar el negocio frente a la competencia; no inventes nombres de competidores reales, deja un marcador para que el usuario los complete.",
  MARKETING: "Sugiere un enfoque de marketing y adquisición coherente con el embudo de ventas ya cargado (si existe).",
  VENTAS: "Describe el proceso de ventas apoyándote en el embudo comercial ya cargado (si existe).",
  OPERACIONES: "Describe brevemente cómo opera el negocio día a día.",
  EQUIPO: "Deja un marcador para que el usuario describa al equipo fundador — no inventes nombres ni roles.",
  ESTRATEGIA: "Sugiere 2-3 prioridades estratégicas de corto plazo, coherentes con la solidez financiera actual (márgenes, flujo de caja) ya calculada.",
};

export interface BusinessPlanDraftContext {
  companyName: string;
  sector: string;
  businessType: string;
  currency: string;
  sectionKey: BusinessPlanSectionKey;
  productNames: string[];
  ventasMensuales: number;
  utilidadNetaMensual: number;
  margenNetoPct: number;
  hasFunnel: boolean;
}

function buildPrompt(ctx: BusinessPlanDraftContext): string {
  return `Eres EMPRENDE AI, copiloto financiero y estratégico. "${ctx.companyName}" (sector: ${ctx.sector}, tipo: ${ctx.businessType}) está redactando su Business Plan.

Sección a redactar: "${BUSINESS_PLAN_SECTION_LABELS[ctx.sectionKey]}".
Guía específica de esta sección: ${SECTION_GUIDANCE[ctx.sectionKey]}

Datos reales ya calculados (no los recalcules, no inventes otros):
- Productos/servicios cargados: ${ctx.productNames.length > 0 ? ctx.productNames.join(", ") : "ninguno cargado todavía"}
- Ventas mensuales: ${ctx.ventasMensuales} ${ctx.currency}
- Utilidad neta mensual: ${ctx.utilidadNetaMensual} ${ctx.currency}
- Margen neto: ${ctx.margenNetoPct.toFixed(1)}%
- Embudo de ventas cargado: ${ctx.hasFunnel ? "sí" : "no"}

Responde ÚNICAMENTE con un objeto JSON (sin texto antes ni después, sin markdown) con esta forma exacta:
{ "draft": "el texto de la sección, en español, 2-5 párrafos cortos o una lista breve según convenga" }

Reglas: es un borrador de arranque que el usuario va a editar — no un texto final. Nunca inventes cifras, nombres de personas o de competidores que no estén en los datos de arriba; si falta información para algo específico, dilo explícitamente en el texto (ej. "completa aquí el nombre de tu competidor principal").`;
}

export async function generateBusinessPlanDraft(ctx: BusinessPlanDraftContext) {
  const { data, missingData } = await generateStructuredJson(BusinessPlanDraftSchema, buildPrompt(ctx));
  return { draft: data, missingData };
}
