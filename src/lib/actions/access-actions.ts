"use server";

/**
 * Acceso Cross-Account del plan CONSULTOR (spec §25). Solo el dueño de la
 * empresa puede otorgar o revocar acceso — `requireCompanyOwner()`, nunca el
 * guard general `requireCompany()` (que sí reconoce estos grants para todo
 * lo demás). El acceso solo se otorga a una cuenta que ya existe en
 * EMPRENDE AI — no hay invitación por correo a alguien sin cuenta.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompanyOwner, requireSession } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const grantSchema = z.object({
  companyId: z.string().min(1),
  email: z.string().email("Ingresa un email válido"),
});

export async function grantCompanyAccess(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = grantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el email." };

  const { session, company } = await requireCompanyOwner(parsed.data.companyId);

  const targetUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!targetUser) return { error: "Esa cuenta no existe en EMPRENDE AI todavía." };
  if (targetUser.id === session.user.id) return { error: "Ya sos el dueño de esta empresa." };

  const existing = await prisma.companyAccessGrant.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: targetUser.id } },
  });
  if (existing) return { error: "Ese usuario ya tiene acceso a esta empresa." };

  await prisma.companyAccessGrant.create({
    data: { companyId: company.id, userId: targetUser.id, grantedById: session.user.id },
  });

  revalidatePath("/negocios");
  return { success: true };
}

/** `formData` trae el id en el campo "id" — mismo contrato que el resto de los `DeleteButton` de la plataforma. */
export async function revokeCompanyAccess(formData: FormData): Promise<void> {
  const session = await requireSession();
  const grantId = formData.get("id") as string;

  const grant = await prisma.companyAccessGrant.findUnique({
    where: { id: grantId },
    include: { company: { select: { userId: true } } },
  });
  if (!grant || grant.company.userId !== session.user.id) throw new Error("No sos el dueño de esta empresa.");

  await prisma.companyAccessGrant.delete({ where: { id: grantId } });
  revalidatePath("/negocios");
}
