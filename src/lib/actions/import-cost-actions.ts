"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const importCostSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  originCurrency: z.string().min(3).max(3),
  fobCost: z.coerce.number().min(0),
  freight: z.coerce.number().min(0).default(0),
  insurance: z.coerce.number().min(0).default(0),
  tariffPct: z.coerce.number().min(0).default(0),
  nationalizationFees: z.coerce.number().min(0).default(0),
  bankFee: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
});

function revalidateAll() {
  revalidatePath("/multimoneda");
  revalidatePath("/dashboard");
  revalidatePath("/mi-negocio");
}

export async function saveImportCost(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = importCostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de importación." };

  const { id, productId, ...rest } = parsed.data;
  const product = await prisma.product.findFirst({ where: { id: productId, companyId: company.id } });
  if (!product) return { error: "Producto no encontrado." };

  if (id) {
    const owned = await prisma.importCost.findFirst({ where: { id, productId } });
    if (!owned) return { error: "Registro no encontrado." };
    await prisma.importCost.update({ where: { id }, data: { productId, ...rest } });
  } else {
    await prisma.importCost.create({ data: { productId, ...rest } });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteImportCost(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.importCost.deleteMany({ where: { id, product: { companyId: company.id } } });
  revalidateAll();
}
