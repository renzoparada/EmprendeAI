"use server";

/**
 * Captura de fotos mensuales para el Benchmarking Temporal (spec §20/§13).
 * Dos caminos, ambos alimentados por el mismo `CompanySnapshot` ya
 * calculado por el Financial Engine — nunca se tipea una cifra a mano:
 *
 *  - `ensureCurrentMonthSnapshot`: captura perezosa. Se llama al abrir el
 *    Dashboard; si ya existe una foto del mes calendario en curso, no hace
 *    nada. Funciona sin ningún cron externo configurado.
 *  - `captureSnapshotNow`: Server Action manual ("Actualizar snapshot de
 *    este mes" en /historico) — recaptura y sobreescribe la foto del mes en
 *    curso, marcada `MANUAL`.
 *
 * Nunca se permite cargar una cifra histórica de un mes pasado a mano — si
 * no hay foto de un mes, ese mes queda vacío (ver también /api/cron/snapshot
 * para una captura más precisa de fin de mes vía cron externo opcional).
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import { buildCompanySnapshot, type CompanySnapshot } from "@/lib/engine/financial";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";

function snapshotToMonthlyData(snapshot: CompanySnapshot) {
  return {
    ventas: snapshot.statement.ventas,
    costoVentas: snapshot.statement.costoVentas,
    utilidadBruta: snapshot.statement.utilidadBruta,
    gastosOperativos: snapshot.statement.gastosOperativos,
    ebitda: snapshot.statement.ebitda,
    utilidadNeta: snapshot.statement.utilidadNeta,
    margenNetoPct: snapshot.statement.margenNetoPct,
    flujoNeto: snapshot.cashFlow.flujoNeto,
    breakEvenAmount: Number.isFinite(snapshot.breakEven.amount) ? snapshot.breakEven.amount : null,
  };
}

/**
 * Captura perezosa: si ya existe la foto del mes calendario en curso para
 * esta empresa, no hace nada. Se ignora silenciosamente si no hay datos de
 * negocio cargados todavía (`hasData=false`) — una foto en cero el primer
 * día de uso sería un dato inicial engañoso, no uno real.
 */
export async function ensureCurrentMonthSnapshot(companyId: string, hasData: boolean, snapshot: CompanySnapshot): Promise<void> {
  if (!hasData) return;

  const now = new Date();
  const periodYear = now.getFullYear();
  const periodMonth = now.getMonth() + 1;

  const existing = await prisma.monthlySnapshot.findUnique({
    where: { companyId_periodYear_periodMonth: { companyId, periodYear, periodMonth } },
    select: { id: true },
  });
  if (existing) return;

  await prisma.monthlySnapshot.create({
    data: { companyId, periodYear, periodMonth, source: "AUTOMATICO", ...snapshotToMonthlyData(snapshot) },
  });
}

export interface CaptureSnapshotResult {
  success: boolean;
  error?: string;
}

/** Recaptura manual del mes en curso — el usuario decide explícitamente que quiere una foto actualizada. */
export async function captureSnapshotNow(): Promise<CaptureSnapshotResult> {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
  ]);

  if (products.length === 0) {
    return { success: false, error: "Carga al menos un producto/servicio en Mi Negocio antes de capturar un snapshot." };
  }

  const snapshot = buildCompanySnapshot(
    toEngineProducts(products),
    toEngineVariableCosts(variableCosts),
    toEngineFixedCosts(fixedCosts),
    company.taxRatePct
  );

  const now = new Date();
  const periodYear = now.getFullYear();
  const periodMonth = now.getMonth() + 1;

  await prisma.monthlySnapshot.upsert({
    where: { companyId_periodYear_periodMonth: { companyId: company.id, periodYear, periodMonth } },
    update: { source: "MANUAL", capturedAt: now, ...snapshotToMonthlyData(snapshot) },
    create: { companyId: company.id, periodYear, periodMonth, source: "MANUAL", ...snapshotToMonthlyData(snapshot) },
  });

  revalidatePath("/historico");
  revalidatePath("/dashboard");
  return { success: true };
}
