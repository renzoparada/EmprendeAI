"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ShareholderType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import { computeNewSharesIssued, computePricePerShare } from "@/lib/engine/captable";
import type { ActionState } from "@/lib/actions/auth-actions";

function revalidateAll() {
  revalidatePath("/socios");
  revalidatePath("/valoracion");
}

// ---------------------------------------------------------------------------
// Socios
// ---------------------------------------------------------------------------

const shareholderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.nativeEnum(ShareholderType),
});

export async function saveShareholder(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = shareholderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del socio." };

  const { id, ...rest } = parsed.data;
  if (id) {
    const owned = await prisma.shareholder.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Socio no encontrado." };
    await prisma.shareholder.update({ where: { id }, data: rest });
  } else {
    await prisma.shareholder.create({ data: { ...rest, companyId: company.id } });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteShareholder(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.shareholder.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Participaciones (Cap Table Entries)
// ---------------------------------------------------------------------------

const capTableEntrySchema = z.object({
  id: z.string().optional(),
  shareholderId: z.string().min(1),
  shares: z.coerce.number().positive("Las acciones/participaciones deben ser mayor a 0"),
  isPreferred: z.coerce.boolean().optional().default(false),
  liquidationPreferenceMultiple: z.coerce.number().min(0).default(1),
  investedAmount: z.coerce.number().min(0).default(0),
});

export async function saveCapTableEntry(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const raw = Object.fromEntries(formData);
  const parsed = capTableEntrySchema.safeParse({ ...raw, isPreferred: raw.isPreferred === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa la participación." };

  const { id, ...rest } = parsed.data;
  const shareholder = await prisma.shareholder.findFirst({ where: { id: rest.shareholderId, companyId: company.id } });
  if (!shareholder) return { error: "Socio no encontrado." };

  if (id) {
    const owned = await prisma.capTableEntry.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Participación no encontrada." };
    await prisma.capTableEntry.update({ where: { id }, data: rest });
  } else {
    await prisma.capTableEntry.create({ data: { ...rest, companyId: company.id } });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteCapTableEntry(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.capTableEntry.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Confirmar ronda simulada → persiste FundingRound + nueva participación
// ---------------------------------------------------------------------------

const confirmRoundSchema = z.object({
  name: z.string().min(1, "Ponle un nombre a la ronda"),
  preMoneyValuation: z.coerce.number().positive(),
  investmentAmount: z.coerce.number().positive(),
  newInvestorName: z.string().min(1, "El nombre del inversionista es obligatorio"),
  isPreferred: z.coerce.boolean().optional().default(true),
  liquidationPreferenceMultiple: z.coerce.number().min(0).default(1),
});

export async function confirmFundingRound(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const raw = Object.fromEntries(formData);
  const parsed = confirmRoundSchema.safeParse({ ...raw, isPreferred: raw.isPreferred !== "off" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de la ronda." };

  const { name, preMoneyValuation, investmentAmount, newInvestorName, isPreferred, liquidationPreferenceMultiple } = parsed.data;

  const existingEntries = await prisma.capTableEntry.findMany({ where: { companyId: company.id } });
  const totalSharesBefore = existingEntries.reduce((sum, e) => sum + e.shares, 0);

  if (totalSharesBefore === 0) {
    return { error: "Registra al menos un socio con participaciones antes de simular una ronda." };
  }

  const pricePerShare = computePricePerShare(preMoneyValuation, totalSharesBefore);
  const newSharesIssued = computeNewSharesIssued(investmentAmount, pricePerShare);

  const round = await prisma.fundingRound.create({
    data: { companyId: company.id, name, preMoneyValuation, investmentAmount, pricePerShare },
  });

  const investor = await prisma.shareholder.create({
    data: { companyId: company.id, name: newInvestorName, type: "INVERSIONISTA" },
  });

  await prisma.capTableEntry.create({
    data: {
      companyId: company.id,
      shareholderId: investor.id,
      shares: newSharesIssued,
      isPreferred,
      liquidationPreferenceMultiple,
      investedAmount: investmentAmount,
      fundingRoundId: round.id,
    },
  });

  revalidateAll();
  return { success: true };
}
