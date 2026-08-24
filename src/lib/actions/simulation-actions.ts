"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";
import type { InvestmentEvent } from "@/lib/engine/business-simulator";

const investmentEventSchema = z.object({
  month: z.number().int().positive(),
  name: z.string().min(1).max(80),
  amount: z.number().positive(),
});

const simulationSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Ponle un nombre a la simulación"),
    horizonMonths: z.coerce.number().int().refine((v) => [12, 24, 36, 60].includes(v), "El horizonte debe ser 12, 24, 36 o 60 meses"),
    monthlySalesGrowthPct: z.coerce.number(),
    priceAdjustmentPct: z.coerce.number(),
    annualInflationPct: z.coerce.number(),
    staffCount: z.coerce.number().int().min(0),
    avgSalary: z.coerce.number().min(0),
    monthlyStaffGrowthPct: z.coerce.number(),
    monthlyMarketingGrowthPct: z.coerce.number(),
    exchangeRateShockPct: z.coerce.number(),
    includeFinancing: z.coerce.boolean(),
    investmentEventsJson: z.string(),
  })
  .transform((data, ctx) => {
    let investmentEvents: InvestmentEvent[];
    try {
      const parsed: unknown = JSON.parse(data.investmentEventsJson || "[]");
      investmentEvents = z.array(investmentEventSchema).max(20, "Máximo 20 eventos de inversión").parse(parsed);
    } catch {
      ctx.addIssue({ code: "custom", message: "Eventos de inversión inválidos." });
      return z.NEVER;
    }
    if (investmentEvents.some((e) => e.month > data.horizonMonths)) {
      ctx.addIssue({ code: "custom", message: "Un evento de inversión cae fuera del horizonte de la simulación." });
      return z.NEVER;
    }
    return {
      id: data.id,
      name: data.name,
      horizonMonths: data.horizonMonths,
      monthlySalesGrowthPct: data.monthlySalesGrowthPct,
      priceAdjustmentPct: data.priceAdjustmentPct,
      annualInflationPct: data.annualInflationPct,
      staffCount: data.staffCount,
      avgSalary: data.avgSalary,
      monthlyStaffGrowthPct: data.monthlyStaffGrowthPct,
      monthlyMarketingGrowthPct: data.monthlyMarketingGrowthPct,
      exchangeRateShockPct: data.exchangeRateShockPct,
      includeFinancing: data.includeFinancing,
      investmentEvents,
    };
  });

function revalidateAll() {
  revalidatePath("/simulador");
}

export async function saveSimulation(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();

  const raw = Object.fromEntries(formData);
  const parsed = simulationSchema.safeParse({
    ...raw,
    horizonMonths: Number(raw.horizonMonths),
    monthlySalesGrowthPct: Number(raw.monthlySalesGrowthPct),
    priceAdjustmentPct: Number(raw.priceAdjustmentPct),
    annualInflationPct: Number(raw.annualInflationPct),
    staffCount: Number(raw.staffCount),
    avgSalary: Number(raw.avgSalary),
    monthlyStaffGrowthPct: Number(raw.monthlyStaffGrowthPct),
    monthlyMarketingGrowthPct: Number(raw.monthlyMarketingGrowthPct),
    exchangeRateShockPct: Number(raw.exchangeRateShockPct),
    includeFinancing: raw.includeFinancing === "on" || raw.includeFinancing === "true",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de la simulación." };

  const { id, investmentEvents, ...rest } = parsed.data;
  const data = { ...rest, investmentEvents: investmentEvents as object, companyId: company.id };

  if (id) {
    const owned = await prisma.businessSimulation.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Simulación no encontrada." };
    await prisma.businessSimulation.update({ where: { id }, data });
  } else {
    await prisma.businessSimulation.create({ data });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteSimulation(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.businessSimulation.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}
