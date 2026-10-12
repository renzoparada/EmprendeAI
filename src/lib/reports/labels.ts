import type { SolidityIndicator } from "@/lib/engine/solidity";

export const SOLIDITY_LABELS: Record<SolidityIndicator, string> = {
  verde: "🟢 Buena",
  amarillo: "🟡 A vigilar",
  rojo: "🔴 Atención",
  neutral: "⚪ Sin datos suficientes",
};

export const REPORT_TYPE_LABELS = {
  ejecutivo: "Reporte Ejecutivo",
  financiero: "Reporte Financiero / Rentabilidad",
} as const;
