/**
 * Planes SaaS (spec §25). El MVP solo activa features de FREE/STARTER; PRO,
 * BUSINESS y CONSULTOR quedan definidos aquí (para que Perfil los muestre
 * como roadmap) pero sus features no se construyen todavía.
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
    features: ["Mi Negocio", "Estructura de Costos", "Dashboard básico"],
    available: true,
  },
  STARTER: {
    code: "STARTER",
    name: "Starter",
    description: "Proyecciones, finanzas y dashboard completo.",
    features: ["Todo Free", "Inversión Inicial", "Escenarios (Pesimista/Base/Optimista)"],
    available: true,
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    description: "IA, simulaciones, Business Plan, reportes y valoración básica.",
    features: ["Todo Starter", "Chat EMPRENDE AI", "Reportes", "Valoración (1 método)"],
    available: false,
  },
  BUSINESS: {
    code: "BUSINESS",
    name: "Business",
    description: "Multiempresa, usuarios, valoración completa y Cap Table.",
    features: ["Todo Pro", "Multiempresa", "Cap Table completo", "Reporte para inversionistas"],
    available: false,
  },
  CONSULTOR: {
    code: "CONSULTOR",
    name: "Consultor",
    description: "Administra múltiples clientes y valoraciones en paralelo.",
    features: ["Todo Business", "Panel multi-cliente"],
    available: false,
  },
};

export function planFeatureList(code: PlanCode): PlanDefinition {
  return PLANS[code];
}
