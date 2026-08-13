import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Company } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Multi-tenancy estricta (spec §26/§28): toda acción que toca datos de
 * negocio pasa por aquí. `requireCompany` resuelve SIEMPRE la empresa a
 * partir de la sesión del usuario autenticado — nunca de un id recibido del
 * cliente — así una empresa nunca puede leer/escribir datos de otra.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/** Nombre de la cookie que guarda la empresa activa (Multinegocio, spec §20). */
export const ACTIVE_COMPANY_COOKIE = "emprendeai_active_company";

/**
 * Resuelve la empresa "activa" del usuario: la de la cookie si existe y le
 * pertenece, o si no la primera que creó. La cookie es solo una preferencia
 * de navegación — la verificación de propiedad (`userId: userId`) es la
 * única fuente de verdad de multi-tenancy, nunca se confía en el valor de
 * la cookie sin validarlo contra la base de datos.
 */
async function resolveActiveCompany(userId: string): Promise<Company | null> {
  const cookieStore = await cookies();
  const activeCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;

  if (activeCompanyId) {
    const company = await prisma.company.findFirst({ where: { id: activeCompanyId, userId } });
    if (company) return company;
  }

  return prisma.company.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export async function requireCompany() {
  const session = await requireSession();
  const company = await resolveActiveCompany(session.user.id);
  if (!company) redirect("/onboarding");
  return { session, company };
}

/**
 * Variante para Route Handlers (ej. descargas de reportes): no puede usar
 * `redirect()` porque la respuesta debe ser un archivo binario, así que
 * devuelve una NextResponse de error en vez de redirigir.
 */
export async function requireCompanyForApi(): Promise<{ company: Company } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  const company = await resolveActiveCompany(session.user.id);
  if (!company) {
    return { error: NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 }) };
  }
  return { company };
}

/**
 * Panel Admin (spec §25): requiere sesión + `User.role === "ADMIN"`. Nunca
 * confía en nada del cliente — siempre relee el rol desde la base de datos.
 */
export async function requireAdmin() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") redirect("/dashboard");
  return { session, user };
}
