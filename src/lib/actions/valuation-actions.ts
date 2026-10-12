"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const num = () => z.coerce.number();
const nullableNum = () => z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().optional());

const assumptionsSchema = z.object({
  riskFreeRatePct: num(),
  beta: num(),
  marketReturnPct: num(),
  costOfDebtPct: num(),
  debtRatioPct: num().min(0).max(100),

  fclGrowthPct: num(),
  terminalGrowthPct: num(),
  projectionYears: z.coerce.number().int().min(1).max(15),

  evEbitdaMultiple: nullableNum(),
  evSalesMultiple: nullableNum(),
  peMultiple: nullableNum(),

  berkusFactorCap: num().min(0),
  berkusIdea: num().min(0),
  berkusPrototype: num().min(0),
  berkusTeam: num().min(0),
  berkusRelationships: num().min(0),
  berkusInitialSales: num().min(0),

  scorecardComparableAvg: nullableNum(),
  scorecardManagementScorePct: num().min(0),
  scorecardOpportunityScorePct: num().min(0),
  scorecardProductScorePct: num().min(0),
  scorecardCompetitionScorePct: num().min(0),
  scorecardMarketingScorePct: num().min(0),
  scorecardNeedInvestmentScorePct: num().min(0),

  vcExitValueProjected: nullableNum(),
  vcRequiredReturnMultiple: num().positive(),
  vcInvestmentAmount: nullableNum(),
});

export async function saveValuationAssumptions(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = assumptionsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los supuestos de valoración." };

  const data = {
    ...parsed.data,
    evEbitdaMultiple: parsed.data.evEbitdaMultiple ?? null,
    evSalesMultiple: parsed.data.evSalesMultiple ?? null,
    peMultiple: parsed.data.peMultiple ?? null,
    scorecardComparableAvg: parsed.data.scorecardComparableAvg ?? null,
    vcExitValueProjected: parsed.data.vcExitValueProjected ?? null,
    vcInvestmentAmount: parsed.data.vcInvestmentAmount ?? null,
  };

  await prisma.valuationAssumptions.upsert({
    where: { companyId: company.id },
    update: data,
    create: { companyId: company.id, ...data },
  });

  revalidatePath("/valoracion");
  return { success: true };
}
