"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const pricePointSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0),
  recordedAt: z.string().optional(),
});

export async function savePricePoint(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = pricePointSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el dato histórico." };

  const { id, productId, price, quantity, recordedAt } = parsed.data;

  const product = await prisma.product.findFirst({ where: { id: productId, companyId: company.id } });
  if (!product) return { error: "Producto no encontrado." };

  const data = { productId, price, quantity, recordedAt: recordedAt ? new Date(recordedAt) : new Date() };

  if (id) {
    const owned = await prisma.pricePoint.findFirst({ where: { id, productId } });
    if (!owned) return { error: "Registro no encontrado." };
    await prisma.pricePoint.update({ where: { id }, data });
  } else {
    await prisma.pricePoint.create({ data });
  }

  revalidatePath("/precios");
  return { success: true };
}

export async function deletePricePoint(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.pricePoint.deleteMany({ where: { id, product: { companyId: company.id } } });
  revalidatePath("/precios");
}
