"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PlanCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import { MAX_COMPANIES_PER_PLAN, PLANS } from "@/lib/plans";
import type { ActionState } from "@/lib/actions/auth-actions";

const companyProfileSchema = z.object({
  name: z.string().min(2, "El nombre del negocio es muy corto"),
  country: z.string().min(2),
  city: z.string().min(2),
  currency: z.string().min(3),
  sector: z.string().optional(),
  employeeCount: z.coerce.number().int().nonnegative().optional(),
  taxRatePct: z.coerce.number().min(0).max(100),
});

export async function updateCompanyProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = companyProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del negocio." };

  await prisma.company.update({
    where: { id: company.id },
    data: { ...parsed.data, sector: parsed.data.sector || null },
  });

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/escenarios");
  revalidatePath("/inversion");
  return { success: true };
}

export async function updateUserPlan(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { session } = await requireCompany();
  const planCode = formData.get("planCode") as PlanCode;

  if (!PLANS[planCode]?.available) {
    return { error: "Ese plan todavía no está disponible." };
  }

  const companyCount = await prisma.company.count({ where: { userId: session.user.id } });
  const newLimit = MAX_COMPANIES_PER_PLAN[planCode];
  if (companyCount > newLimit) {
    return { error: `No puedes bajar a este plan: tienes ${companyCount} empresas y este plan permite hasta ${newLimit}.` };
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { planCode } });
  revalidatePath("/perfil");
  return { success: true };
}
