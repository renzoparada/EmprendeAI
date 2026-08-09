"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ScenarioType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const scenarioSchema = z.object({
  type: z.nativeEnum(ScenarioType),
  salesDeltaPct: z.coerce.number(),
  priceDeltaPct: z.coerce.number(),
  costDeltaPct: z.coerce.number(),
});

export async function saveScenario(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = scenarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los valores del escenario." };

  const { type, ...deltas } = parsed.data;

  await prisma.scenario.upsert({
    where: { companyId_type: { companyId: company.id, type } },
    update: deltas,
    create: { companyId: company.id, type, ...deltas },
  });

  revalidatePath("/escenarios");
  revalidatePath("/dashboard");
  return { success: true };
}
