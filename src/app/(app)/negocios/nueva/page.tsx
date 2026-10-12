import Link from "next/link";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { MAX_COMPANIES_PER_PLAN, PLANS } from "@/lib/plans";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Button } from "@/components/ui/button";

export default async function NuevaEmpresaPage() {
  const { session } = await requireCompany();

  const [companyCount, user] = await Promise.all([
    prisma.company.count({ where: { userId: session.user.id } }),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);

  const limit = MAX_COMPANIES_PER_PLAN[user.planCode];

  if (companyCount >= limit) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Llegaste al límite de tu plan</h1>
        <p className="text-sm text-slate-500">
          Tu plan {PLANS[user.planCode].name} permite hasta {limit} empresa(s). Mejora tu plan en Perfil para agregar
          más negocios.
        </p>
        <Button asChild>
          <Link href="/perfil">Ver planes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">Agrega otro negocio</h1>
        <p className="mt-1 text-sm text-slate-500">Multinegocio (spec §20) — administra varias empresas desde la misma cuenta.</p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
