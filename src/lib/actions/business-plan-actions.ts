"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BusinessPlanSectionKey } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import { buildCompanySnapshot } from "@/lib/engine/financial";
import { generateBusinessPlanDraft, type BusinessPlanDraft } from "@/lib/ai/business-plan-narrative";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth-actions";

const sectionSchema = z.object({
  key: z.nativeEnum(BusinessPlanSectionKey),
  content: z.string(),
});

export async function saveBusinessPlanSection(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = sectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el contenido de la sección." };

  await prisma.businessPlanSection.upsert({
    where: { companyId_key: { companyId: company.id, key: parsed.data.key } },
    update: { content: parsed.data.content },
    create: { companyId: company.id, key: parsed.data.key, content: parsed.data.content },
  });

  revalidatePath("/plan-de-negocio");
  return { success: true };
}

export interface BusinessPlanDraftResult {
  draft: BusinessPlanDraft | null;
  error?: string;
}

export async function generateDraftForSection(sectionKey: BusinessPlanSectionKey): Promise<BusinessPlanDraftResult> {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, funnel] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.salesFunnel.findUnique({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const snapshot = buildCompanySnapshot(engineProducts, toEngineVariableCosts(variableCosts), toEngineFixedCosts(fixedCosts), company.taxRatePct);

  const { draft, missingData } = await generateBusinessPlanDraft({
    companyName: company.name,
    sector: company.sector ?? "no especificado",
    businessType: BUSINESS_TYPE_LABELS[company.businessType] ?? company.businessType,
    currency: company.currency,
    sectionKey,
    productNames: products.map((p) => p.name),
    ventasMensuales: snapshot.statement.ventas,
    utilidadNetaMensual: snapshot.statement.utilidadNeta,
    margenNetoPct: snapshot.statement.margenNetoPct,
    hasFunnel: funnel != null,
  });

  if (!draft) return { draft: null, error: missingData.join(" ") || "No se pudo generar el borrador." };

  return { draft };
}
