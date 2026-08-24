"use server";

import { revalidatePath } from "next/cache";
import { PlanCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/actions/guard";

/**
 * Cambio de plan por un administrador (spec §25, Panel Admin › planes). No
 * hay pasarela de pago integrada — este es el único mecanismo real para
 * mover a un usuario de plan hoy.
 */
export async function adminUpdateUserPlan(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const planCode = formData.get("planCode") as PlanCode;
  if (!userId || !Object.values(PlanCode).includes(planCode)) return;

  await prisma.user.update({ where: { id: userId }, data: { planCode } });
  revalidatePath("/admin/usuarios");
}
