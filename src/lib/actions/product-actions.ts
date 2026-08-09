"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/actions/guard";
import type { ActionState } from "@/lib/actions/auth-actions";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.string().optional(),
  type: z.nativeEnum(ProductType),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  variableCost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  unitsSoldMonthly: z.coerce.number().min(0),
  commissionPct: z.coerce.number().min(0).max(100),
  taxPct: z.coerce.number().min(0).max(100),
  discountPct: z.coerce.number().min(0).max(100),
});

function revalidateAll() {
  revalidatePath("/mi-negocio");
  revalidatePath("/dashboard");
  revalidatePath("/escenarios");
}

export async function saveProduct(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del producto." };
  }

  const { id, category, ...rest } = parsed.data;
  const data = { ...rest, category: category || null, companyId: company.id };

  if (id) {
    const owned = await prisma.product.findFirst({ where: { id, companyId: company.id } });
    if (!owned) return { error: "Producto no encontrado." };
    await prisma.product.update({ where: { id }, data });
  } else {
    await prisma.product.create({ data });
  }

  revalidateAll();
  return { success: true };
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const { company } = await requireCompany();
  const id = formData.get("id") as string;
  await prisma.product.deleteMany({ where: { id, companyId: company.id } });
  revalidateAll();
}
