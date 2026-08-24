"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const funnelSchema = z.object({
  leads: z.coerce.number().min(0),
  contactos: z.coerce.number().min(0),
  prospectos: z.coerce.number().min(0),
  reuniones: z.coerce.number().min(0),
  cotizaciones: z.coerce.number().min(0),
  negociaciones: z.coerce.number().min(0),
  ventas: z.coerce.number().min(0),
  avgTicket: z.coerce.number().min(0),
  marketingSpend: z.coerce.number().min(0),
  purchaseFrequencyPerYear: z.coerce.number().min(0),
  customerLifetimeYears: z.coerce.number().min(0),
});

export async function saveSalesFunnel(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = funnelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del embudo." };

  await prisma.salesFunnel.upsert({
    where: { companyId: company.id },
    update: parsed.data,
    create: { companyId: company.id, ...parsed.data },
  });

  revalidatePath("/ventas");
  revalidatePath("/metas");
  return { success: true };
}
