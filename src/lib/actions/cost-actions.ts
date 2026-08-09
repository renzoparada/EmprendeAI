"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FixedCostCategory, VariableCostCategory, CostPeriodicity } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

function revalidateAll() {
  revalidatePath("/costos");
  revalidatePath("/dashboard");
  revalidatePath("/escenarios");
  revalidatePath("/mi-negocio");
}

// ---------------------------------------------------------------------------
// Costos fijos
// ---------------------------------------------------------------------------

const fixedCostSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.nativeEnum(FixedCostCategory),
  amount: z.coerce.number().min(0),
  periodicity: z.nativeEnum(CostPeriodicity),
  growthPct: z.coerce.number().default(0),
});

export async function saveFixedCost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = fixedCostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el costo fijo." };

  const { id, ...rest } = parsed.data;
  const data = { ...rest, companyId: company.id };

  if (id) {
    const owned = await prisma.fixedCost.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Costo no encontrado." };
    await prisma.fixedCost.update({ where: { id }, data });
  } else {
    await prisma.fixedCost.create({ data });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteFixedCost(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.fixedCost.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Costos variables
// ---------------------------------------------------------------------------

const variableCostSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.nativeEnum(VariableCostCategory),
  amountPerUnit: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().min(0).optional()),
  pctOfSales: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().min(0).max(100).optional()),
  productId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

export async function saveVariableCost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = variableCostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el costo variable." };

  const { id, ...rest } = parsed.data;
  if (rest.amountPerUnit == null && rest.pctOfSales == null) {
    return { error: "Define un monto por unidad o un % de ventas." };
  }
  const data = {
    ...rest,
    amountPerUnit: rest.amountPerUnit ?? null,
    pctOfSales: rest.pctOfSales ?? null,
    productId: rest.productId ?? null,
    companyId: company.id,
  };

  if (id) {
    const owned = await prisma.variableCost.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Costo no encontrado." };
    await prisma.variableCost.update({ where: { id }, data });
  } else {
    await prisma.variableCost.create({ data });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteVariableCost(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.variableCost.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}
