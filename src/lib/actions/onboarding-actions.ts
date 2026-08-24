"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  BusinessType,
  OperatingStage,
  UserType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession, ACTIVE_COMPANY_COOKIE } from "@/lib/actions/guard";
import { DEFAULT_SCENARIO_DELTAS } from "@/lib/engine/scenarios";
import { MAX_COMPANIES_PER_PLAN, PLANS } from "@/lib/plans";
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

  // Multinegocio (spec §20): el límite de empresas por plan es la única
  // regla de plan con enforcement real — se valida siempre contra la DB,
  // nunca contra algo que venga del cliente.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const existingCompanyCount = await prisma.company.count({ where: { userId: user.id } });
  const companyLimit = MAX_COMPANIES_PER_PLAN[user.planCode];
  if (existingCompanyCount >= companyLimit) {
    return {
      error: `Tu plan ${PLANS[user.planCode].name} permite hasta ${Number.isFinite(companyLimit) ? companyLimit : "∞"} empresa(s). Mejora tu plan en Perfil para agregar más.`,
    };
  }

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

  // La empresa recién creada pasa a ser la activa (relevante cuando el
  // usuario ya tenía otras — Multinegocio).
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, company.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
