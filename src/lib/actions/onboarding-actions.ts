"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  BusinessType,
  OperatingStage,
  UserType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/actions/guard";
import { DEFAULT_SCENARIO_DELTAS } from "@/lib/engine/scenarios";
import type { ActionState } from "@/lib/actions/auth-actions";

const onboardingSchema = z.object({
  userType: z.nativeEnum(UserType),
  businessType: z.nativeEnum(BusinessType),
  name: z.string().min(2, "El nombre del negocio es muy corto"),
  country: z.string().min(2, "Indica el país"),
  city: z.string().min(2, "Indica la ciudad"),
  currency: z.string().min(3, "Selecciona una moneda"),
  sector: z.string().optional(),
  startDate: z.string().optional(),
  employeeCount: z.coerce.number().int().nonnegative().optional(),
  operatingStage: z.nativeEnum(OperatingStage),
});

export async function completeOnboarding(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const raw = Object.fromEntries(formData);
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario." };
  }

  const data = parsed.data;

  const company = await prisma.company.create({
    data: {
      userId: session.user.id,
      name: data.name,
      country: data.country,
      city: data.city,
      currency: data.currency,
      sector: data.sector || null,
      userType: data.userType,
      businessType: data.businessType,
      startDate: data.startDate ? new Date(data.startDate) : null,
      employeeCount: data.employeeCount ?? null,
      operatingStage: data.operatingStage,
      onboardingCompletedAt: new Date(),
    },
  });

  // Los tres escenarios (spec §9) se crean con deltas por defecto, editables
  // luego desde el módulo de Escenarios.
  await prisma.scenario.createMany({
    data: (Object.keys(DEFAULT_SCENARIO_DELTAS) as (keyof typeof DEFAULT_SCENARIO_DELTAS)[]).map((type) => ({
      companyId: company.id,
      type,
      ...DEFAULT_SCENARIO_DELTAS[type],
    })),
  });

  redirect("/dashboard");
}
