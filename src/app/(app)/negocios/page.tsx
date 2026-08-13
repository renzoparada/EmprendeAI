import Link from "next/link";
import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { setActiveCompany } from "@/lib/actions/company-actions";
import { prisma } from "@/lib/db";
import { MAX_COMPANIES_PER_PLAN, PLANS } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { USER_TYPE_LABELS, BUSINESS_TYPE_LABELS, OPERATING_STAGE_LABELS } from "@/lib/constants";

export default async function NegociosPage() {
  const { session, company: activeCompany } = await requireCompany();

  const [companies, user] = await Promise.all([
    prisma.company.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);

  const limit = MAX_COMPANIES_PER_PLAN[user.planCode];
  const atLimit = companies.length >= limit;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mis Negocios</h1>
          <p className="text-sm text-slate-500">
            Administra tus empresas (spec §20). Plan {PLANS[user.planCode].name}: hasta {Number.isFinite(limit) ? limit : "∞"} empresa(s) — tienes {companies.length}.
          </p>
        </div>
        <Button asChild disabled={atLimit}>
          <Link href={atLimit ? "/perfil" : "/negocios/nueva"}>
            <Plus className="h-4 w-4" />
            {atLimit ? "Mejora tu plan" : "Nueva empresa"}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const isActive = c.id === activeCompany.id;
          return (
            <Card key={c.id} className={isActive ? "border-emerald-500 ring-1 ring-emerald-500" : undefined}>
              <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  {isActive && <Badge>Activa</Badge>}
                </div>
                <p className="text-xs text-slate-500">
                  {USER_TYPE_LABELS[c.userType]} · {BUSINESS_TYPE_LABELS[c.businessType]}
                </p>
                <p className="text-xs text-slate-500">{OPERATING_STAGE_LABELS[c.operatingStage]}</p>
                <p className="text-xs text-slate-500">
                  {c.city}, {c.country} · {c.currency} · {c._count.products} producto(s)
                </p>
                {!isActive && (
                  <form action={setActiveCompany} className="mt-2">
                    <input type="hidden" name="companyId" value={c.id} />
                    <Button type="submit" size="sm" variant="outline" className="w-full">
                      Cambiar a esta empresa
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
