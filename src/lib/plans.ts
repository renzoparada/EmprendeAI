/**
 * Planes SaaS (spec §25). Todas las features listadas ya están construidas
 * en la plataforma (a esta altura del roadmap ningún módulo queda detrás de
 * un gate de plan real — no hay pasarela de pago integrada todavía, así que
 * "available" solo controla si el plan aparece seleccionable en Perfil).
 * `MAX_COMPANIES_PER_PLAN` es la única regla de negocio realmente aplicada
 * (Multinegocio, spec §20) — se valida en `completeOnboarding`.
 */
import type { PlanCode } from "@prisma/client";

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  description: string;
  features: string[];
  available: boolean;
}

export const PLANS: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: "FREE",
    name: "Free",
    description: "Funciones básicas para empezar a modelar tu negocio.",
    features: ["Mi Negocio", "Estructura de Costos", "Dashboard básico", "1 empresa"],
    available: true,
  },
  STARTER: {
    code: "STARTER",
    name: "Starter",
    description: "Proyecciones, finanzas y dashboard completo.",
    features: ["Todo Free", "Inversión Inicial", "Escenarios (Pesimista/Base/Optimista)", "1 empresa"],
    available: true,
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    description: "IA, simulaciones, reportes, precificación y multimoneda.",
    features: ["Todo Starter", "Chat EMPRENDE AI", "Reportes", "Precificación", "Multimoneda", "Hasta 3 empresas"],
    available: true,
  },
  BUSINESS: {
    code: "BUSINESS",
    name: "Business",
    description: "Multiempresa, valoración completa y Cap Table.",
    features: ["Todo Pro", "Multiempresa ilimitada", "Valoración (todos los métodos)", "Cap Table + simulador de rondas"],
    available: true,
  },
  CONSULTOR: {
    code: "CONSULTOR",
    name: "Consultor",
    description: "Administra múltiples negocios propios en paralelo (ideal para consultores).",
    features: ["Todo Business", "Multiempresa ilimitada"],
    available: true,
  },
};

/**
 * Límite de empresas por plan (Multinegocio, spec §20/§25). `Infinity` =
 * sin límite. Es la única regla de plan con enforcement real en el código
 * (`completeOnboarding`, `lib/actions/onboarding-actions.ts`).
 */
export const MAX_COMPANIES_PER_PLAN: Record<PlanCode, number> = {
  FREE: 1,
  STARTER: 1,
  PRO: 3,
  BUSINESS: Infinity,
  CONSULTOR: Infinity,
};

export function planFeatureList(code: PlanCode): PlanDefinition {
  return PLANS[code];
}
