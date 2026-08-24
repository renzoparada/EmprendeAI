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
 *
 * Acceso Cross-Account (spec §25, plan CONSULTOR): un usuario puede
 * acceder a una empresa que no es suya si el dueño le otorgó un
 * `CompanyAccessGrant`. `resolveActiveCompany` es el ÚNICO lugar que decide
 * "esta empresa es tuya (para operar)" — reconocerlo aquí, en un solo
 * punto, hace que las ~40 Server Actions que ya llaman a `requireCompany()`
 * ganen soporte cross-account automáticamente, sin tener que auditar cada
 * una por separado. v1 da acceso completo (lectura + escritura) a quien
 * recibe el grant — no hay todavía un nivel "solo lectura" (ver README
 * "Alcance"): un puñado de acciones sensibles (otorgar/revocar acceso)
 * exigen además ser el dueño, vía `requireCompanyOwner()`.
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
 * pertenece (como dueño o por acceso otorgado), o si no la primera propia,
 * o si no tiene ninguna propia, la primera a la que tenga acceso otorgado.
 * La cookie es solo una preferencia de navegación — la verificación contra
 * la base de datos es la única fuente de verdad de multi-tenancy, nunca se
 * confía en el valor de la cookie sin validarlo.
 */
async function resolveActiveCompany(userId: string): Promise<Company | null> {
  const accessibleWhere = { OR: [{ userId }, { accessGrants: { some: { userId } } }] };

  const cookieStore = await cookies();
  const activeCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;

  if (activeCompanyId) {
    const company = await prisma.company.findFirst({ where: { id: activeCompanyId, ...accessibleWhere } });
    if (company) return company;
  }

  const owned = await prisma.company.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (owned) return owned;

  return prisma.company.findFirst({ where: { accessGrants: { some: { userId } } }, orderBy: { createdAt: "asc" } });
}

export async function requireCompany() {
  const session = await requireSession();
  const company = await resolveActiveCompany(session.user.id);
  if (!company) redirect("/onboarding");
  return { session, company, isOwner: company.userId === session.user.id };
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
 * Guard para acciones exclusivas del dueño de la empresa (spec §25):
 * otorgar/revocar acceso de consultores. A diferencia de `requireCompany`,
 * NO reconoce `CompanyAccessGrant` — solo `company.userId === session.user.id`.
 * Nunca se resuelve por cookie/cliente: siempre relee la propiedad desde la
 * base de datos para el companyId recibido.
 */
export async function requireCompanyOwner(companyId: string) {
  const session = await requireSession();
  const company = await prisma.company.findFirst({ where: { id: companyId, userId: session.user.id } });
  if (!company) throw new Error("No sos el dueño de esta empresa.");
  return { session, company };
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
