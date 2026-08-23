"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession, ACTIVE_COMPANY_COOKIE } from "@/lib/actions/guard";

/**
 * Multinegocio (spec §20) + Acceso Cross-Account (spec §25): cambia la
 * empresa activa del usuario. Siempre verifica que la empresa sea propia O
 * que el usuario tenga un `CompanyAccessGrant` sobre ella antes de guardar
 * la cookie — nunca confía en el id recibido sin validarlo (mismo criterio
 * que `resolveActiveCompany` en guard.ts).
 */
export async function setActiveCompany(formData: FormData): Promise<void> {
  const companyId = formData.get("companyId") as string;
  const session = await requireSession();
  const company = await prisma.company.findFirst({
    where: { id: companyId, OR: [{ userId: session.user.id }, { accessGrants: { some: { userId: session.user.id } } }] },
  });
  if (!company) throw new Error("Empresa no encontrada.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
