"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FinancingType, GraceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const financingSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es obligatorio"),
    type: z.nativeEnum(FinancingType),
    principal: z.coerce.number().positive("El monto debe ser mayor a 0"),
    annualInterestRatePct: z.coerce.number().min(0).max(100),
    termMonths: z.coerce.number().int().positive("El plazo debe ser mayor a 0"),
    gracePeriodMonths: z.coerce.number().int().min(0),
    graceType: z.nativeEnum(GraceType),
  })
  .refine((data) => data.graceType === "NINGUNA" || data.gracePeriodMonths < data.termMonths, {
    message: "El período de gracia debe ser menor al plazo total.",
    path: ["gracePeriodMonths"],
  });

function revalidateAll() {
  revalidatePath("/financiamiento");
  revalidatePath("/dashboard");
}

export async function saveFinancingPlan(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = financingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del financiamiento." };

  const { id, ...rest } = parsed.data;
  const gracePeriodMonths = rest.graceType === "NINGUNA" ? 0 : rest.gracePeriodMonths;
  const data = { ...rest, gracePeriodMonths, companyId: company.id };

  if (id) {
    const owned = await prisma.financingPlan.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Financiamiento no encontrado." };
    await prisma.financingPlan.update({ where: { id }, data });
  } else {
    await prisma.financingPlan.create({ data });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteFinancingPlan(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.financingPlan.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}
