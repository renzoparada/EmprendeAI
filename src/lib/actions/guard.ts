import "server-only";
import { redirect } from "next/navigation";
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

export async function requireCompany() {
  const session = await requireSession();
  const company = await prisma.company.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!company) redirect("/onboarding");
  return { session, company };
}
