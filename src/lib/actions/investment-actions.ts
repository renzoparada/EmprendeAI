"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InvestmentCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const investmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.nativeEnum(InvestmentCategory),
  amount: z.coerce.number().min(0),
});

function revalidateAll() {
  revalidatePath("/inversion");
  revalidatePath("/dashboard");
}

export async function saveInvestment(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = investmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el ítem de inversión." };

  const { id, ...rest } = parsed.data;
  const data = { ...rest, companyId: company.id };

  if (id) {
    const owned = await prisma.investment.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Ítem no encontrado." };
    await prisma.investment.update({ where: { id }, data });
  } else {
    await prisma.investment.create({ data });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteInvestment(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.investment.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}
