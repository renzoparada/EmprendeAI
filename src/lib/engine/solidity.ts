/**
 * Semáforo de solidez del negocio (spec §2/§17.1: "🟢🟡🔴 según % de dato
 * real vs. supuesto" / salud general). Determinístico, deriva de las mismas
 * señales que ya se muestran en el Dashboard, para que el mismo negocio
 * nunca muestre un semáforo distinto en Dashboard, Reportes o el chat.
 */
import type { CompanySnapshot } from "@/lib/engine/financial";

export type SolidityIndicator = "verde" | "amarillo" | "rojo" | "neutral";

export function computeSolidityIndicator(hasData: boolean, snapshot: CompanySnapshot | null): SolidityIndicator {
  if (!hasData || !snapshot) return "neutral";

  const margenStatus: SolidityIndicator = snapshot.statement.margenNetoPct >= 20 ? "verde" : snapshot.statement.margenNetoPct >= 10 ? "amarillo" : "rojo";
  const utilidadStatus: SolidityIndicator = snapshot.statement.utilidadNeta > 0 ? "verde" : "rojo";
  const flujoStatus: SolidityIndicator = snapshot.cashFlow.alertaFlujoNegativo ? "rojo" : "verde";
  const breakEvenStatus: SolidityIndicator = !Number.isFinite(snapshot.breakEven.amount)
    ? "neutral"
    : snapshot.statement.ventas >= snapshot.breakEven.amount
      ? "verde"
      : snapshot.statement.ventas >= snapshot.breakEven.amount * 0.8
        ? "amarillo"
        : "rojo";

  const signals = [margenStatus, utilidadStatus, flujoStatus, breakEvenStatus];
  if (signals.includes("rojo")) return "rojo";
  if (signals.includes("amarillo")) return "amarillo";
  return "verde";
}
