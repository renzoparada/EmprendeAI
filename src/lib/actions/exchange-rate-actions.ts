"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExchangeRateType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const exchangeRateSchema = z.object({
  fromCurrency: z.string().min(3).max(3),
  toCurrency: z.string().min(3).max(3),
  rateType: z.nativeEnum(ExchangeRateType),
  rate: z.coerce.number().positive("El tipo de cambio debe ser mayor a 0"),
});

/** Upsert por (companyId, fromCurrency, toCurrency, rateType) — spec §15.1: campos separados y editables. */
export async function saveExchangeRate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = exchangeRateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el tipo de cambio." };

  const { fromCurrency, toCurrency, rateType, rate } = parsed.data;

  await prisma.exchangeRate.upsert({
    where: { companyId_fromCurrency_toCurrency_rateType: { companyId: company.id, fromCurrency, toCurrency, rateType } },
    update: { rate, effectiveDate: new Date() },
    create: { companyId: company.id, fromCurrency, toCurrency, rateType, rate },
  });

  revalidatePath("/multimoneda");
  return { success: true };
}

export async function deleteExchangeRate(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.exchangeRate.deleteMany({ where: { id, companyId: company.id } });
  revalidatePath("/multimoneda");
}
